import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import QuoteBuilder from "@/components/admin/QuoteBuilder";
import QuoteAdminActions from "@/components/admin/QuoteAdminActions";
import { auth, authEnabled } from "@/lib/auth";
import { getQuoteById, quoteUrl } from "@/lib/quotes";

export const metadata: Metadata = {
  title: "견적 수정",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditQuotePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/admin/quotes/${params.id}`);
  if (!session.user.isAdmin) redirect("/mypage");

  const quote = await getQuoteById(params.id);
  if (!quote) notFound();

  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="container-page section-x py-32">
        <Link
          href="/admin/quotes"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent hover:underline"
        >
          ← 견적 목록
        </Link>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tightest text-ink">
          {quote.title}
        </h1>

        <QuoteAdminActions
          quoteId={quote.id}
          ref_={quote.ref}
          url={quoteUrl(quote.token)}
          status={quote.status}
          customerEmail={quote.customerEmail}
          sentAt={quote.sentAt ? quote.sentAt.toISOString() : null}
          sentCount={quote.sentCount}
        />

        <QuoteBuilder
          quote={{
            id: quote.id,
            title: quote.title,
            note: quote.note,
            customerName: quote.customerName,
            customerEmail: quote.customerEmail,
            customerPhone: quote.customerPhone,
            baseLabel: quote.baseLabel,
            baseAmount: quote.baseAmount,
            items: quote.items,
            status: quote.status,
            sent: Boolean(quote.sentAt),
          }}
        />
      </main>
      <Footer />
    </>
  );
}
