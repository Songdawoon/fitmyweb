import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import { getDb, quotes, type QuoteItem, type QuoteRow } from "@/lib/db";

/**
 * 주문제작 견적.
 *
 * 고정 플랜(lib/data.ts 의 plans)에 맞지 않는 건을 관리자가 직접 조립해
 * 결제 링크로 보낸다. 이 모듈이 견적의 유일한 출입구다.
 *
 * 금액에 관한 규칙은 하나뿐이다 — **총액은 언제나 computeQuoteTotal 이 만든다.**
 * 클라이언트가 보낸 total 은 저장하지도, 대조하지도 않는다. 결제 검증
 * (lib/portone.ts 의 resolveBillable)도 quotes.total 만 읽는다.
 *
 * lib/account.ts 와 같은 규약을 따른다: `const db = getDb(); if (!db) return ...`
 */

/** PG 최소 결제금액. 이보다 낮으면 결제창이 열리지 않는다. */
export const QUOTE_MIN_TOTAL = 1_000;
/** 자릿수 오타(0 하나 더) 방어. 실제 견적이 이 금액을 넘을 일은 없다. */
export const QUOTE_MAX_TOTAL = 100_000_000;

const MAX_ITEMS = 30;
const MAX_LABEL = 100;

/** 결제 링크의 비밀 열쇠. 32자 base64url = 192비트. */
function newQuoteToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * 사람이 부를 수 있는 짧은 식별자. 쿠폰 코드와 같은 알파벳(0/O, 1/I 제외)을 쓴다.
 * merchant_uid 에 실려 나가므로 비밀이 아니다 — 링크의 열쇠는 token 이다.
 */
function newQuoteRef(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let ref = "";
  for (const b of bytes) ref += alphabet[b % alphabet.length];
  return ref;
}

/**
 * 견적 결제의 주문번호.
 *
 * `qt-{REF}-{시각36}-{12hex}` = 33자. KCP 가 40자를 넘기지 못하게 하므로
 * UUID 를 쓰지 않는다(CheckoutClient 의 createMerchantUid 와 같은 이유).
 * 접두사가 고정 플랜의 `pay-` 와 달라 서로 오인되지 않는다.
 */
export function createQuoteMerchantUid(ref: string): string {
  const rand = randomBytes(6).toString("hex");
  return `qt-${ref}-${Date.now().toString(36)}-${rand}`;
}

/**
 * 견적 결제 링크의 절대 주소.
 *
 * 메일에 넣으려면 절대 주소여야 한다. 새 환경변수를 만들지 않고 이미 있는
 * NEXTAUTH_URL 을 쓴다 — 소셜 로그인 콜백이 이미 이 값에 의존하므로,
 * 이게 틀리면 로그인부터 깨져서 링크만 조용히 잘못될 일이 없다.
 */
export function quoteUrl(token: string): string {
  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://fitmyweb.com";
  return `${origin}/quote/${token}`;
}

/**
 * 클라이언트가 보낸 항목을 서버 기준으로 정규화한다.
 *
 * 프리셋 금액을 lib/data.ts 에서 다시 읽어 강제하지는 않는다 — 협의 결과에 따라
 * 관리자가 단가를 조정하는 것이 이 기능의 목적이기 때문이다. 신뢰 경계는
 * "관리자 세션" 이고, 여기서는 형식과 범위만 검사한다.
 */
export function normalizeQuoteItems(raw: unknown): QuoteItem[] {
  if (!Array.isArray(raw)) return [];

  const out: QuoteItem[] = [];
  for (const entry of raw.slice(0, MAX_ITEMS)) {
    if (!entry || typeof entry !== "object") continue;
    const r = entry as Record<string, unknown>;

    const label = typeof r.label === "string" ? r.label.trim().slice(0, MAX_LABEL) : "";
    if (!label) continue;

    const amount = Number(r.amount);
    if (!Number.isSafeInteger(amount) || Math.abs(amount) > QUOTE_MAX_TOTAL) continue;

    out.push({
      presetId: typeof r.presetId === "string" ? r.presetId.slice(0, 40) : null,
      label,
      amount,
    });
  }
  return out;
}

/** 총액은 언제나 여기서만 나온다. */
export function computeQuoteTotal(baseAmount: number, items: QuoteItem[]): number {
  return items.reduce((sum, i) => sum + i.amount, baseAmount);
}

export type QuoteInput = {
  title: string;
  note: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  baseLabel: string;
  baseAmount: number;
  items: QuoteItem[];
};

export async function createQuote(
  input: QuoteInput & { createdByEmail: string | null },
): Promise<QuoteRow | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .insert(quotes)
      .values({
        ...input,
        total: computeQuoteTotal(input.baseAmount, input.items),
        ref: newQuoteRef(),
        token: newQuoteToken(),
      })
      .returning();
    return row ?? null;
  } catch (e) {
    console.error("[quote] 생성 실패:", e);
    return null;
  }
}

/** 결제가 끝난 견적은 고칠 수 없다 — 고객이 본 금액과 영수증이 어긋나면 안 된다. */
export async function updateQuote(
  quoteId: string,
  input: QuoteInput,
): Promise<QuoteRow | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .update(quotes)
      .set({
        ...input,
        total: computeQuoteTotal(input.baseAmount, input.items),
        updatedAt: sql`now()`,
      })
      .where(and(eq(quotes.id, quoteId), sql`${quotes.status} <> 'paid'`))
      .returning();
    return row ?? null;
  } catch (e) {
    console.error("[quote] 수정 실패:", e, quoteId);
    return null;
  }
}

