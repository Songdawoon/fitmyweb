import Link from "next/link";
import { ArrowRight, ImageSquare } from "@phosphor-icons/react/dist/ssr";
import { portfolioSamples } from "@/lib/data";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

export default function Portfolio() {
  return (
    <section id="portfolio" className="container-page section-x py-24 sm:py-32">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Portfolio"
          title={["사업의 강점을 찾아", "웹사이트로 완성합니다"]}
        />
        <Reveal>
          <p className="max-w-[38ch] text-[15px] leading-relaxed text-muted md:text-right">
            마이핏웹의 포트폴리오는 디자인 결과만 나열하지 않고 고객의 문제,
            제안한 방향과 실제 해결 내용을 함께 보여줍니다.
          </p>
        </Reveal>
      </div>

      {/* 실제 사례 준비 전 — 자리표시 카드. 허구 회사명·수치는 노출하지 않음 */}
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {portfolioSamples.map((p, i) => (
          <Reveal key={p.title} delay={(i % 2) * 0.08}>
            <article className="group overflow-hidden rounded-2xl border border-line bg-paper">
              <div className="relative flex aspect-[16/10] items-center justify-center border-b border-line bg-mist">
                <div className="flex flex-col items-center gap-2 text-faint">
                  <ImageSquare size={30} weight="thin" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
                    준비 중
                  </span>
                </div>
                <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1 text-[12px] font-medium text-muted">
                  {p.industry}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-[17px] font-bold leading-snug tracking-tight text-ink">
                  {p.title}
                </h3>
                <p className="mt-2 text-[13px] text-muted">핵심 · {p.focus}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.05}>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-line bg-mist px-6 py-5 sm:flex-row sm:items-center">
          <p className="text-[14px] text-muted">
            실제 제작 사례는 프로젝트 완료 순서대로 공개될 예정입니다. 준비되는
            대로 프로젝트별 문제·제안·결과와 PC·모바일 화면을 함께 담습니다.
          </p>
          <Link
            href="/#contact"
            className="group inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-ink hover:text-accent"
          >
            내 프로젝트 상담하기
            <ArrowRight
              size={15}
              weight="bold"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
