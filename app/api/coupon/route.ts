import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { issueAllCoupons } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 쿠폰 발급 — 팝업의 "쿠폰 다운받기" 가 호출한다.
 *
 * 이벤트 쿠폰과 회원가입 쿠폰을 한 번에 발급한다. 계정당 종류별 1장이라는
 * 규칙은 DB 유니크 인덱스가 보증하므로, 이 라우트는 세션 확인과 응답 변환만
 * 한다. 비로그인은 401 로 답하고 화면이 로그인 페이지로 보낸다(리다이렉트를
 * 서버가 하지 않는 이유는, 팝업이 fetch 로 부르기 때문에 3xx 를 받아도
 * 사용자가 이동하지 않기 때문).
 *
 * 이벤트 쿠폰은 비회원도 결제 화면에서 쓸 수 있지만(공개 코드), 계정에
 * 저장해 두면 마이페이지에서 사용 여부까지 확인할 수 있다.
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

  const results = await issueAllCoupons(session.user.id);

  // 한 장도 손에 넣지 못한 경우에만 실패로 답한다 — 이벤트가 끝나 event 만
  // 빠지는 상황에서는 회원가입 쿠폰 발급이 정상 처리되어야 한다.
  const usable = results.filter((r) => r.status === "issued" || r.status === "already");
  if (usable.length === 0) {
    return NextResponse.json({ status: "unavailable", results }, { status: 503 });
  }

  return NextResponse.json({ status: "ok", results });
}
