import "server-only";

import { getPlan, type Plan } from "@/lib/data";
import { sendOrderMail, isEmailConfigured } from "@/lib/email";
import { recordOrderRow, findRedeemableCoupon, markCouponUsed } from "@/lib/account";

/**
 * PortOne V1(구 아임포트) 서버 연동 유틸.
 *
 * 브라우저는 imp_uid 만 알고 있습니다. 금액을 클라이언트에서 받아 믿으면
 * amount 를 조작한 결제가 통과되므로, 항상 포트원 API 로 결제 건을 다시
 * 조회해서 실제 결제 금액과 플랜 정가를 대조합니다.
 *
 * 문서: https://developers.portone.io/opi/ko/integration/start/v1/auth?v=v1
 *       https://developers.portone.io/api/rest-v1/payment?v=v1
 */

const API = "https://api.iamport.kr";

const impKey = process.env.PORTONE_IMP_KEY;
const impSecret = process.env.PORTONE_IMP_SECRET;

/** 아직 실제 키가 들어오지 않은 상태(플레이스홀더)인지 */
export function isPlaceholderCredentials(): boolean {
  return (
    !impKey || !impSecret || impKey.startsWith("your-") || impSecret.startsWith("your-")
  );
}

// ── 액세스 토큰 ────────────────────────────────────────────────────
// 발급 후 30분간 유효합니다. 매 요청마다 새로 받지 않도록 캐시하되,
// 시계 오차와 네트워크 지연을 감안해 만료 1분 전에 미리 폐기합니다.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  try {
    const res = await fetch(`${API}/users/getToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imp_key: impKey, imp_secret: impSecret }),
      cache: "no-store",
    });

    const json = await res.json();
    if (!res.ok || json?.code !== 0 || !json?.response?.access_token) {
      console.error("[payment] 토큰 발급 실패:", json?.message ?? res.status);
      return null;
    }

    const { access_token, expired_at } = json.response;
    cachedToken = { value: access_token, expiresAt: expired_at * 1000 - 60_000 };
    return access_token;
  } catch (err) {
    console.error("[payment] 토큰 발급 중 오류:", err);
    return null;
  }
}

/** requestPay 의 custom_data 에 실어 보내는 주문 메타데이터 */
export type OrderMeta = {
  planId: string;
  name?: string;
  email?: string;
  phone?: string;
  /** 결제에 적용한 쿠폰 코드. 할인액은 서버가 DB 에서 다시 읽는다. */
  couponCode?: string;
};

export function parseCustomData(raw: unknown): OrderMeta | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OrderMeta>;
    if (typeof parsed?.planId !== "string") return null;
    return {
      planId: parsed.planId,
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      phone: typeof parsed.phone === "string" ? parsed.phone : undefined,
      couponCode: typeof parsed.couponCode === "string" ? parsed.couponCode : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * merchant_uid 는 `pay-{planId}-{시각}-{난수}` 형태로 발급합니다.
 * custom_data 가 유실된 경우를 대비한 보조 경로입니다.
 */
export function planIdFromMerchantUid(merchantUid: unknown): string | undefined {
  if (typeof merchantUid !== "string") return undefined;
  return /^pay-([a-z0-9]+)-/i.exec(merchantUid)?.[1];
}

export type VerifyOutcome =
  | {
      status: "paid";
      verified: true;
      impUid: string;
      merchantUid: string;
      plan: Plan;
      amount: number;
      meta: OrderMeta | null;
      /** 이 결제에 실제로 적용된 쿠폰 — 확정 시 사용 처리한다. */
      couponId: string | null;
      discount: number;
    }
  | {
      status: "pending";
      verified: false;
      impUid: string;
      paymentStatus: string;
      message: string;
    }
  | {
      status: "failed";
      verified: false;
      impUid: string;
      message: string;
      httpStatus: number;
    };

/**
 * 포트원에서 결제 건을 조회하고 금액·상태를 검증합니다.
 * 결제 완료 라우트와 웹훅 라우트가 공유하는 단일 진실 공급원입니다.
 */
export async function verifyPayment(impUid: string): Promise<VerifyOutcome> {
  if (isPlaceholderCredentials()) {
    return {
      status: "failed",
      verified: false,
      impUid,
      message: "결제 검증 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.",
      httpStatus: 503,
    };
  }

  const token = await getAccessToken();
  if (!token) {
    return {
      status: "failed",
      verified: false,
      impUid,
      message: "결제 인증에 실패했습니다.",
      httpStatus: 502,
    };
  }

  let payment: Record<string, unknown>;
  try {
    const res = await fetch(`${API}/payments/${encodeURIComponent(impUid)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json();

    // V1 은 조회 실패도 200 + code!==0 으로 내려주는 경우가 있어 code 를 함께 본다.
    if (!res.ok || json?.code !== 0 || !json?.response) {
      const notFound = res.status === 404 || /없|not found/i.test(String(json?.message ?? ""));
      console.error("[payment] 결제 조회 실패:", impUid, json?.message ?? res.status);
      return {
        status: "failed",
        verified: false,
        impUid,
        message: notFound ? "결제 정보를 찾을 수 없습니다." : "결제 조회에 실패했습니다.",
        httpStatus: notFound ? 404 : 502,
      };
    }

    payment = json.response;
  } catch (err) {
    console.error("[payment] 결제 조회 중 오류:", impUid, err);
    return {
      status: "failed",
      verified: false,
      impUid,
      message: "결제 조회에 실패했습니다.",
      httpStatus: 502,
    };
  }

  const merchantUid = String(payment.merchant_uid ?? "");
  const meta = parseCustomData(payment.custom_data);
  const plan = getPlan(meta?.planId ?? planIdFromMerchantUid(merchantUid));

  if (!plan || !plan.payable) {
    return {
      status: "failed",
      verified: false,
      impUid,
      message: "주문한 플랜 정보를 확인할 수 없습니다.",
      httpStatus: 400,
    };
  }

  const paidAmount = Number(payment.amount);
  const paymentStatus = String(payment.status ?? "");

  /**
   * 쿠폰 할인 — 금액은 클라이언트가 보낸 값을 쓰지 않고, 코드로 DB 를 다시 읽어
   * 미사용 쿠폰인지 확인한 뒤 그 쿠폰에 적힌 금액만 인정한다. 그래서 결제창에
   * 임의의 금액을 넣어 보내도 아래 대조에서 걸린다.
   */
  let couponId: string | null = null;
  let discount = 0;

  if (meta?.couponCode) {
    const found = await findRedeemableCoupon(meta.couponCode);
    if (!found) {
      console.error("[payment] 쿠폰 무효:", { impUid, code: meta.couponCode });
      return {
        status: "failed",
        verified: false,
        impUid,
        message: "사용할 수 없는 쿠폰입니다. 고객센터로 문의해 주세요.",
        httpStatus: 400,
      };
    }
    couponId = found.id;
    discount = Math.min(found.amount, plan.price);
  }

  const expectedAmount = plan.price - discount;

  // 금액 대조 — 조작된 amount 를 잡아내는 핵심 방어선.
  if (paidAmount !== expectedAmount) {
    console.error("[payment] 금액 불일치:", { impUid, paidAmount, expected: expectedAmount });
    return {
      status: "failed",
      verified: false,
      impUid,
      message: "결제 금액이 주문 금액과 일치하지 않습니다.",
      httpStatus: 400,
    };
  }

  switch (paymentStatus) {
    case "paid":
      return {
        status: "paid",
        verified: true,
        impUid,
        merchantUid,
        plan,
        amount: paidAmount,
        meta,
        couponId,
        discount,
      };

    case "ready":
      // 가상계좌 발급 완료, 입금 대기 상태.
      return {
        status: "pending",
        verified: false,
        impUid,
        paymentStatus,
        message: "가상계좌가 발급되었습니다. 입금이 확인되면 제작을 시작합니다.",
      };

    case "cancelled":
      return {
        status: "failed",
        verified: false,
        impUid,
        message: "취소된 결제입니다.",
        httpStatus: 400,
      };

    default:
      return {
        status: "failed",
        verified: false,
        impUid,
        message: "결제가 정상 처리되지 않았습니다.",
        httpStatus: 400,
      };
  }
}

