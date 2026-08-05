import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import { getDb, briefs, orders, type BriefRow } from "@/lib/db";
import { briefFields, type BriefFieldKey } from "@/lib/data";

/**
 * 제작 정보(브리프).
 *
 * 결제가 끝나면 주문마다 하나씩 만들어지고, 고객은 메일로 받은 링크로 들어와
 * 로그인 없이 내용을 적는다. 언제든 다시 들어와 고칠 수 있다 — 자료를 나중에
 * 찾아 채우는 경우가 흔하다.
 *
 * lib/account.ts 와 같은 규약을 따른다: `const db = getDb(); if (!db) return ...`
 */

/** 작성 링크의 열쇠. 32자 base64url = 192비트. */
function newBriefToken(): string {
  return randomBytes(24).toString("base64url");
}

export function briefUrl(token: string): string {
  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://fitmyweb.com";
  return `${origin}/brief/${token}`;
}

/** 고객이 채우는 항목들. 컬럼과 1:1 이다. */
export type BriefValues = Record<BriefFieldKey, string>;

export const emptyBriefValues = (): BriefValues =>
  Object.fromEntries(briefFields.map((f) => [f.key, ""])) as BriefValues;

/** 저장된 행에서 화면이 쓰는 값만 뽑는다. null 은 빈 문자열로 눕힌다. */
export function briefValuesOf(row: BriefRow): BriefValues {
  return Object.fromEntries(
    briefFields.map((f) => [f.key, (row[f.key] as string | null) ?? ""]),
  ) as BriefValues;
}

/**
 * 들어온 값을 항목 정의에 맞춰 다듬는다.
 *
 * 정의에 없는 키는 버리고, 길이는 각 항목의 max 로 자른다. 선택지가 있는
 * 항목은 정의된 값만 받는다 — 화면을 거치지 않고 들어온 값도 표에 그대로
 * 찍히므로, 아무 문자열이나 통과시키면 관리자 화면이 오염된다.
 */
export function normalizeBriefValues(raw: unknown): BriefValues {
  const out = emptyBriefValues();
  if (!raw || typeof raw !== "object") return out;
  const body = raw as Record<string, unknown>;

  for (const field of briefFields) {
    const value = body[field.key];
    if (typeof value !== "string") continue;

    const trimmed = value.trim().slice(0, field.max);
    if (field.options && trimmed && !field.options.includes(trimmed)) continue;

    out[field.key] = trimmed;
  }
  return out;
}

/**
 * 주문에 딸린 브리프를 만든다.
 *
 * **이미 있으면 null 을 돌려준다.** 완료 라우트와 웹훅이 같은 결제를 두 번
 * 보고하므로, 호출부는 이 반환값을 보고 고객 메일을 보낼지 정한다 —
 * 담당자에게 가는 중복 메일은 감수할 수 있어도 고객에게 두 번 가면 안 된다.
 */
export async function createBriefForOrder(orderId: string): Promise<BriefRow | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .insert(briefs)
      .values({ orderId, token: newBriefToken() })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  } catch (e) {
    // 결제는 이미 끝난 건이라 응답을 뒤집지 않는다 — 로그로만 남긴다.
    console.error("[brief] 생성 실패 — 수동 확인 필요:", e, orderId);
    return null;
  }
}

export async function markBriefInvited(briefId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db.update(briefs).set({ invitedAt: sql`now()` }).where(eq(briefs.id, briefId));
  } catch (e) {
    console.error("[brief] 발송 기록 실패:", e, briefId);
  }
}

export async function getBriefByToken(token: string): Promise<BriefRow | null> {
  const db = getDb();
  if (!db || !token) return null;

  try {
    const [row] = await db.select().from(briefs).where(eq(briefs.token, token)).limit(1);
    return row ?? null;
  } catch (e) {
    console.error("[brief] 조회 실패(token):", e);
    return null;
  }
}

