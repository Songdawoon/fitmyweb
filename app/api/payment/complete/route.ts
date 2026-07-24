import { NextResponse } from "next/server";
import { verifyPayment, recordOrder } from "@/lib/portone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 결제창이 닫힌 뒤 브라우저가 호출하는 결제 확인 엔드포인트.
 *
 * 클라이언트가 보내는 값은 imp_uid 뿐이며, 금액과 플랜은 포트원에서 다시
 * 조회한 결제 건을 기준으로 판단합니다(lib/portone.ts).
 *
 * 사용자가 결제 직후 브라우저를 닫으면 이 호출이 유실될 수 있으므로,
 * 주문 확정의 최종 보증은 웹훅(/api/payment/webhook)이 담당합니다.
 */
export async function POST(req: Request) {
  let body: { impUid?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "failed", message: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const impUid = typeof body.impUid === "string" ? body.impUid.trim() : "";
  if (!impUid) {
    return NextResponse.json(
      { status: "failed", message: "결제 정보를 확인할 수 없습니다." },
      { status: 400 },
    );
  }

  const result = await verifyPayment(impUid);

  if (result.status === "failed") {
    return NextResponse.json(
      { status: "failed", verified: false, message: result.message },
      { status: result.httpStatus },
    );
  }

  if (result.status === "pending") {
    return NextResponse.json({
      status: "pending",
      verified: false,
      impUid: result.impUid,
      paymentStatus: result.paymentStatus,
      message: result.message,
    });
  }

  recordOrder({
    source: "client",
    impUid: result.impUid,
    merchantUid: result.merchantUid,
    plan: result.plan,
    amount: result.amount,
    meta: result.meta,
  });

  return NextResponse.json({
    status: "paid",
    verified: true,
    impUid: result.impUid,
    merchantUid: result.merchantUid,
    planId: result.plan.id,
    amount: result.amount,
  });
}