/**
 * 확정된 주문 기록.
 *
 * 서버 로그를 남기고 담당자에게 주문 확인 메일을 보냅니다. 로그는 보존되지 않으므로
 * 실질적인 보존 수단은 메일입니다.
 *
 * 결제 완료 라우트와 웹훅이 모두 호출하기 때문에 정상 결제 한 건에 메일이 두 번
 * 갈 수 있습니다. 중복 메일이 누락보다 낫다고 보고 그대로 두었습니다 — 제목의
 * 주문번호가 같으므로 스레드로 묶여 보입니다. 실제 저장소를 붙일 때 imp_uid 기준
 * 멱등 처리를 넣으면 자연스럽게 해소됩니다.
 */
export async function recordOrder(input: {
  source: "client" | "webhook";
  impUid: string;
  merchantUid: string;
  plan: Plan;
  amount: number;
  meta: OrderMeta | null;
  couponId?: string | null;
}) {
  console.info("[payment] 주문 확정:", {
    source: input.source,
    impUid: input.impUid,
    merchantUid: input.merchantUid,
    plan: input.plan.id,
    amount: input.amount,
    coupon: input.meta?.couponCode ?? null,
    customer: input.meta
      ? { name: input.meta.name, email: input.meta.email, phone: input.meta.phone }
      : null,
  });

  // 쿠폰 사용 처리. 완료 라우트와 웹훅이 같은 결제를 두 번 보고하므로
  // markCouponUsed 는 아직 미사용인 경우에만 갱신한다(멱등).
  if (input.couponId) await markCouponUsed(input.couponId);

  await recordOrderRow({
    impUid: input.impUid,
    merchantUid: input.merchantUid,
    planId: input.plan.id,
    planName: input.plan.name,
    amount: input.amount,
    source: input.source,
    customerName: input.meta?.name ?? null,
    customerEmail: input.meta?.email ?? null,
    customerPhone: input.meta?.phone ?? null,
  });

  if (!isEmailConfigured()) {
    console.warn("[payment] 메일 설정이 없어 주문 확인 메일을 보내지 못했습니다:", input.impUid);
    return;
  }

  const sent = await sendOrderMail({
    planName: input.plan.name,
    amount: input.amount,
    impUid: input.impUid,
    merchantUid: input.merchantUid,
    source: input.source,
    name: input.meta?.name,
    email: input.meta?.email,
    phone: input.meta?.phone,
  });

  // 메일이 실패해도 결제 자체는 이미 완료된 건이라 응답을 뒤집지 않는다.
  // 대신 복구할 수 있도록 주문 정보를 에러 로그로 크게 남긴다.
  if (!sent.ok) {
    console.error("[payment] 주문 확인 메일 발송 실패 — 수동 확인 필요:", sent.reason, {
      impUid: input.impUid,
      merchantUid: input.merchantUid,
      plan: input.plan.id,
      amount: input.amount,
      customer: input.meta,
    });
  }
}
