import "server-only";

import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import { getDb, coupons, inquiries, orders, users } from "@/lib/db";
import { launchPromo } from "@/lib/data";

/** 회원가입 쿠폰 금액 — 팝업에 노출한 "회원가입 5만원 쿠폰" 과 같은 값을 쓴다. */
export const SIGNUP_COUPON_AMOUNT =
  launchPromo.benefits.find((b) => b.label.includes("회원가입"))?.value ?? 50_000;

const SIGNUP_COUPON_KIND = "signup";

/** MFW-XXXXXXXX 형태의 사람이 읽고 부를 수 있는 쿠폰 코드. */
function newCouponCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 0/O, 1/I 제외
  const bytes = randomBytes(8);
  let code = "";
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return `MFW-${code}`;
}

type EnsureUserInput = {
  provider: string;
  providerAccountId: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

/**
 * 로그인한 소셜 계정을 users 에 upsert 한다.
 * DB 가 없으면 null 을 돌려주고 로그인 자체는 그대로 진행시킨다.
 *
 * 쿠폰은 여기서 자동 발급하지 않는다 — 팝업의 "쿠폰 다운받기" 를 눌러야
 * 발급되는 흐름이라, 로그인만으로 미리 발급하면 버튼이 언제나 "이미 발급됨"
 * 이 되어 버린다(issueSignupCoupon 참고).
 */
export async function ensureUser(input: EnsureUserInput) {
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .insert(users)
      .values({
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        email: input.email,
        name: input.name,
        image: input.image,
      })
      .onConflictDoUpdate({
        target: [users.provider, users.providerAccountId],
        set: {
          email: input.email,
          name: input.name,
          image: input.image,
          lastLoginAt: new Date(),
        },
      })
      .returning();

    return row ?? null;
  } catch (e) {
    // 로그인은 막지 않는다 — DB 장애로 사이트 진입 자체가 불가능해지면 더 나쁘다.
    console.error("[auth] 사용자 저장 실패:", e);
    return null;
  }
}

export type IssueCouponResult =
  /** 이번 요청으로 새로 발급됨 */
  | { status: "issued"; code: string; amount: number }
  /** 이미 받은 적이 있음 — 계정당 1장 */
  | { status: "already"; code: string; amount: number; usedAt: Date | null }
  /** DB 미연결 등으로 발급할 수 없음 */
  | { status: "unavailable" };

/**
 * 회원가입 쿠폰 발급 — 계정당 1장.
 *
 * 중복 방지는 앱 로직이 아니라 유니크 인덱스(user_id, kind)가 보증한다.
 * 따라서 "먼저 조회하고 없으면 넣기" 로 하지 않고 바로 insert 를 시도한 뒤,
 * 충돌로 아무 행도 안 돌아오면 기존 쿠폰을 읽어 "already" 로 답한다.
 * 동시에 두 번 눌러도 두 장이 나올 수 없다.
 */
export async function issueSignupCoupon(userId: string): Promise<IssueCouponResult> {
  const db = getDb();
  if (!db) return { status: "unavailable" };

  try {
    const [created] = await db
      .insert(coupons)
      .values({
        userId,
        code: newCouponCode(),
        kind: SIGNUP_COUPON_KIND,
        amount: SIGNUP_COUPON_AMOUNT,
      })
      .onConflictDoNothing()
      .returning();

    if (created) {
      return { status: "issued", code: created.code, amount: created.amount };
    }

    const [existing] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.userId, userId), eq(coupons.kind, SIGNUP_COUPON_KIND)))
      .limit(1);

    if (!existing) return { status: "unavailable" };

    return {
      status: "already",
      code: existing.code,
      amount: existing.amount,
      usedAt: existing.usedAt,
    };
  } catch (e) {
    console.error("[coupon] 발급 실패:", e);
    return { status: "unavailable" };
  }
}

/**
 * 결제 검증용 — 코드로 아직 쓰지 않은 쿠폰을 찾는다.
 *
 * 결제 웹훅에는 세션이 없어 "이 쿠폰이 결제자 본인 것인지" 를 확인할 수 없다.
 * 대신 코드가 32^8 조합의 난수라 추측이 불가능하고, 이미 사용된 쿠폰은
 * 여기서 걸러진다.
 */
export async function findRedeemableCoupon(code: string) {
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, code), isNull(coupons.usedAt)))
      .limit(1);
    return row ?? null;
  } catch (e) {
    console.error("[coupon] 조회 실패:", e);
    return null;
  }
}

/**
 * 쿠폰 사용 처리. 결제 완료 라우트와 웹훅이 같은 건을 두 번 호출하므로
 * 아직 사용되지 않은 경우에만 갱신한다(멱등).
 */
