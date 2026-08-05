/**
 * PortOne V1 결제창 호출 유틸 (브라우저 전용).
 *
 * 고정 플랜 결제(CheckoutClient)와 주문제작 견적 결제(QuoteCheckoutClient)가
 * 같은 SDK 로더·주문번호 규칙·콜백 처리를 쓰도록 한곳에 모았습니다.
 * 복사해 두면 한쪽만 고쳐지는데, 이 로직은 전부 실제 결제 사고에서 나온
 * 것이라 그런 어긋남이 곧 사고입니다.
 *
 * 화면 상태(로딩·에러 문구)는 여기 두지 않습니다 — 각 화면이 알아서 합니다.
 */

/** PortOne V1 결제 결과 (PC 환경 콜백) */
export type PayResponse = {
  success?: boolean;
  imp_uid?: string | null;
  merchant_uid?: string;
  error_code?: string | null;
  error_msg?: string | null;
};

declare global {
  interface Window {
    IMP?: {
      init: (impCode: string) => void;
      request_pay: (params: Record<string, unknown>, cb: (rsp: PayResponse) => void) => void;
    };
  }
}

/** V1 결제 SDK. npm 패키지는 V2 전용이라 CDN 스크립트를 직접 로드한다. */
const V1_SDK_URL = "https://cdn.iamport.kr/v1/iamport.js";

let sdkPromise: Promise<void> | null = null;

export function loadPortOneV1(): Promise<void> {
  if (window.IMP) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${V1_SDK_URL}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () =>
      window.IMP ? resolve() : reject(new Error("IMP 로드 실패")),
    );
    script.addEventListener("error", () =>
      reject(new Error("결제 모듈을 불러오지 못했습니다.")),
    );
    if (!existing) {
      script.src = V1_SDK_URL;
      document.head.appendChild(script);
    }
  }).catch((err) => {
    sdkPromise = null; // 다음 시도에서 재로드할 수 있도록 캐시를 비운다.
    throw err;
  });

  return sdkPromise;
}

/**
 * 고정 플랜의 주문번호(merchant_uid) 생성.
 *
 * KCP 는 주문번호를 40자 이하로 제한하므로 UUID 를 그대로 쓸 수 없습니다
 * (`pay-startfit-{uuid}` 는 49자). 타임스탬프(base36) + 난수 조합으로 줄이되,
 * 서버가 접두사에서 플랜을 역추적할 수 있도록 `pay-{planId}-` 형태는 유지합니다.
 *
 * 견적 결제의 주문번호는 서버가 발급합니다(lib/quotes.ts 의
 * createQuoteMerchantUid) — 브라우저가 만들면 다른 견적의 식별자를 붙여
 * 보낼 수 있어 서버의 교차 검증이 무의미해집니다.
 */
export function createMerchantUid(planId: string): string {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return `pay-${planId}-${Date.now().toString(36)}-${rand}`;
}

/** 결제창을 열고 콜백을 Promise 로 바꾼다. 호출 전에 loadPortOneV1() 을 끝내야 한다. */
export function requestPay(
  impCode: string,
  params: Record<string, unknown>,
): Promise<PayResponse> {
  const IMP = window.IMP;
  if (!IMP) return Promise.reject(new Error("결제 모듈을 불러오지 못했습니다."));

  IMP.init(impCode);
  return new Promise<PayResponse>((resolve) => IMP.request_pay(params, resolve));
}

/**
 * 모바일 결제창은 팝업이 아니라 페이지 이동으로 동작하므로, 결제가 끝나면
 * m_redirect_url 로 되돌아오면서 결과가 쿼리스트링에 실려 옵니다. 이때는
 * request_pay 의 콜백이 실행되지 않으므로 화면이 여기서 이어받습니다.
 *
 * 읽은 뒤에는 결과 파라미터를 URL 에서 지웁니다 — 남겨 두면 새로고침할 때마다
 * 같은 결제를 다시 확인하러 갑니다. `cleanSearch` 는 지운 뒤 남길 쿼리로,
 * `"?plan=bizfit"` 처럼 물음표까지 포함하거나 빈 문자열을 넘깁니다.
 *
 * 결과가 없으면 null — 결제를 거쳐 오지 않은 평범한 진입입니다.
 */
export function readRedirectResult(
  cleanSearch: string,
): { ok: true; impUid: string } | { ok: false; message: string } | null {
  const params = new URLSearchParams(window.location.search);
  const impUid = params.get("imp_uid");
  const impSuccess = params.get("imp_success") ?? params.get("success");

  if (!impUid && !impSuccess) return null;

  window.history.replaceState({}, "", `${window.location.pathname}${cleanSearch}`);

  if (impSuccess === "false" || !impUid) {
    return {
      ok: false,
      message: params.get("error_msg") ?? "결제가 취소되었거나 실패했습니다.",
    };
  }

  return { ok: true, impUid };
}
