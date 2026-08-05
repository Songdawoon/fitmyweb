import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BriefForm from "@/components/BriefForm";
import { authEnabled } from "@/lib/auth";
import { briefFields, briefIntro } from "@/lib/data";
import { briefValuesOf, getBriefByToken, getBriefById } from "@/lib/briefs";

export const metadata: Metadata = {
  title: "제작 정보 입력",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: { token: string } }) {
  const brief = await getBriefByToken(params.token);
  // DB 미연결도 여기로 온다. 링크의 존재 여부를 알리지 않는다.
  if (!brief) notFound();

  const detail = await getBriefById(brief.id);
  const planName = detail?.order?.planName ?? null;

  // 결제할 때 남긴 정보를 미리 채워 둔다 — 같은 걸 두 번 적게 하지 않는다.
  const values = briefValuesOf(brief);
  if (!brief.submittedAt && detail?.order) {
    values.companyName ||= detail.order.customerName ?? "";
    values.email ||= detail.order.customerEmail ?? "";
  }

  // 확정된 뒤에는 고칠 수 없다. 다만 자기가 보낸 내용은 계속 볼 수 있게 둔다 —
  // 링크를 통째로 막으면 "내가 뭐라고 썼더라" 를 묻는 연락이 늘어난다.
  const locked = Boolean(brief.lockedAt);

  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="container-page section-x py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          {briefIntro.eyebrow}
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold tracking-tightest text-ink">
          {locked ? "제작 정보가 확정되었습니다" : briefIntro.title}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
          {locked
            ? "담당자 확인이 끝나 아래 내용으로 제작을 진행합니다. 변경이 필요하시면 담당자에게 연락해 주세요."
            : briefIntro.lead}
        </p>

        <div className="mt-12 max-w-3xl">
          {locked ? (
            <div className="overflow-hidden rounded-2xl border border-line">
              <table className="w-full text-left text-[14px]">
                <tbody className="divide-y divide-line">
                  {briefFields.map((field) => (
                    <tr key={field.key}>
                      <td className="w-48 bg-mist px-4 py-3 align-top text-[13px] text-muted">
                        {field.label}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-3 text-ink">
                        {values[field.key] || <span className="text-faint">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <BriefForm
              token={params.token}
              initial={values}
              submitted={Boolean(brief.submittedAt)}
              planName={planName}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
