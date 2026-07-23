import { ChartBar, RocketLaunch, ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import { stats } from "@/lib/data";
import Reveal from "./Reveal";

const icons = {
  brands: ChartBar,
  sales: RocketLaunch,
  conversion: ChartLineUp,
} as const;

export default function Stats() {
  return (
    <section className="border-y border-line bg-ink text-paper">
      <div className="container-page section-x py-16 sm:py-20">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3 md:gap-6">
          {stats.map((s, i) => {
            const Icon = icons[s.icon];

            if (s.emphasized) {
              // center highlight — white panel, like the reference layout
              return (
                <Reveal key={s.label} delay={i * 0.08}>
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-paper px-8 py-12 text-center">
                    <Icon size={40} weight="thin" className="text-ink/70" />
                    <p className="mt-4 text-lg font-semibold tracking-tight text-accent">
                      {s.label}
                    </p>
                  </div>
                </Reveal>
              );
            }

            return (
              <Reveal key={s.label} delay={i * 0.08}>
                <div className="flex flex-col items-center text-center">
                  <Icon size={34} weight="thin" className="text-paper/45" />
                  <div className="mt-4 flex items-baseline gap-0.5">
                    <span className="font-display text-5xl font-extrabold tracking-tightest text-paper sm:text-6xl">
                      {s.value}
                    </span>
                    {s.suffix && (
                      <span className="font-display text-3xl font-bold text-accent">
                        {s.suffix}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[15px] font-medium leading-relaxed text-paper/80">
                    {s.label}
                  </p>
                  {s.note && (
                    <p className="mt-1 text-[12px] text-paper/45">({s.note})</p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
