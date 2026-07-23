import { NextResponse } from "next/server";
import { getPlan } from "@/lib/data";

/**
 * Server-side payment verification.
 *
 * The browser only knows a paymentId. Never trust the amount from the client —
 * we re-fetch the payment from PortOne and compare the paid amount against the
 * plan's real price. This is what prevents a user from tampering totalAmount.
 *
 * Docs: GET https://api.portone.io/payments/{paymentId}
 *       Authorization: PortOne {API_SECRET}
 */
export async function POST(req: Request) {
  let body: { paymentId?: string; planId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "failed", message: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const { paymentId, planId } = body;
  const plan = getPlan(planId);

  if (!paymentId || !plan) {
    return NextResponse.json(
      { status: "failed", message: "결제 정보를 확인할 수 없습니다." },
      { status: 400 },
    );
  }

  const secret = process.env.PORTONE_API_SECRET;

  // ── Placeholder / test mode ────────────────────────────────────────
  // No real secret yet: accept the payment but flag it as unverified so the
  // UI can be honest about it. Wire PORTONE_API_SECRET to enable real checks.
  if (!secret || secret.startsWith("your-")) {
    return NextResponse.json({
      status: "paid",
      verified: false,
      mode: "placeholder",
      paymentId,
    });
  }

  // ── Real verification ──────────────────────────────────────────────
  try {
    const res = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `PortOne ${secret}` }, cache: "no-store" },
    );

    if (!res.ok) {
      return NextResponse.json(
        { status: "failed", message: "결제 조회에 실패했습니다." },
        { status: 502 },
      );
    }

    const payment = await res.json();
    const paidAmount = payment?.amount?.total;
    const paidStatus = payment?.status;

    // Amount must match the plan price exactly.
    if (paidAmount !== plan.price) {
      return NextResponse.json(
        {
          status: "failed",
          message: "결제 금액이 일치하지 않습니다.",
        },
        { status: 400 },
      );
    }

    if (paidStatus !== "PAID") {
      return NextResponse.json({
        status: "pending",
        verified: false,
        paymentStatus: paidStatus,
        paymentId,
      });
    }

    // TODO: persist the order here (DB) before responding in production.
    return NextResponse.json({
      status: "paid",
      verified: true,
      paymentId,
    });
  } catch {
    return NextResponse.json(
      { status: "failed", message: "결제 검증 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
