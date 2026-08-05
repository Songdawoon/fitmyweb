import { NextResponse } from "next/server";

import { briefFields } from "@/lib/data";
import { formatPhone, isValidPhone, PHONE_HINT } from "@/lib/phone";
import { getBriefByToken, normalizeBriefValues, saveBrief } from "@/lib/briefs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 고객이 적은 제작 정보를 저장한다.
 *
 * 로그인은 요구하지 않는다 — 결제 직후에 로그인을 한 번 더 시키면 그냥 나가
 * 버리고, 그러면 제작에 필요한 내용을 영영 못 받는다. 링크의 토큰이 열쇠이며,
 * 토큰을 가진 사람이 볼 수 있는 것은 자기가 적은 내용뿐이다.
 *
 * 몇 번이든 다시 보낼 수 있다. 자료를 나중에 찾아 채우는 경우가 흔하다.
 */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const brief = await getBriefByToken(params.token);
  if (!brief) {
    return NextResponse.json(
      { ok: false, message: "작성 링크를 확인할 수 없습니다." },
      { status: 404 },
    );
  }

  // 확정된 건은 고칠 수 없다. saveBrief 도 WHERE 로 한 번 더 막지만,
  // 여기서 걸러야 고객에게 이유를 알려 줄 수 있다.
  if (brief.lockedAt) {
    return NextResponse.json(
      {
        ok: false,
        message: "담당자 확인이 끝나 내용이 확정되었습니다. 변경이 필요하시면 담당자에게 연락해 주세요.",
      },
      { status: 409 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  }

  const values = normalizeBriefValues(raw);

  // 필수 항목은 정의(briefFields)를 그대로 따른다 — 화면과 서버가 어긋나지 않는다.
  const missing = briefFields.find((f) => f.required && !values[f.key]);
  if (missing) {
    return NextResponse.json(
      { ok: false, message: `${missing.label} 항목을 입력해 주세요.` },
      { status: 422 },
    );
  }

  if (values.phone && !isValidPhone(values.phone)) {
    return NextResponse.json(
      { ok: false, message: `연락처를 확인해 주세요. ${PHONE_HINT}` },
      { status: 422 },
    );
  }
  if (values.phone) values.phone = formatPhone(values.phone);

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return NextResponse.json(
      { ok: false, message: "이메일 형식을 확인해 주세요." },
      { status: 422 },
    );
  }

  const saved = await saveBrief(params.token, values);
  if (!saved) {
    return NextResponse.json(
      { ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
