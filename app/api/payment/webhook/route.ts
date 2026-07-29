import { NextResponse } from "next/server";
import { verifyPayment, recordOrder } from "@/lib/portone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 포트원 V1 결제알림(웹훅) 수신 엔드포인트.
 *
 * 브라우저가 결제 직후 닫히거나 네트워크가 끊겨도 주문이 유실되지 않도록,
 * 결제 확정의 최종 보증은 이 웹훅이 담당합니다.
 *
 * 콘솔 설정: 결제 연동 → 연동 정보 → 결제알림(Webhook) 관리 → [결제 모듈 V1]
 *   URL      https://{도메인}/api/payment/webhook
 *
 * V1 웹훅에는 서명이 없습니다. 공개된 URL 이라 누구나 위조 요청을 보낼 수
 * 있으므로, 본문의 status 를 절대 신뢰하지 않고 imp_uid 로 결제 건을 다시
 * 조회해 금액·상태를 확인합니다(verifyPayment).
 *
 * 문서: https://developers.portone.io/opi/ko/integration/webhook/readme-v1?v=v1
 */
export async function POST(req: Request) {
  // 콘솔에서 Content-Type 을 json / x-www-form-urlencoded 중 무엇으로 두든 받는다.
  let payload: Record<string, unknown> = {};
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      payload = Object.fromEntries(new URLSearchParams(await req.text()));
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const impUid = typeof payload.imp_uid === "string" ? payload.imp_uid : "";
  if (!impUid) {
    return NextResponse.json({ ok: false, message: "imp_uid 누락" }, { status: 400 });
  }

  const result = await verifyPayment(impUid);

  switch (result.status) {
    case "paid":
      await recordOrder({
        source: "webhook",
        impUid: result.impUid,
        merchantUid: result.merchantUid,
        plan: result.plan,
        amount: result.amount,
        meta: result.meta,
        couponId: result.couponId,
      });
      return NextResponse.json({ ok: true, verified: true });

    case "pending":
      // 가상계좌 발급(status=ready). 입금이 확인되면 paid 웹훅이 다시 온다.
      console.info("[webhook] 입금 대기:", impUid);
      return NextResponse.json({ ok: true, verified: false });

    default:
      // 재시도해도 결과가 같으므로 200 으로 종결하고 로그만 남깁니다.
      // TODO: 주문 저장소를 붙이면 취소 건은 여기서 주문 상태를 갱신하세요.
      console.error("[webhook] 검증 실패:", impUid, result.message);
      return NextResponse.json({ ok: true, verified: false });
  }
}
