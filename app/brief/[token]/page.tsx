import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BriefForm from "@/components/BriefForm";
import { authEnabled } from "@/lib/auth";
import { briefIntro } from "@/lib/data";
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

  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="container-page section-x py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          {briefIntro.eyebrow}
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold tracking-tightest text-ink">
          {briefIntro.title}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
          {briefIntro.lead}
        </p>

        <div className="mt-12 max-w-3xl">
          <BriefForm
            token={params.token}
            initial={values}
            submitted={Boolean(brief.submittedAt)}
            planName={planName}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