export async function getQuoteByToken(token: string): Promise<QuoteRow | null> {
  const db = getDb();
  if (!db || !token) return null;

  try {
    const [row] = await db.select().from(quotes).where(eq(quotes.token, token)).limit(1);
    return row ?? null;
  } catch (e) {
    console.error("[quote] 조회 실패(token):", e);
    return null;
  }
}

/**
 * id 는 결제의 custom_data 에서도 들어온다 — 외부 입력이다.
 * uuid 가 아닌 문자열이면 Postgres 가 던지므로 반드시 감싼다.
 */
export async function getQuoteById(id: string): Promise<QuoteRow | null> {
  const db = getDb();
  if (!db || !id) return null;

  try {
    const [row] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
    return row ?? null;
  } catch (e) {
    console.error("[quote] 조회 실패(id):", e);
    return null;
  }
}

export async function getQuoteByRef(ref: string): Promise<QuoteRow | null> {
  const db = getDb();
  if (!db || !ref) return null;

  try {
    const [row] = await db.select().from(quotes).where(eq(quotes.ref, ref)).limit(1);
    return row ?? null;
  } catch (e) {
    console.error("[quote] 조회 실패(ref):", e);
    return null;
  }
}

export async function listQuotes(limit = 100): Promise<QuoteRow[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt)).limit(limit);
  } catch (e) {
    console.error("[quote] 목록 조회 실패:", e);
    return null;
  }
}

/**
 * 결제 확정.
 *
 * `status='open'` 인 경우에만 이긴다. 완료 라우트와 웹훅이 같은 결제를 두 번
 * 보고하므로 두 번째 호출은 0행이 되어 조용히 지나간다(멱등). 진 쪽이 다른
 * imp_uid 였다면 그건 중복 결제이므로 호출부가 크게 로그를 남긴다.
 */
export async function markQuotePaid(
  quoteId: string,
  impUid: string,
): Promise<{ won: boolean; paidImpUid: string | null; items: QuoteItem[] }> {
  const db = getDb();
  if (!db) return { won: false, paidImpUid: null, items: [] };

  try {
    const [won] = await db
      .update(quotes)
      .set({
        status: "paid",
        paidImpUid: impUid,
        paidAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(quotes.id, quoteId), eq(quotes.status, "open")))
      .returning();

    if (won) return { won: true, paidImpUid: impUid, items: won.items };

    const [current] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
    return {
      won: false,
      paidImpUid: current?.paidImpUid ?? null,
      items: current?.items ?? [],
    };
  } catch (e) {
    // 결제는 이미 끝난 건이라 응답을 뒤집지 않는다 — 로그로만 남긴다.
    console.error("[quote] 결제 종료 처리 실패 — 수동 확인 필요:", e, quoteId);
    return { won: false, paidImpUid: null, items: [] };
  }
}

/** 관리자 수동 종료 / 다시 열기. 결제가 끝난 견적은 되돌릴 수 없다. */
export async function setQuoteOpen(quoteId: string, open: boolean): Promise<QuoteRow | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .update(quotes)
      .set(
        open
          ? { status: "open", closedAt: null, updatedAt: sql`now()` }
          : { status: "closed", closedAt: sql`now()`, updatedAt: sql`now()` },
      )
      .where(and(eq(quotes.id, quoteId), sql`${quotes.status} <> 'paid'`))
      .returning();
    return row ?? null;
  } catch (e) {
    console.error("[quote] 상태 변경 실패:", e, quoteId);
    return null;
  }
}

export async function markQuoteSent(quoteId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db
      .update(quotes)
      .set({
        sentAt: sql`now()`,
        sentCount: sql`${quotes.sentCount} + 1`,
        updatedAt: sql`now()`,
      })
      .where(eq(quotes.id, quoteId));
  } catch (e) {
    console.error("[quote] 발송 기록 실패:", e, quoteId);
  }
}

/** 결제 직전 발급한 주문번호를 남긴다. 웹훅만 도착한 건을 사람이 되짚을 때 쓴다. */
export async function setQuoteMerchantUid(quoteId: string, merchantUid: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db
      .update(quotes)
      .set({ lastMerchantUid: merchantUid, updatedAt: sql`now()` })
      .where(eq(quotes.id, quoteId));
  } catch (e) {
    console.error("[quote] 주문번호 기록 실패:", e, quoteId);
  }
}

/**
 * 링크를 처음 연 로그인 계정을 기록한다.
 *
 * 비어 있을 때만 채운다 — 나중에 다른 사람이 열었다고 덮어쓰면, 링크가
 * 누구에게 흘러갔는지 추적할 수 있는 유일한 단서가 사라진다.
 */
export async function claimQuote(quoteId: string, userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db
      .update(quotes)
      .set({ userId })
      .where(and(eq(quotes.id, quoteId), isNull(quotes.userId)));
  } catch (e) {
    console.error("[quote] 열람 계정 기록 실패:", e, quoteId);
  }
}
