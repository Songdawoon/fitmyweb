import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { getUnseenOrders, markOrdersSeen } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 미확인 결제 현황. 관리자 화면이 주기적으로 물어 새 결제를 알린다. */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false }, { status: guard.status });

  return NextResponse.json({ ok: true, ...(await getUnseenOrders()) });
}

/** 모두 확인 처리. */
export async function POST() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false }, { status: guard.status });

  const marked = await markOrdersSeen();
  return NextResponse.json({ ok: true, marked });
}
