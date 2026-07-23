import { problem } from "@/lib/data";
import Reveal from "./Reveal";

export default function Problem() {
  return (
    <section className="container-page section-x py-24 sm:py-32">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow">Why it matters</p>
            <h2 className="mt-5 h-display text-3xl/[1.4] sm:text-4xl/[1.4] lg:text-[2.6rem]/[1.4]">
              {problem.title.map((t) => (
                <span key={t} className="block">
                  {t}
                </span>
              ))}
            </h2>
            <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-muted">
              {problem.body}
            </p>
            <p className="mt-6 border-l-2 border-accent pl-4 text-[16px] font-medium text-ink">
              {problem.closing}
            </p>
          </Reveal>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <ul className="divide-y divide-line border-y border-line">
            {problem.questions.map((q, i) => (
              <Reveal key={q} delay={i * 0.06}>
                <li className="flex items-baseline gap-4 py-6">
                  <span className="font-mono text-sm text-accent">
                    Q{i + 1}
                  </span>
                  <span className="text-[18px] font-medium leading-snug text-ink">
                    {q}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
