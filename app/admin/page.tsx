import type { Metadata } from "next";
import { redirect } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { auth, authEnabled } from "@/lib/auth";
import { getAdminData } from "@/lib/account";
import { formatWon } from "@/lib/data";

export const metadata: Metadata = {
  title: "관리자",
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

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");
  // 허용 목록(ADMIN_EMAILS)에 없는 계정은 존재 자체를 알리지 않는다.
  if (!session.user.isAdmin) redirect("/mypage");

  const data = await getAdminData();

  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="container-page section-x py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          Admin
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tightest text-ink">
          상담 · 결제 현황
        </h1>

        {!data ? (
          <p className="mt-12 rounded-2xl border border-line px-5 py-8 text-[14px] text-muted">
            데이터베이스가 연결되지 않았습니다. `DATABASE_URL` 을 설정해 주세요.
          </p>
        ) : (
          <>
            <section className="mt-14">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                상담 신청 <span className="text-[13px] text-faint">{data.inquiries.length}</span>
              </h2>
              <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[720px] text-left text-[14px]">
                  <thead className="bg-mist text-[12px] uppercase tracking-wide text-faint">
                    <tr>
                      <th className="px-4 py-3 font-semibold">접수</th>
                      <th className="px-4 py-3 font-semibold">이름</th>
                      <th className="px-4 py-3 font-semibold">연락처</th>
                      <th className="px-4 py-3 font-semibold">이메일</th>
                      <th className="px-4 py-3 font-semibold">업종</th>
                      <th className="px-4 py-3 font-semibold">예산</th>
                      <th className="px-4 py-3 font-semibold">메일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.inquiries.map((q) => (
                      <tr key={q.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-faint">
                          {formatDateTime(q.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink">{q.name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{q.phone}</td>
                        <td className="px-4 py-3 text-muted">{q.email}</td>
                        <td className="px-4 py-3 text-muted">{q.industry ?? "-"}</td>
                        <td className="px-4 py-3 text-muted">{q.budget ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className={q.mailed ? "text-ink" : "text-accent"}>
                            {q.mailed ? "발송" : "실패"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {data.inquiries.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-faint">
                          접수된 상담이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-14">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                결제 <span className="text-[13px] text-faint">{data.orders.length}</span>
              </h2>
              <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[720px] text-left text-[14px]">
                  <thead className="bg-mist text-[12px] uppercase tracking-wide text-faint">
                    <tr>
                      <th className="px-4 py-3 font-semibold">결제</th>
                      <th className="px-4 py-3 font-semibold">플랜</th>
                      <th className="px-4 py-3 font-semibold">금액</th>
                      <th className="px-4 py-3 font-semibold">고객</th>
                      <th className="px-4 py-3 font-semibold">주문번호</th>
                      <th className="px-4 py-3 font-semibold">경로</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.orders.map((o) => (
                      <tr key={o.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-faint">
                          {formatDateTime(o.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink">{o.planName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink">
                          {formatWon(o.amount)}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {o.customerName ?? "-"}
                          {o.customerEmail ? ` · ${o.customerEmail}` : ""}
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-faint">
                          {o.merchantUid}
                        </td>
                        <td className="px-4 py-3 text-muted">{o.source}</td>
                      </tr>
                    ))}
                    {data.orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-faint">
                          결제 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
