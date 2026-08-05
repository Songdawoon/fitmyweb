import "server-only";

/**
 * Resend 로 알림 메일을 보내는 공용 모듈.
 *
 * 상담 신청과 결제 완료 모두 여기를 거칩니다. SDK 패키지 대신 REST 를 직접
 * 호출하는데, 의존성을 늘리지 않고 lib/portone.ts 의 fetch 방식과도 맞춥니다.
 *
 * 문서: https://resend.com/docs/api-reference/emails/send-email
 */

const API = "https://api.resend.com/emails";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.CONTACT_FROM_EMAIL;
const to = process.env.CONTACT_TO_EMAIL;

/** 실제 키가 들어오기 전(플레이스홀더/미설정)인지 */
export function isEmailConfigured(): boolean {
  return Boolean(apiKey && from && to && !apiKey.startsWith("your-"));
}

export type SendResult = { ok: true } | { ok: false; reason: string };

async function sendMail(input: {
  subject: string;
  html: string;
  /** 담당자가 메일에서 바로 "답장"하면 고객에게 가도록 지정한다. */
  replyTo?: string;
  /**
   * 받는 사람. 생략하면 지금까지처럼 CONTACT_TO_EMAIL(담당자)로 간다.
   * 고객에게 직접 보내는 메일(견적 링크)만 이 값을 채운다 — 기본값을 담당자로
   * 두어, 수신자를 깜빡한 메일이 엉뚱한 곳으로 가는 대신 우리에게 오게 한다.
   */
  to?: string;
}): Promise<SendResult> {
  if (!isEmailConfigured()) return { ok: false, reason: "not-configured" };

  // 콤마로 여러 수신자를 넣을 수 있게 한다.
  const recipients = (input.to ?? to!)
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);

  // 빈 문자열을 넘겼을 때 담당자에게 잘못 가는 것을 막는다.
  if (recipients.length === 0) return { ok: false, reason: "no-recipient" };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: input.subject,
        html: input.html,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] 발송 실패:", res.status, body.slice(0, 300));
      return { ok: false, reason: `http-${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    console.error("[email] 발송 중 오류:", err);
    return { ok: false, reason: "network" };
  }
}

// ── 템플릿 ────────────────────────────────────────────────────────
// 고객이 입력한 값이 그대로 HTML 에 들어가므로 반드시 이스케이프한다.

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

/** 라벨-값 표. 값이 비었으면 "—" 로 채워 항목 자체가 사라지지 않게 한다. */
function table(rows: [string, string | undefined][]): string {
  const cells = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 14px;background:#f4f6fa;border-bottom:1px solid #e5e8f0;
                   font-size:13px;color:#5c6472;white-space:nowrap;vertical-align:top;">${esc(label)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e8f0;
                   font-size:14px;color:#101733;white-space:pre-wrap;">${
                     value && value.trim() ? esc(value) : "—"
                   }</td>
      </tr>`,
    )
    .join("");

  return `<table cellpadding="0" cellspacing="0" border="0"
            style="width:100%;max-width:640px;border-collapse:collapse;
                   border:1px solid #e5e8f0;border-radius:10px;overflow:hidden;">${cells}</table>`;
}

