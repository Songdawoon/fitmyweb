import "server-only";

import { getPlan } from "@/lib/data";
import { sendOrderMail, isEmailConfigured } from "@/lib/email";
import { recordOrderRow, resolveCoupons, markCouponUsed } from "@/lib/account";
import { getQuoteById, getQuoteByRef, markQuotePaid } from "@/lib/quotes";
import type { QuoteItem } from "@/lib/db";

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
  /**
   * 결제에 적용한 쿠폰 코드들(이벤트·회원가입 최대 2장).
   * 할인액은 서버가 코드로 다시 확인해 직접 계산한다.
   */
  couponCodes?: string[];
};

export function parseCustomData(raw: unknown): OrderMeta | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OrderMeta> & { couponCode?: unknown };
    if (typeof parsed?.planId !== "string") return null;

    // couponCode(단수)는 쿠폰이 한 종류였던 시절의 형식이다. 결제창을 이미
    // 띄워 둔 방문자의 건이 남아 있을 수 있어 함께 받아 준다.
    const codes = Array.isArray(parsed.couponCodes)
      ? parsed.couponCodes.filter((c): c is string => typeof c === "string")
      : typeof parsed.couponCode === "string"
        ? [parsed.couponCode]
        : [];

    return {
      planId: parsed.planId,
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      phone: typeof parsed.phone === "string" ? parsed.phone : undefined,
      couponCodes: codes.length > 0 ? codes : undefined,
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

// ── 주문제작 견적 ─────────────────────────────────────────────────

/** 견적 결제의 custom_data. 고정 플랜의 planId 대신 quoteId 를 싣는다. */
export type QuoteMeta = {
  quoteId: string;
  name?: string;
  email?: string;
  phone?: string;
};

export function parseQuoteCustomData(raw: unknown): QuoteMeta | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<QuoteMeta>;
    if (typeof parsed?.quoteId !== "string" || !parsed.quoteId) return null;

    return {
      quoteId: parsed.quoteId,
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      phone: typeof parsed.phone === "string" ? parsed.phone : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * 견적 주문번호는 `qt-{REF}-{시각}-{난수}` 형태입니다(lib/quotes.ts).
 * ref 는 대문자+숫자뿐이라 고정 플랜의 `pay-{planId}-` 와 섞이지 않습니다.
 */
export function quoteRefFromMerchantUid(merchantUid: unknown): string | undefined {
  if (typeof merchantUid !== "string") return undefined;
  return /^qt-([A-Z0-9]+)-/.exec(merchantUid)?.[1];
}

/**
 * 결제 대상 — 고정 플랜과 주문제작 견적을 한 형태로 눕힌 것.
 *
 * verifyPayment 아래의 모든 코드(금액 대조·주문 기록·메일)는 이 타입만 보고,
 * 결제가 어느 쪽에서 왔는지 신경 쓰지 않습니다. 분기는 resolveBillable
 * 한 곳에만 있습니다 — 두 갈래를 여러 곳에서 알게 하면 한쪽만 고쳐집니다.
 */
export type Billable = {
  /** orders.plan_id 에 그대로 들어간다. 견적은 항상 "quote". */
  planId: string;
  planName: string;
  /** 서버가 정한 정가. 클라이언트가 보낸 금액은 절대 여기 오지 않는다. */
  price: number;
  /** 쿠폰을 적용할 수 있는지. 견적은 quotes.couponsEnabled 를 따른다. */
  couponable: boolean;
  quoteId: string | null;
  quoteRef: string | null;
  /** 견적 결제의 항목 내역 — 주문 확인 메일에 싣는다. */
  quoteItems: QuoteItem[];
};

export type VerifyOutcome =
  | {
      status: "paid";
      verified: true;
      impUid: string;
      merchantUid: string;
      billable: Billable;
      amount: number;
      meta: OrderMeta | null;
      /** 이 결제에 실제로 적용된 계정 쿠폰 id — 확정 시 사용 처리한다. */
      couponIds: string[];
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

type BillableResolution =
  | { ok: true; billable: Billable; meta: OrderMeta | null }
  | { ok: false; message: string; httpStatus: number };

/**
 * 결제 건에서 "무엇을 얼마에 파는 건이었나" 를 서버 기준으로 복원합니다.
 *
 * 견적 경로의 금액은 quotes.total 에서만 읽습니다. 브라우저가 결제창에 넣은
 * amount 는 여기에 관여하지 않으므로, 금액을 깎아 보내도 아래 대조에서 걸립니다.
 */
async function resolveBillable(
  impUid: string,
  rawCustomData: unknown,
  merchantUid: string,
): Promise<BillableResolution> {
  const quoteMeta = parseQuoteCustomData(rawCustomData);
  const ref = quoteRefFromMerchantUid(merchantUid);

  // ── 주문제작 견적 ──────────────────────────────────────────────
  if (quoteMeta || ref) {
    const quote = quoteMeta
      ? await getQuoteById(quoteMeta.quoteId)
      : await getQuoteByRef(ref!);

    // DB 미연결도 여기로 온다(조회가 null). 견적 결제는 DB 없이 성립할 수
    // 없으므로 통과시키지 않는다.
    if (!quote) {
      console.error("[payment] 견적을 찾지 못함:", { impUid, merchantUid });
      return { ok: false, message: "견적 정보를 확인할 수 없습니다.", httpStatus: 400 };
    }

    // 주문번호의 ref 와 custom_data 가 가리키는 견적이 어긋나면 조작으로 본다
    // — 싼 견적 id 를 custom_data 에 실어 비싼 결제를 통과시키려는 시도.
    if (ref && quote.ref !== ref) {
      console.error("[payment] 견적 식별자 불일치:", { impUid, ref, quoteId: quote.id });
      return { ok: false, message: "견적 정보를 확인할 수 없습니다.", httpStatus: 400 };
    }

    if (quote.status === "closed") {
      return {
        ok: false,
        message: "종료된 견적입니다. 담당자에게 문의해 주세요.",
        httpStatus: 409,
      };
    }

    // 완료 라우트와 웹훅이 같은 결제를 두 번 보고하므로 같은 imp_uid 의
    // 재보고는 통과시킨다. 다른 결제 건이면 중복 결제이므로 막고 크게 남긴다.
    if (quote.status === "paid" && quote.paidImpUid !== impUid) {
      console.error("[payment] 결제 완료된 견적에 중복 결제 — 환불 확인 필요:", {
        impUid,
        quoteId: quote.id,
        ref: quote.ref,
        paidImpUid: quote.paidImpUid,
      });
      return { ok: false, message: "이미 결제가 완료된 견적입니다.", httpStatus: 409 };
    }

    return {
      ok: true,
      billable: {
        planId: "quote",
        planName: quote.title,
        price: quote.total, // 금액의 단일 진실 공급원
        couponable: quote.couponsEnabled,
        quoteId: quote.id,
        quoteRef: quote.ref,
        quoteItems: quote.items,
      },
      // 결제자 정보는 결제창 입력을 우선하고, 없으면 견적에 적힌 값으로 채운다.
      meta: {
        planId: "quote",
        name: quoteMeta?.name ?? quote.customerName ?? undefined,
        email: quoteMeta?.email ?? quote.customerEmail ?? undefined,
        phone: quoteMeta?.phone ?? quote.customerPhone ?? undefined,
      },
    };
  }

  // ── 고정 플랜 ─────────────────────────────────────────────────
  const meta = parseCustomData(rawCustomData);
  const plan = getPlan(meta?.planId ?? planIdFromMerchantUid(merchantUid));

  if (!plan || !plan.payable) {
    return {
      ok: false,
      message: "주문한 플랜 정보를 확인할 수 없습니다.",
      httpStatus: 400,
    };
  }

  return {
    ok: true,
    billable: {
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      couponable: true,
      quoteId: null,
      quoteRef: null,
      quoteItems: [],
    },
    meta,
  };
}

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

  const resolved = await resolveBillable(impUid, payment.custom_data, merchantUid);
  if (!resolved.ok) {
    return {
      status: "failed",
      verified: false,
      impUid,
      message: resolved.message,
      httpStatus: resolved.httpStatus,
    };
  }

  const { billable, meta } = resolved;
  const paidAmount = Number(payment.amount);
  const paymentStatus = String(payment.status ?? "");

  /**
   * 쿠폰 할인 — 금액은 클라이언트가 보낸 값을 쓰지 않고, 코드를 서버에서 다시
   * 확인해 정해진 금액만 인정한다(resolveCoupons). 그래서 결제창에 임의의
   * 금액을 넣어 보내도 아래 대조에서 걸린다.
   *
   * 견적은 couponable 이 false 라, 코드가 실려 와도 할인 0 으로 계산된다
   * — 관리자가 이미 협의한 금액에 쿠폰을 겹쳐 받을 수는 없다.
   */
  let couponIds: string[] = [];
  let discount = 0;

  if (billable.couponable && meta?.couponCodes?.length) {
    const resolvedCoupons = await resolveCoupons(meta.couponCodes);
    if (!resolvedCoupons) {
      console.error("[payment] 쿠폰 무효:", { impUid, codes: meta.couponCodes });
      return {
        status: "failed",
        verified: false,
        impUid,
        message: "사용할 수 없는 쿠폰입니다. 고객센터로 문의해 주세요.",
        httpStatus: 400,
      };
    }
    couponIds = resolvedCoupons
      .map((c) => c.couponId)
      .filter((id): id is string => Boolean(id));
    // 두 쿠폰을 합쳐도 주문 금액을 넘길 수는 없다(결제 금액이 음수가 되므로).
    discount = Math.min(
      resolvedCoupons.reduce((sum, c) => sum + c.amount, 0),
      billable.price,
    );
  }

  const expectedAmount = billable.price - discount;

  // 금액 대조 — 조작된 amount 를 잡아내는 핵심 방어선.
  if (paidAmount !== expectedAmount) {
    console.error("[payment] 금액 불일치:", {
      impUid,
      paidAmount,
      expected: expectedAmount,
      quote: billable.quoteRef,
    });
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
        billable,
        amount: paidAmount,
        meta,
        couponIds,
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
  billable: Billable;
  amount: number;
  meta: OrderMeta | null;
  couponIds?: string[];
}) {
  console.info("[payment] 주문 확정:", {
    source: input.source,
    impUid: input.impUid,
    merchantUid: input.merchantUid,
    plan: input.billable.planId,
    quote: input.billable.quoteRef,
    amount: input.amount,
    coupons: input.meta?.couponCodes ?? null,
    customer: input.meta
      ? { name: input.meta.name, email: input.meta.email, phone: input.meta.phone }
      : null,
  });

  // 쿠폰 사용 처리. 완료 라우트와 웹훅이 같은 결제를 두 번 보고하므로
  // markCouponUsed 는 아직 미사용인 경우에만 갱신한다(멱등).
  for (const couponId of input.couponIds ?? []) await markCouponUsed(couponId);

  await recordOrderRow({
    impUid: input.impUid,
    merchantUid: input.merchantUid,
    planId: input.billable.planId,
    planName: input.billable.planName,
    quoteId: input.billable.quoteId,
    amount: input.amount,
    source: input.source,
    customerName: input.meta?.name ?? null,
    customerEmail: input.meta?.email ?? null,
    customerPhone: input.meta?.phone ?? null,
  });

  /**
   * 견적 종료. markQuotePaid 는 status='open' 일 때만 이기므로 완료 라우트와
   * 웹훅이 두 번 불러도 안전하다. 진 쪽이 다른 imp_uid 였다면 그건 같은
   * 견적에 결제가 두 번 들어온 것이므로 환불 확인이 필요하다.
   */
  if (input.billable.quoteId) {
    const closed = await markQuotePaid(input.billable.quoteId, input.impUid);
    if (!closed.won && closed.paidImpUid && closed.paidImpUid !== input.impUid) {
      console.error("[payment] 견적 중복 결제 — 환불 확인 필요:", {
        quoteId: input.billable.quoteId,
        ref: input.billable.quoteRef,
        first: closed.paidImpUid,
        second: input.impUid,
      });
    }
  }

  if (!isEmailConfigured()) {
    console.warn("[payment] 메일 설정이 없어 주문 확인 메일을 보내지 못했습니다:", input.impUid);
    return;
  }

  const sent = await sendOrderMail({
    planName: input.billable.planName,
    amount: input.amount,
    impUid: input.impUid,
    merchantUid: input.merchantUid,
    source: input.source,
    name: input.meta?.name,
    email: input.meta?.email,
    phone: input.meta?.phone,
    ...(input.billable.quoteRef ? { quoteRef: input.billable.quoteRef } : {}),
    ...(input.billable.quoteItems.length > 0
      ? { items: input.billable.quoteItems }
      : {}),
  });

  // 메일이 실패해도 결제 자체는 이미 완료된 건이라 응답을 뒤집지 않는다.
  // 대신 복구할 수 있도록 주문 정보를 에러 로그로 크게 남긴다.
  if (!sent.ok) {
    console.error("[payment] 주문 확인 메일 발송 실패 — 수동 확인 필요:", sent.reason, {
      impUid: input.impUid,
      merchantUid: input.merchantUid,
      plan: input.billable.planId,
      quote: input.billable.quoteRef,
      amount: input.amount,
      customer: input.meta,
    });
  }
}
