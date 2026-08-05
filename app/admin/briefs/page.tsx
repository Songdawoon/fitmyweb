import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { auth, authEnabled } from "@/lib/auth";
import { formatWon } from "@/lib/data";
import { listBriefs } from "@/lib/briefs";

export const metadata: Metadata = {
  title: "제작 정보",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDateTime(value: Date | string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminBriefsPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin/briefs");
  if (!session.user.isAdmin) redirect("/mypage");

  const rows = await listBriefs();

  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="container-page section-x py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Admin</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <h1 className="font-display text-4xl font-extrabold tracking-tightest text-ink">
            제작 정보
          </h1>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="inline-flex rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
            >
              상담 · 결제
            </Link>
            <Link
              href="/admin/quotes"
              className="inline-flex rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
            >
              주문제작 견적
            </Link>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-[15px] text-muted">
          결제한 고객에게 작성 링크가 자동으로 발송됩니다. 아직 작성 전인 건은 링크를 복사해
          다시 안내할 수 있습니다.
        </p>

        {!rows ? (
          <p className="mt-12 rounded-2xl border border-line px-5 py-8 text-[14px] text-muted">
            데이터베이스가 연결되지 않았습니다. `DATABASE_URL` 을 설정해 주세요.
          </p>
        ) : (
          <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[860px] text-left text-[14px]">
              <thead className="bg-mist text-[12px] uppercase tracking-wide text-faint">
                <tr>
                  <th className="px-4 py-3 font-semibold">결제</th>
                  <th className="px-4 py-3 font-semibold">상호</th>
                  <th className="px-4 py-3 font-semibold">고객</th>
                  <th className="px-4 py-3 font-semibold">플랜</th>
                  <th className="px-4 py-3 font-semibold">작성</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ brief, order }) => {
                  const unseen = Boolean(brief.submittedAt) && !brief.seenAt;
                  return (
                    <tr key={brief.id} className={unseen ? "bg-accent/5" : undefined}>
                      <td className="whitespace-nowrap px-4 py-3 text-faint">
                        {formatDateTime(order?.createdAt ?? brief.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {unseen && (
                          <span className="mr-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper">
                            New
                          </span>
                        )}
                        <Link href={`/admin/briefs/${brief.id}`} className="hover:text-accent">
                          {brief.companyName || "(작성 전)"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {order?.customerName ?? "-"}
                        {order?.customerEmail ? ` · ${order.customerEmail}` : ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {order ? `${order.planName} · ${formatWon(order.amount)}` : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-faint">
                        {brief.submittedAt ? formatDateTime(brief.updatedAt) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {brief.submittedAt ? (
                          <span className="text-ink">작성 완료</span>
                        ) : brief.invitedAt ? (
                          <span className="text-faint">안내 발송됨</span>
                        ) : (
                          <span className="text-accent">안내 미발송</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-faint">
                      아직 결제 건이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
