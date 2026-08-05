import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { getBriefById, setBriefLocked } from "@/lib/briefs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 제작 정보 확정 / 확정 해제. 관리자 전용.
 *
 * 확정하면 고객이 더 이상 고칠 수 없다 — 제작을 시작한 뒤에 내용이 바뀌면
 * 무엇을 기준으로 만든 건지 알 수 없게 된다.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false }, { status: guard.status });

  let body: { locked?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  }

  if (typeof body.locked !== "boolean") {
    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 422 });
  }

  const detail = await getBriefById(params.id);
  if (!detail) {
    return NextResponse.json(
      { ok: false, message: "제작 정보를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  // 작성 전인 건을 확정하면 빈 내용으로 잠겨 고객이 아무것도 못 적는다.
  if (body.locked && !detail.brief.submittedAt) {
    return NextResponse.json(
      { ok: false, message: "고객이 아직 작성하지 않았습니다." },
      { status: 409 },
    );
  }

  const row = await setBriefLocked(params.id, body.locked);
  if (!row) {
    return NextResponse.json(
      { ok: false, message: "처리하지 못했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, locked: Boolean(row.lockedAt) });
}
