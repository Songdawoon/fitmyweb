import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import QuoteCheckoutClient from "@/components/QuoteCheckoutClient";
import { auth, authEnabled } from "@/lib/auth";
import { claimQuote, getQuoteByToken } from "@/lib/quotes";

export const metadata: Metadata = {
  title: "견적 결제",
  robots: { index: false, follow: false },
};

/** 관리자가 금액을 고칠 수 있으므로 절대 캐시하지 않는다. */
export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: { token: string } }) {
  // 로그인 필수 — 링크를 아는 것만으로는 결제할 수 없다. 결제자 신원이
  // 남아야 링크가 엉뚱한 사람에게 흘러갔을 때 드러난다.
  const session = await auth();
  if (!session) {
    redirect(`/login?callbackUrl=/quote/${encodeURIComponent(params.token)}`);
  }

  const quote = await getQuoteByToken(params.token);
  // DB 미연결도 여기로 온다. 견적의 존재 여부를 알리지 않는다.
  if (!quote) notFound();

  // 링크를 처음 연 계정을 기록한다(이미 있으면 그대로 둔다).
  if (session.user.id) await claimQuote(quote.id, session.user.id);

  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="min-h-[60vh]">
        <QuoteCheckoutClient
          token={params.token}
          quoteId={quote.id}
          ref_={quote.ref}
          title={quote.title}
          note={quote.note}
          baseLabel={quote.baseLabel}
          baseAmount={quote.baseAmount}
          items={quote.items}
          total={quote.total}
          status={quote.status}
          impCode={process.env.NEXT_PUBLIC_PORTONE_IMP_CODE ?? ""}
          channelKey={process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? ""}
          pg={process.env.NEXT_PUBLIC_PORTONE_PG ?? ""}
          defaultName={quote.customerName ?? session.user.name ?? ""}
          defaultEmail={quote.customerEmail ?? session.user.email ?? ""}
          defaultPhone={quote.customerPhone ?? ""}
        />
      </main>
      <Footer />
    </>
  );
}
