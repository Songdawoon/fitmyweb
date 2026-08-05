import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { auth, authEnabled } from "@/lib/auth";
import { formatWon } from "@/lib/data";
import { listQuotes } from "@/lib/quotes";
import { asQuoteStatus, quoteStatusLabel, quoteStatusTone } from "@/lib/quoteStatus";

export const metadata: Metadata = {
  title: "주문제작 견적",
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

export default async function AdminQuotesPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin/quotes");
  if (!session.user.isAdmin) redirect("/mypage");

  const quotes = await listQuotes();

  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="container-page section-x py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Admin</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <h1 className="font-display text-4xl font-extrabold tracking-tightest text-ink">
            주문제작 견적
          </h1>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="inline-flex rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
            >
              상담 · 결제
            </Link>
            <Link
              href="/admin/quotes/new"
              className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-accent"
            >
              새 견적
            </Link>
          </div>
        </div>

        {!quotes ? (
          <p className="mt-12 rounded-2xl border border-line px-5 py-8 text-[14px] text-muted">
            데이터베이스가 연결되지 않았습니다. `DATABASE_URL` 을 설정해 주세요.
          </p>
        ) : (
          <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[860px] text-left text-[14px]">
              <thead className="bg-mist text-[12px] uppercase tracking-wide text-faint">
                <tr>
                  <th className="px-4 py-3 font-semibold">생성</th>
                  <th className="px-4 py-3 font-semibold">견적번호</th>
                  <th className="px-4 py-3 font-semibold">제목</th>
                  <th className="px-4 py-3 font-semibold">고객</th>
                  <th className="px-4 py-3 font-semibold">금액</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold">발송</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {quotes.map((q) => {
                  const status = asQuoteStatus(q.status);
                  return (
                    <tr key={q.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-faint">
                        {formatDateTime(q.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-faint">{q.ref}</td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        <Link href={`/admin/quotes/${q.id}`} className="hover:text-accent">
                          {q.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {q.customerName ?? "-"}
                        {q.customerEmail ? ` · ${q.customerEmail}` : ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink">
                        {formatWon(q.total)}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 ${quoteStatusTone[status]}`}>
                        {quoteStatusLabel[status]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {q.sentAt ? `${formatDateTime(q.sentAt)} (${q.sentCount}회)` : "-"}
                      </td>
                    </tr>
                  );
                })}
                {quotes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-faint">
                      아직 만든 견적이 없습니다.
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
