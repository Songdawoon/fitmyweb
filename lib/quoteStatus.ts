/**
 * 견적 상태의 화면 표기.
 *
 * lib/quotes.ts 는 `server-only` 라 클라이언트 컴포넌트가 import 할 수 없다.
 * 관리자 목록(서버)과 빌더·고객 화면(클라이언트)이 같은 말을 쓰도록 여기 둔다.
 */
export type QuoteStatus = "open" | "paid" | "closed";

export const quoteStatusLabel: Record<QuoteStatus, string> = {
  open: "발송 가능",
  paid: "결제 완료",
  closed: "종료",
};

/** 목록·배지의 색. 결제 완료만 액센트로 눈에 띄게 한다. */
export const quoteStatusTone: Record<QuoteStatus, string> = {
  open: "text-ink",
  paid: "text-accent",
  closed: "text-faint",
};

export function asQuoteStatus(value: string): QuoteStatus {
  return value === "paid" || value === "closed" ? value : "open";
}
