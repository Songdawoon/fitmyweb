import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { about, brand, fits } from "@/lib/data";

export const metadata: Metadata = {
  title: "마이핏웹 소개",
  description: about.intro,
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="border-b border-line bg-mist pt-32">
          <div className="container-page section-x py-20 sm:py-28">
            <Reveal>
              <p className="eyebrow">About {brand.latin}</p>
              <h1 className="mt-6 h-display text-4xl/[1.4] sm:text-5xl/[1.4] lg:text-[3.4rem]/[1.4]">
                {about.title.map((t) => (
                  <span key={t} className="block">
                    {t}
                  </span>
                ))}
              </h1>
              <p className="mt-7 max-w-[58ch] text-[17px] leading-relaxed text-muted">
                {about.intro}
              </p>
            </Reveal>
          </div>
        </section>

        {/* Mission */}
        <section className="container-page section-x py-24 sm:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="eyebrow">Mission</p>
              </Reveal>
            </div>
            <div className="lg:col-span-8">
              <Reveal>
                <p className="h-display text-2xl/[1.4] sm:text-3xl/[1.4] lg:text-[2.2rem]/[1.4]">
                  {about.mission}
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="border-y border-line bg-mist">
          <div className="container-page section-x py-24 sm:py-32">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Reveal>
                  <p className="eyebrow">Philosophy</p>
                  <h2 className="mt-5 h-display text-3xl sm:text-4xl">
                    제작 철학
                  </h2>
                </Reveal>
              </div>
              <ol className="lg:col-span-8">
                {about.philosophy.map((p, i) => (
                  <Reveal key={p} delay={i * 0.05}>
                    <li className="flex items-baseline gap-5 border-t border-line py-6 last:border-b">
                      <span className="font-mono text-sm text-accent">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[18px] font-medium text-ink">{p}</span>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* FIT recap */}
        <section className="container-page section-x py-24 sm:py-32">
          <Reveal>
            <p className="eyebrow">The FIT System</p>
            <h2 className="mt-5 h-display text-3xl sm:text-4xl">네 가지를 맞춥니다</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {fits.map((f, i) => (
              <Reveal key={f.code} delay={(i % 2) * 0.06}>
                <div className="rounded-2xl border border-line bg-paper p-7">
                  <span className="font-mono text-[12px] font-semibold tracking-[0.14em] text-accent">
                    {f.label}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.05}>
            <div className="mt-12">
              <Link
                href="/#contact"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[15px] font-semibold text-paper transition-all duration-200 hover:bg-accent-ink active:scale-[0.98]"
              >
                내 사업에 맞는 구성 제안받기
                <ArrowRight
                  size={16}
                  weight="bold"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
