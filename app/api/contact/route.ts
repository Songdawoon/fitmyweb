import { NextResponse } from "next/server";
import { sendInquiryMail, isEmailConfigured, type Inquiry } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 문자열 필드를 다듬어 꺼낸다. 길이 제한은 메일이 터무니없이 길어지는 것만 막는 용도. */
function str(value: unknown, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * 상담 신청 접수 엔드포인트.
 *
 * 저장소가 없으므로 접수 즉시 담당자 메일로 보내는 것이 유일한 보존 수단입니다.
 * 따라서 메일 발송에 실패하면 성공으로 응답하지 않습니다 — 고객에게 접수됐다고
 * 알린 뒤 아무 데도 남지 않는 상황이 가장 나쁩니다.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  }

  const inquiry: Inquiry = {
    name: str(body.name, 100),
    phone: str(body.phone, 40),
    email: str(body.email, 200),
    industry: str(body.industry, 100),
    purpose: str(body.purpose, 500),
    needs: str(body.needs, 1000),
    reference: str(body.reference, 500),
    budget: str(body.budget, 100),
    timeline: str(body.timeline, 200),
    message: str(body.message),
  };
  const consent = body.consent === true;

  if (
    inquiry.name.length < 2 ||
    !inquiry.phone ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email) ||
    !consent
  ) {
    return NextResponse.json(
      { ok: false, message: "필수 항목을 확인해 주세요." },
      { status: 422 },
    );
  }

  // 키가 아직 없는 개발 환경 — 폼이 막히지 않도록 통과시키되 내용을 통째로 남긴다.
  if (!isEmailConfigured()) {
    console.warn(
      "[contact] 메일 설정이 없어 발송하지 않았습니다. .env.local 의 RESEND_API_KEY 를 확인하세요.",
      inquiry,
    );
    return NextResponse.json({ ok: true, delivered: false });
  }

  const sent = await sendInquiryMail(inquiry);

  if (!sent.ok) {
    // 메일이 실패하면 최소한 런타임 로그에는 전체 내용을 남겨 복구할 수 있게 한다.
    console.error("[contact] 상담 신청 메일 발송 실패 — 원문:", sent.reason, inquiry);
    return NextResponse.json(
      {
        ok: false,
        message:
          "접수 처리 중 문제가 발생했습니다. 잠시 후 다시 시도하시거나 카카오톡 상담으로 문의해 주세요.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, delivered: true });
}