/**
 * 고객이 보낸 내용을 저장한다.
 *
 * 수정도 같은 경로를 쓴다. 관리자가 이미 봤더라도 내용이 바뀌면 seenAt 을
 * 비워 다시 알린다 — 고쳤는데 아무도 모르면 고친 의미가 없다.
 *
 * **확정된 브리프는 바뀌지 않는다.** 조건을 WHERE 에 넣어 DB 가 막는다 —
 * 라우트에서 먼저 확인하더라도 그 사이에 관리자가 확정할 수 있고, 제작을
 * 시작한 뒤에 내용이 달라지면 무엇을 기준으로 만든 건지 알 수 없게 된다.
 */
export async function saveBrief(token: string, values: BriefValues): Promise<BriefRow | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .update(briefs)
      .set({
        ...values,
        submittedAt: sql`coalesce(${briefs.submittedAt}, now())`,
        seenAt: null,
        updatedAt: sql`now()`,
      })
      .where(and(eq(briefs.token, token), isNull(briefs.lockedAt)))
      .returning();
    return row ?? null;
  } catch (e) {
    console.error("[brief] 저장 실패:", e);
    return null;
  }
}

/**
 * 제작 정보 확정 / 확정 해제.
 *
 * 확정하면 고객이 더 이상 고칠 수 없다. 되돌릴 수 있게 둔 것은 실수로 확정한
 * 경우와, 제작 도중 고객에게 보완을 요청해야 하는 경우가 실제로 생기기 때문이다.
 */
export async function setBriefLocked(briefId: string, locked: boolean): Promise<BriefRow | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .update(briefs)
      .set({ lockedAt: locked ? sql`now()` : null, updatedAt: sql`now()` })
      .where(eq(briefs.id, briefId))
      .returning();
    return row ?? null;
  } catch (e) {
    console.error("[brief] 확정 처리 실패:", e, briefId);
    return null;
  }
}

export type BriefListRow = {
  brief: BriefRow;
  order: {
    planName: string;
    amount: number;
    customerName: string | null;
    customerEmail: string | null;
    createdAt: Date;
  } | null;
};

/** 관리자 목록 — 브리프와 그 주문을 함께 읽는다. */
export async function listBriefs(limit = 100): Promise<BriefListRow[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const rows = await db
      .select({
        brief: briefs,
        planName: orders.planName,
        amount: orders.amount,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        orderedAt: orders.createdAt,
      })
      .from(briefs)
      .leftJoin(orders, eq(briefs.orderId, orders.id))
      .orderBy(desc(briefs.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      brief: r.brief,
      order: r.planName
        ? {
            planName: r.planName,
            amount: r.amount ?? 0,
            customerName: r.customerName,
            customerEmail: r.customerEmail,
            createdAt: r.orderedAt ?? r.brief.createdAt,
          }
        : null,
    }));
  } catch (e) {
    console.error("[brief] 목록 조회 실패:", e);
    return null;
  }
}

export async function getBriefById(id: string): Promise<BriefListRow | null> {
  const db = getDb();
  if (!db || !id) return null;

  try {
    const [row] = await db
      .select({
        brief: briefs,
        planName: orders.planName,
        amount: orders.amount,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        orderedAt: orders.createdAt,
      })
      .from(briefs)
      .leftJoin(orders, eq(briefs.orderId, orders.id))
      .where(eq(briefs.id, id))
      .limit(1);

    if (!row) return null;
    return {
      brief: row.brief,
      order: row.planName
        ? {
            planName: row.planName,
            amount: row.amount ?? 0,
            customerName: row.customerName,
            customerEmail: row.customerEmail,
            createdAt: row.orderedAt ?? row.brief.createdAt,
          }
        : null,
    };
  } catch (e) {
    console.error("[brief] 조회 실패(id):", e);
    return null;
  }
}

/** 관리자가 아직 확인하지 않은, 작성된 브리프 수. */
export async function countUnseenBriefs(): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  try {
    const rows = await db
      .select({ id: briefs.id })
      .from(briefs)
      .where(and(isNull(briefs.seenAt), sql`${briefs.submittedAt} is not null`))
      .limit(100);
    return rows.length;
  } catch (e) {
    console.error("[brief] 미확인 조회 실패:", e);
    return 0;
  }
}

export async function markBriefSeen(briefId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db.update(briefs).set({ seenAt: sql`now()` }).where(eq(briefs.id, briefId));
  } catch (e) {
    console.error("[brief] 확인 처리 실패:", e, briefId);
  }
}
