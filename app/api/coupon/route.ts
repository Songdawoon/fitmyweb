import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { issueSignupCoupon } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 회원가입 쿠폰 발급 — 팝업의 "쿠폰 다운받기" 가 호출한다.
 *
 * 계정당 1장이라는 규칙은 DB 유니크 인덱스가 보증하므로, 이 라우트는
 * 세션 확인과 응답 변환만 한다. 비로그인은 401 로 답하고 화면이 로그인
 * 페이지로 보낸다(리다이렉트를 서버가 하지 않는 이유는, 팝업이 fetch 로
 * 부르기 때문에 3xx 를 받아도 사용자가 이동하지 않기 때문).
 */
export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ status: "unauthenticated" }, { status: 401 });
  }

  if (!session.user.id) {
    // 로그인은 됐지만 DATABASE_URL 이 없어 users 행이 만들어지지 않은 상태.
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  const result = await issueSignupCoupon(session.user.id);

  if (result.status === "unavailable") {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  return NextResponse.json(result);
}
