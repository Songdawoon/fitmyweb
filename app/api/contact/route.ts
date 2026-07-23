import { NextResponse } from "next/server";

/**
 * 상담 신청 접수 엔드포인트.
 *
 * 현재는 서버 로그로만 기록합니다. 운영 시 이 지점에서 이메일 발송(Resend 등)
 * 또는 DB/시트 저장, 슬랙 알림 등을 연결하세요.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const consent = body.consent === true;

  if (name.length < 2 || !phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !consent) {
    return NextResponse.json(
      { ok: false, message: "필수 항목을 확인해 주세요." },
      { status: 422 },
    );
  }

  // TODO: 이메일 발송 / DB 저장 연동
  console.info("[contact] new inquiry:", { name, email, phone });

  return NextResponse.json({ ok: true });
}
