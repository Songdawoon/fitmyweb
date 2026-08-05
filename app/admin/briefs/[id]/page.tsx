import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CopyLink from "@/components/admin/CopyLink";
import { auth, authEnabled } from "@/lib/auth";
import { briefFields, formatWon } from "@/lib/data";
import { briefUrl, briefValuesOf, getBriefById, markBriefSeen } from "@/lib/briefs";

export const metadata: Metadata = {
  title: "제작 정보 상세",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function BriefDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/admin/briefs/${params.id}`);
  if (!session.user.isAdmin) redirect("/mypage");

  const detail = await getBriefById(params.id);
  if (!detail) notFound();

  const { brief, order } = detail;

  // 열어 봤으면 확인한 것으로 본다. 고객이 다시 고치면 saveBrief 가 이 값을 비운다.
  if (brief.submittedAt && !brief.seenAt) await markBriefSeen(brief.id);

  const values = briefValuesOf(brief);

  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="container-page section-x py-32">
        <Link
          href="/admin/briefs"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent hover:underline"
        >
          ← 제작 정보 목록
        </Link>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tightest text-ink">
          {brief.companyName || "(작성 전)"}
        </h1>
        {order && (
          <p className="mt-3 text-[15px] text-muted">
            {order.planName} · {formatWon(order.amount)}
            {order.customerName ? ` · ${order.customerName}` : ""}
            {order.customerEmail ? ` · ${order.customerEmail}` : ""}
          </p>
        )}

        <section className="mt-10 rounded-3xl border border-line bg-mist/50 p-8">
          <CopyLink url={briefUrl(brief.token)} label="고객 작성 링크" />
          <p className="mt-4 text-[13px] text-faint">
            {brief.submittedAt
              ? `최초 작성 ${new Date(brief.submittedAt).toLocaleString("ko-KR")} · 최종 수정 ${new Date(brief.updatedAt).toLocaleString("ko-KR")}`
              : brief.invitedAt
                ? `안내 메일 발송 ${new Date(brief.invitedAt).toLocaleString("ko-KR")} · 아직 작성 전입니다.`
                : "안내 메일이 아직 발송되지 않았습니다. 위 링크를 복사해 직접 보내 주세요."}
          </p>
        </section>

        {!brief.submittedAt ? (
          <p className="mt-10 rounded-2xl border border-line px-5 py-8 text-[14px] text-muted">
            고객이 아직 작성하지 않았습니다.
          </p>
        ) : (
          <div className="mt-10 overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left text-[14px]">
              <tbody className="divide-y divide-line">
                {briefFields.map((field) => (
                  <tr key={field.key}>
                    <td className="w-56 bg-mist px-4 py-3 align-top text-[13px] text-muted">
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
        )}
      </main>
      <Footer />
    </>
  );
}
