import { Check } from "@phosphor-icons/react/dist/ssr";
import { fits } from "@/lib/data";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

export default function FitSection() {
  return (
    <section id="fit" className="border-y border-line bg-mist">
      <div className="container-page section-x py-24 sm:py-32">
        <SectionHeading
          eyebrow="The FIT System"
          title={["마이핏웹은", "네 가지를 맞춥니다"]}
          desc="업종과 사업 목적에 따라 기획·콘텐츠·디자인·기능을 하나씩 맞춰 커스텀 홈페이지를 완성합니다."
        />

        {/* 2-column zig-zag, not a flat 3-card row */}
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
          {fits.map((fit, i) => (
            <Reveal key={fit.code} delay={(i % 2) * 0.08}>
              <article
                className={`flex h-full flex-col rounded-2xl border border-line bg-paper p-7 transition-colors duration-300 hover:border-ink/20 sm:p-8 ${
                  i % 2 === 1 ? "md:mt-8" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] font-semibold tracking-[0.14em] text-accent">
                    {fit.label}
                  </span>
                  <span className="font-mono text-sm text-faint">{fit.code}</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">
                  {fit.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {fit.desc}
                </p>
                <div className="mt-6 border-t border-line pt-5">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-faint">
                    제공 결과 예시
                  </p>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {fit.results.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-2 text-[14px] text-ink"
                      >
                        <Check
                          size={15}
                          weight="bold"
                          className="mt-0.5 shrink-0 text-accent"
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