export async function markCouponUsed(couponId: string) {
  const db = getDb();
  if (!db) return;

  try {
    await db
      .update(coupons)
      .set({ usedAt: sql`now()` })
      .where(and(eq(coupons.id, couponId), isNull(coupons.usedAt)));
  } catch (e) {
    // 결제는 이미 끝난 건이라 응답을 뒤집지 않는다 — 로그로만 남긴다.
    console.error("[coupon] 사용 처리 실패 — 수동 확인 필요:", e, couponId);
  }
}

/**
 * 마이페이지 데이터.
 *
 * 주문·상담은 로그인 이후 것만이 아니라, 같은 이메일로 남긴 비로그인 건까지
 * 함께 보여준다. 결제나 상담을 먼저 하고 나중에 가입하는 흐름이 흔하기 때문.
 */
export async function getMyPageData(userId: string | null, email: string | null) {
  const db = getDb();
  if (!db) return null;

  const orderWhere = or(
    ...[
      userId ? eq(orders.userId, userId) : undefined,
      email ? eq(orders.customerEmail, email) : undefined,
    ].filter(Boolean),
  );
  const inquiryWhere = or(
    ...[
      userId ? eq(inquiries.userId, userId) : undefined,
      email ? eq(inquiries.email, email) : undefined,
    ].filter(Boolean),
  );

  const [myCoupons, myOrders, myInquiries] = await Promise.all([
    userId
      ? db.select().from(coupons).where(eq(coupons.userId, userId)).orderBy(desc(coupons.issuedAt))
      : Promise.resolve([]),
    db
      .select()
      .from(orders)
      .where(orderWhere)
      .orderBy(desc(orders.createdAt)),
    db
      .select()
      .from(inquiries)
      .where(inquiryWhere)
      .orderBy(desc(inquiries.createdAt)),
  ]);

  return { coupons: myCoupons, orders: myOrders, inquiries: myInquiries };
}

/** 쿠폰 사용 여부 표기용 — 아직 쓰지 않은 쿠폰. */
export async function getUnusedCoupons(userId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(coupons)
    .where(and(eq(coupons.userId, userId), isNull(coupons.usedAt)));
}

/**
 * 상담 신청 저장. 메일 발송 전에 먼저 넣고, 발송 결과를 markInquiryMailed 로
 * 갱신한다 — 메일이 실패해도 접수 자체는 남아 있어야 하기 때문.
 * DB 가 없으면 null 을 돌려주고 호출부는 기존대로 메일만 보낸다.
 */
export async function recordInquiry(input: {
  userId: string | null;
  name: string;
  phone: string;
  email: string;
  industry?: string;
  purpose?: string;
  needs?: string;
  reference?: string;
  budget?: string;
  timeline?: string;
  message?: string;
}) {
  const db = getDb();
  if (!db) return null;

  try {
    const [row] = await db.insert(inquiries).values(input).returning({ id: inquiries.id });
    return row?.id ?? null;
  } catch (e) {
    console.error("[contact] 상담 저장 실패:", e);
    return null;
  }
}

export async function markInquiryMailed(id: string) {
  const db = getDb();
  if (!db) return;
  try {
    await db.update(inquiries).set({ mailed: true }).where(eq(inquiries.id, id));
  } catch (e) {
    console.error("[contact] 메일 발송 표시 실패:", e);
  }
}

/**
 * 결제 주문 저장.
 *
 * 브라우저 콜백과 웹훅이 같은 결제를 각각 보고하므로 impUid 충돌은 무시한다.
 * 로그인 세션이 없는 경로(웹훅)도 있어 결제자 이메일로 사용자를 찾아 연결한다.
 */
export async function recordOrderRow(input: {
  impUid: string;
  merchantUid: string;
  planId: string;
  planName: string;
  amount: number;
  source: "client" | "webhook";
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
}) {
  const db = getDb();
  if (!db) return;

  try {
    let userId: string | null = null;
    if (input.customerEmail) {
      const [found] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.customerEmail))
        .limit(1);
      userId = found?.id ?? null;
    }

    await db.insert(orders).values({ ...input, userId }).onConflictDoNothing();
  } catch (e) {
    // 결제는 이미 끝난 건이라 응답을 뒤집지 않는다 — 로그로만 남긴다.
    console.error("[payment] 주문 저장 실패 — 수동 확인 필요:", e, input.impUid);
  }
}

/** 관리자 페이지 — 최근 상담과 주문. */
export async function getAdminData(limit = 100) {
  const db = getDb();
  if (!db) return null;

  const [recentInquiries, recentOrders] = await Promise.all([
    db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(limit),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit),
  ]);

  return { inquiries: recentInquiries, orders: recentOrders };
}
