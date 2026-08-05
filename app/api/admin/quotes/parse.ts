import {
  computeQuoteTotal,
  normalizeQuoteItems,
  QUOTE_MAX_TOTAL,
  QUOTE_MIN_TOTAL,
  type QuoteInput,
} from "@/lib/quotes";
import { formatPhone, isValidPhone, PHONE_HINT } from "@/lib/phone";

/**
 * 견적 생성·수정이 공유하는 입력 검사.
 *
 * app/api/contact/route.ts 와 같은 방식으로 zod 없이 다듬는다. 신뢰 경계는
 * 관리자 세션이므로 여기서 막는 건 공격이 아니라 **오타**다 — 자릿수를 하나
 * 더 친 견적이 고객에게 나가는 쪽이 훨씬 현실적인 사고다.
 */
function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** "1,000,000" 처럼 콤마가 섞인 값도 받는다. */
function num(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;
  const cleaned = value.replace(/,/g, "").trim();
  return cleaned ? Number(cleaned) : NaN;
}

export type ParseResult =
  | { ok: true; value: QuoteInput }
  | { ok: false; message: string };

export function parseQuoteBody(raw: unknown): ParseResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "잘못된 요청입니다." };
  }
  const body = raw as Record<string, unknown>;

  const title = str(body.title, 120);
  if (title.length < 2) {
    return { ok: false, message: "견적 제목을 2자 이상 입력해 주세요." };
  }

  const baseAmount = num(body.baseAmount);
  if (!Number.isSafeInteger(baseAmount) || baseAmount < 0 || baseAmount > QUOTE_MAX_TOTAL) {
    return { ok: false, message: "기본 제작비를 확인해 주세요." };
  }

  const items = normalizeQuoteItems(body.items);
  const total = computeQuoteTotal(baseAmount, items);

  if (total < QUOTE_MIN_TOTAL) {
    return {
      ok: false,
      message: `결제 가능한 금액이 아닙니다(${QUOTE_MIN_TOTAL.toLocaleString("ko-KR")}원 이상).`,
    };
  }
  if (total > QUOTE_MAX_TOTAL) {
    return { ok: false, message: "합계가 너무 큽니다. 금액을 확인해 주세요." };
  }

  const customerEmail = str(body.customerEmail, 200);
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return { ok: false, message: "고객 이메일 형식을 확인해 주세요." };
  }

  // 연락처는 선택이지만, 적었다면 걸 수 있는 번호여야 한다.
  // 저장은 항상 하이픈 표기로 통일한다 — 화면을 거치지 않고 들어온 값도 마찬가지다.
  const customerPhone = str(body.customerPhone, 40);
  if (customerPhone && !isValidPhone(customerPhone)) {
    return { ok: false, message: `고객 연락처를 확인해 주세요. ${PHONE_HINT}` };
  }

  return {
    ok: true,
    value: {
      title,
      note: str(body.note, 2000) || null,
      customerName: str(body.customerName, 100) || null,
      customerEmail: customerEmail || null,
      customerPhone: customerPhone ? formatPhone(customerPhone) : null,
      baseLabel: str(body.baseLabel, 60) || "기본 제작비",
      baseAmount,
      items,
    },
  };
}
