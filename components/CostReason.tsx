import { Plus, Minus } from "@phosphor-icons/react/dist/ssr";
import { cost } from "@/lib/data";
import Reveal from "./Reveal";

export default function CostReason() {
  return (
    <section className="container-page section-x py-24 sm:py-32">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-28">
          <Reveal>
            <p className="eyebrow">Reasonable, not cheap</p>
            <h2 className="mt-5 h-display text-3xl sm:text-4xl">
              {cost.title.map((t) => (
                <span key={t} className="block">
                  {t}
                </span>
              ))}
            </h2>
            <p className="mt-6 max-w-[42ch] text-[16px] leading-relaxed text-muted">
              {cost.body}
            </p>
          </Reveal>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
          <Reveal>
            <div className="rounded-2xl border border-line bg-paper p-7">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/12 text-accent">
                  <Plus size={14} weight="bold" />
                </span>
                집중하는 것
              </div>
              <ul className="flex flex-col gap-3">
                {cost.focus.map((f) => (
                  <li key={f} className="text-[15px] text-ink">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-line bg-mist p-7">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-muted">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-ink/8 text-muted">
                  <Minus size={14} weight="bold" />
                </span>
                줄이는 것
              </div>
              <ul className="flex flex-col gap-3">
                {cost.reduce.map((r) => (
                  <li key={r} className="text-[15px] text-muted line-through decoration-line">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.05}>
        <p className="mt-14 max-w-4xl text-balance text-2xl font-bold leading-snug tracking-tight text-ink sm:text-[1.7rem]">
          {cost.emphasis[0]}
          <br />
          <span className="text-accent">{cost.emphasis[1]}</span>
        </p>
      </Reveal>
    </section>
  );
}
