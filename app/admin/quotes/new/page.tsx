import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import QuoteBuilder from "@/components/admin/QuoteBuilder";
import { auth, authEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  title: "새 견적",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin/quotes/new");
  if (!session.user.isAdmin) redirect("/mypage");

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
          새 견적
        </h1>
        <p className="mt-3 text-[15px] text-muted">
          저장하면 결제 링크가 만들어집니다. 링크는 다음 화면에서 복사하거나 메일로 보낼 수 있습니다.
        </p>

        <QuoteBuilder quote={null} />
      </main>
      <Footer />
    </>
  );
}