function layout(heading: string, lead: string, body: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;
                      background:#ffffff;padding:28px 20px;color:#101733;">
    <h1 style="margin:0 0 6px;font-size:19px;font-weight:700;">${esc(heading)}</h1>
    <p style="margin:0 0 20px;font-size:13px;color:#8a92a3;">${esc(lead)}</p>
    ${body}
  </div>`;
}

// ── 상담 신청 ─────────────────────────────────────────────────────

export type Inquiry = {
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
};

export async function sendInquiryMail(inquiry: Inquiry): Promise<SendResult> {
  const html = layout(
    "새 상담 신청이 들어왔습니다",
    `접수 시각 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`,
    table([
      ["이름 / 업체명", inquiry.name],
      ["연락처", inquiry.phone],
      ["이메일", inquiry.email],
      ["업종", inquiry.industry],
      ["제작 목적", inquiry.purpose],
      ["필요한 페이지·기능", inquiry.needs],
      ["참고 사이트", inquiry.reference],
      ["예상 예산", inquiry.budget],
      ["희망 오픈 일정", inquiry.timeline],
      ["문의 내용", inquiry.message],
    ]),
  );

  return sendMail({
    subject: `[상담신청] ${inquiry.name}${inquiry.industry ? ` · ${inquiry.industry}` : ""}`,
    html,
    replyTo: inquiry.email,
  });
}

// ── 결제 완료 ─────────────────────────────────────────────────────

export type OrderMail = {
  planName: string;
  amount: number;
  impUid: string;
  merchantUid: string;
  source: "client" | "webhook";
  name?: string;
  email?: string;
  phone?: string;
  /** 주문제작 견적 결제면 견적번호와 항목 내역. 고정 플랜은 비어 있다. */
  quoteRef?: string;
  items?: { label: string; amount: number }[];
};

export async function sendOrderMail(order: OrderMail): Promise<SendResult> {
  const html = layout(
    `${order.planName} 결제가 완료되었습니다`,
    `결제 확인 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · 경로 ${order.source}`,
    table([
      ["플랜", order.planName],
      ["결제 금액", won(order.amount)],
      ...(order.quoteRef ? ([["견적번호", order.quoteRef]] as [string, string][]) : []),
      // 견적 결제만 항목이 붙는다. 담당자가 무엇을 팔았는지 메일만 보고 알 수 있어야 한다.
      ...(order.items ?? []).map(
        ({ label, amount }) => [`· ${label}`, won(amount)] as [string, string],
      ),
      ["주문자", order.name],
      ["이메일", order.email],
      ["연락처", order.phone],
      ["주문번호", order.merchantUid],
      ["결제번호 (imp_uid)", order.impUid],
    ]),
  );

  return sendMail({
    subject: `[결제완료] ${order.planName} · ${won(order.amount)}`,
    html,
    replyTo: order.email,
  });
}

// ── 주문제작 견적 링크 ─────────────────────────────────────────────
// 담당자 알림이 아니라 **고객에게 직접 가는** 유일한 메일이다.
// 그래서 내부 정보(견적 id, 토큰 원문)는 본문에 넣지 않는다 — 링크 안에만 있다.

export type QuoteMail = {
  ref: string;
  title: string;
  note?: string | null;
  baseLabel: string;
  baseAmount: number;
  items: { label: string; amount: number }[];
  total: number;
  /** 절대 주소. lib/quotes.ts 의 quoteUrl() 로 만든다. */
  url: string;
  customerName?: string | null;
  /** 받는 사람. 비어 있으면 보내지 않는다. */
  customerEmail: string;
};

export async function sendQuoteLinkMail(quote: QuoteMail): Promise<SendResult> {
  if (!quote.customerEmail.trim()) return { ok: false, reason: "no-recipient" };

  const rows: [string, string | undefined][] = [
    [quote.baseLabel, won(quote.baseAmount)],
    ...quote.items.map(({ label, amount }) => [label, won(amount)] as [string, string]),
    ["합계", won(quote.total)],
  ];

  // href 를 큰따옴표로 감싸고 esc() 가 따옴표를 처리하므로 속성 밖으로 빠져나갈 수 없다.
  const button = `
    <p style="margin:22px 0 0;">
      <a href="${esc(quote.url)}"
         style="display:inline-block;background:#f05540;color:#ffffff;text-decoration:none;
                padding:14px 26px;border-radius:999px;font-size:14px;font-weight:700;">
        견적 확인하고 결제하기
      </a>
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#8a92a3;word-break:break-all;">
      버튼이 눌리지 않으면 아래 주소를 브라우저에 붙여넣어 주세요.<br/>${esc(quote.url)}
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#8a92a3;">
      결제 화면은 로그인 후 열립니다. 견적번호 ${esc(quote.ref)}
    </p>`;

  const intro = quote.note
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#5c6472;white-space:pre-wrap;">${esc(quote.note)}</p>`
    : "";

  const html = layout(
    `${quote.title} 견적을 보내드립니다`,
    quote.customerName
      ? `${quote.customerName}님께 드리는 견적입니다.`
      : "협의한 내용으로 산정한 견적입니다.",
    intro + table(rows) + button,
  );

  return sendMail({
    to: quote.customerEmail,
    subject: `[핏마이웹] ${quote.title} 견적 · ${won(quote.total)}`,
    html,
    // 고객이 "답장" 을 누르면 담당자에게 온다.
    replyTo: to,
  });
}
