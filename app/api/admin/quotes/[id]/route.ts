import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { getQuoteById, setQuoteOpen, updateQuote } from "@/lib/quotes";
import { parseQuoteBody } from "../parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 견적 수정 또는 상태 변경(닫기·다시 열기). 관리자 전용.
 *
 * 본문에 `status` 만 있으면 상태 변경으로 보고, 그 외에는 내용 수정으로 본다.
 * 결제가 끝난 견적은 어느 쪽도 허용하지 않는다 — 고객이 본 금액과 영수증이
 * 어긋나면 안 되고, 되돌리려면 환불 후 견적을 새로 만드는 쪽이 기록상 정확하다.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

  const existing = await getQuoteById(params.id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, message: "견적을 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  if (existing.status === "paid") {
    return NextResponse.json(
      { ok: false, message: "결제가 완료된 견적은 수정할 수 없습니다." },
      { status: 409 },
    );
  }

  const body = raw as Record<string, unknown>;

  // ── 상태 변경 ────────────────────────────────────────────────
  if (typeof body.status === "string" && !body.title) {
    if (body.status !== "open" && body.status !== "closed") {
      return NextResponse.json(
        { ok: false, message: "알 수 없는 상태입니다." },
        { status: 422 },
      );
    }

    const row = await setQuoteOpen(params.id, body.status === "open");
    if (!row) {
      return NextResponse.json(
        { ok: false, message: "상태를 바꾸지 못했습니다." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, quote: { id: row.id, status: row.status } });
  }

  // ── 내용 수정 ────────────────────────────────────────────────
  const parsed = parseQuoteBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, message: parsed.message }, { status: 422 });
  }

  const row = await updateQuote(params.id, parsed.value);
  if (!row) {
    return NextResponse.json(
      { ok: false, message: "견적을 저장하지 못했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    quote: { id: row.id, ref: row.ref, total: row.total, status: row.status },
  });
}
