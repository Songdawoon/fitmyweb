import { steps } from "@/lib/data";
import Reveal from "./Reveal";

const phaseOrder = ["기획", "제작", "오픈"];

export default function Process() {
  return (
    <section id="process" className="border-y border-line bg-ink text-paper">
      <div className="container-page section-x py-24 sm:py-32">
        <Reveal>
          <p className="eyebrow">Process</p>
          <h2 className="mt-5 h-display text-3xl text-paper sm:text-4xl lg:text-[2.75rem]">
            체계적인 과정이
            <br />
            좋은 결과를 만듭니다
          </h2>
        </Reveal>

        <div className="mt-14 space-y-10">
          {phaseOrder.map((phase) => {
            const items = steps.filter((s) => s.phase === phase);
            return (
              <div key={phase} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <Reveal>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/70">
                      {phase} 단계
                    </span>
                  </Reveal>
                </div>
                <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-3">
                  {items.map((s, i) => (
                    <Reveal key={s.no} delay={i * 0.05}>
                      <div className="h-full bg-ink p-6 transition-colors duration-300 hover:bg-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-accent">
                            STEP {s.no}
                          </span>
                        </div>
                        <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-paper">
                          {s.title}
                        </h3>
                        <p className="mt-2 text-[14px] leading-relaxed text-paper/60">
                          {s.desc}
                        </p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
