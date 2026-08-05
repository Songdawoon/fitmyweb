import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { isEmailConfigured, sendQuoteLinkMail } from "@/lib/email";
import { getQuoteById, markQuoteSent, quoteUrl } from "@/lib/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 견적 결제 링크를 고객에게 메일로 보낸다. 관리자 전용.
 *
 * 메일이 안 나가도 기능은 성립한다 — 관리자 화면이 링크 복사를 항상 제공하므로,
 * 여기서는 실패를 숨기지 않고 그대로 알려 직접 보내도록 안내한다.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false }, { status: guard.status });

  const quote = await getQuoteById(params.id);
  if (!quote) {
    return NextResponse.json(
      { ok: false, message: "견적을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (!quote.customerEmail) {
    return NextResponse.json(
      { ok: false, message: "고객 이메일을 먼저 입력해 주세요." },
      { status: 422 },
    );
  }

  if (quote.status !== "open") {
    return NextResponse.json(
      { ok: false, message: "결제할 수 없는 상태의 견적입니다." },
      { status: 409 },
    );
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message: "메일 설정이 없어 발송하지 못했습니다. 링크를 복사해 직접 보내 주세요.",
      },
      { status: 503 },
    );
  }

  const sent = await sendQuoteLinkMail({
    ref: quote.ref,
    title: quote.title,
    note: quote.note,
    baseLabel: quote.baseLabel,
    baseAmount: quote.baseAmount,
    items: quote.items,
    total: quote.total,
    url: quoteUrl(quote.token),
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
  });

  if (!sent.ok) {
    console.error("[quote] 견적 메일 발송 실패:", sent.reason, quote.ref);
    return NextResponse.json(
      {
        ok: false,
        message: "메일 발송에 실패했습니다. 링크를 복사해 직접 보내 주세요.",
      },
      { status: 502 },
    );
  }

  await markQuoteSent(quote.id);
  return NextResponse.json({ ok: true, sentTo: quote.customerEmail });
}
