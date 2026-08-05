import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { createQuote } from "@/lib/quotes";
import { parseQuoteBody } from "./parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 견적 생성. 관리자 전용.
 *
 * 총액은 받지 않는다 — 항목에서 서버가 다시 계산한다(createQuote).
 * 클라이언트가 보낸 금액을 저장하면 결제 검증의 기준 자체가 오염된다.
 */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false }, { status: guard.status });

  if (!isDbConfigured()) {
    return NextResponse.json(
      { ok: false, message: "데이터베이스가 연결되지 않았습니다." },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  }

  const parsed = parseQuoteBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, message: parsed.message }, { status: 422 });
  }

  const quote = await createQuote({ ...parsed.value, createdByEmail: guard.email });
  if (!quote) {
    return NextResponse.json(
      { ok: false, message: "견적을 저장하지 못했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    quote: { id: quote.id, ref: quote.ref, token: quote.token, total: quote.total },
  });
}
