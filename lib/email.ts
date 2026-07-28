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
}): Promise<SendResult> {
  if (!isEmailConfigured()) return { ok: false, reason: "not-configured" };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        // 콤마로 여러 수신자를 넣을 수 있게 한다.
        to: to!
          .split(",")
          .map((addr) => addr.trim())
          .filter(Boolean),
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
};

export async function sendOrderMail(order: OrderMail): Promise<SendResult> {
  const html = layout(
    `${order.planName} 결제가 완료되었습니다`,
    `결제 확인 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · 경로 ${order.source}`,
    table([
      ["플랜", order.planName],
      ["결제 금액", `${order.amount.toLocaleString("ko-KR")}원`],
      ["주문자", order.name],
      ["이메일", order.email],
      ["연락처", order.phone],
      ["주문번호", order.merchantUid],
      ["결제번호 (imp_uid)", order.impUid],
    ]),
  );

  return sendMail({
    subject: `[결제완료] ${order.planName} · ${order.amount.toLocaleString("ko-KR")}원`,
    html,
    replyTo: order.email,
  });
}
