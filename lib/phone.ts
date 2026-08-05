/**
 * 전화번호 형식.
 *
 * 견적서와 주문서에 적힌 번호로는 실제로 전화가 걸려야 합니다. 숫자 개수만
 * 세는 검사는 `010.6665455` 같은 값을 그대로 통과시키는데, 이런 번호는 저장된
 * 뒤에 아무도 다시 확인하지 않아 연락이 끊긴 채로 남습니다.
 *
 * 규칙은 국내에서 실제로 쓰이는 번호를 전부 받도록 넉넉하게 잡았습니다 —
 * 진짜 고객의 번호를 막는 쪽이, 형식이 조금 흐트러진 번호를 받는 쪽보다
 * 훨씬 나쁩니다. 대신 자릿수가 모자라거나 남는 번호는 확실히 막습니다.
 *
 * 서버(입력 검증)와 클라이언트(입력 중 자동 하이픈)가 같은 규칙을 쓰도록
 * `server-only` 를 붙이지 않습니다.
 */

export const PHONE_HINT = "010-1234-5678 형식으로 입력해 주세요.";
export const PHONE_PLACEHOLDER = "010-1234-5678";

/**
 * 숫자만 남깁니다. `+82` 로 시작하는 국제 표기는 국내 표기(0…)로 바꿉니다
 * — 명함이나 카카오에서 복사해 붙이면 이 형태로 들어옵니다.
 */
export function digitsOnly(raw: string): string {
  return raw
    .trim()
    .replace(/^\+82[\s-]?0?/, "0")
    .replace(/\D/g, "");
}

/**
 * 받아 주는 번호.
 *
 * 010 은 8자리로 고정입니다(구형 7자리는 오래전에 전환이 끝났습니다).
 * 나머지 01x 는 7~8자리를 모두 받습니다.
 */
const PATTERNS: readonly RegExp[] = [
  /^010\d{8}$/, //                              휴대폰      010-1234-5678
  /^01[16789]\d{7,8}$/, //                      구형 휴대폰  011-123-4567
  /^02\d{7,8}$/, //                             서울        02-123-4567
  /^0(3[1-3]|4[1-4]|5[1-5]|6[1-4])\d{7,8}$/, // 지역        031-123-4567
  /^070\d{8}$/, //                              인터넷전화   070-1234-5678
  /^050\d{7,9}$/, //                            안심·평생번호 0504-1234-5678
  /^1[5-8]\d{6}$/, //                           대표번호     1588-1234
];

export function isValidPhone(raw: string): boolean {
  const digits = digitsOnly(raw);
  return PATTERNS.some((pattern) => pattern.test(digits));
}

/**
 * 입력 중에도 자연스럽게 끊어 주는 하이픈 표기.
 *
 * 완성되지 않은 번호도 그대로 돌려주므로 타이핑을 방해하지 않습니다.
 * 형식이 맞는지는 isValidPhone 이 따로 판단합니다.
 */
export function formatPhone(raw: string): string {
  const d = digitsOnly(raw).slice(0, 12);
  if (!d) return "";

  // 대표번호 — 국번이 없다. 1588-1234
  if (/^1[5-8]/.test(d)) {
    return d.length <= 4 ? d : `${d.slice(0, 4)}-${d.slice(4, 8)}`;
  }

  // 서울만 지역번호가 두 자리다.
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }

  // 안심번호는 국번이 네 자리다. 0504-1234-5678
  if (d.startsWith("050") && d.length > 11) {
    return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8, 12)}`;
  }

  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}
