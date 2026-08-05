import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  createQuoteMerchantUid,
  getQuoteByToken,
  setQuoteMerchantUid,
} from "@/lib/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 견적 결제 준비. 결제창을 열기 **직전**에 브라우저가 호출한다.
 *
 * 화면을 열어 둔 사이 관리자가 견적을 고쳤을 수 있는데, 그때 옛 금액으로
 * 결제창을 열면 승인은 되고 서버 검증에서 실패해 가장 나쁜 상태가 된다
 * (돈은 빠져나갔는데 주문은 없음). 여기서 최신 금액을 돌려주어 화면이
 * 어긋남을 먼저 알아채게 한다.
 *
 * 주문번호도 여기서 발급한다 — 클라이언트가 만들면 다른 견적의 ref 를 붙여
 * 보낼 수 있고, 그러면 resolveBillable 의 교차 검증이 무의미해진다.
 */
export async function POST(_req: Request, { params }: { params: { token: string } }) {
  // 로그인 필수. 링크를 아는 것만으로는 결제할 수 없다.
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const quote = await getQuoteByToken(params.token);
  if (!quote) {
    return NextResponse.json(
      { ok: false, message: "견적을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (quote.status === "paid") {
    return NextResponse.json(
      { ok: false, message: "이미 결제가 완료된 견적입니다." },
      { status: 409 },
    );
  }
  if (quote.status !== "open") {
    return NextResponse.json(
      { ok: false, message: "종료된 견적입니다. 담당자에게 문의해 주세요." },
      { status: 409 },
    );
  }

  const merchantUid = createQuoteMerchantUid(quote.ref);
  // 웹훅만 도착한 건을 사람이 되짚을 수 있도록 남긴다. 실패해도 결제는 진행한다.
  await setQuoteMerchantUid(quote.id, merchantUid);

  return NextResponse.json({
    ok: true,
    merchantUid,
    quoteId: quote.id,
    amount: quote.total,
  });
}
