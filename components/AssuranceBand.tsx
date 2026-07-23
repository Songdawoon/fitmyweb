import { ShieldCheck, CurrencyKrw, ArrowUUpLeft } from "@phosphor-icons/react/dist/ssr";
import { assuranceMetrics, assuranceNote } from "@/lib/data";
import Reveal from "./Reveal";

const icons = {
  price: CurrencyKrw,
  warranty: ShieldCheck,
  refund: ArrowUUpLeft,
} as const;

export default function AssuranceBand() {
  return (
    <section className="border-y border-line bg-mist">
      <div className="container-page section-x py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {assuranceMetrics.map((m, i) => {
            const Icon = icons[m.icon];
            return (
              <Reveal key={m.label} delay={i * 0.08}>
                <div
                  className={`flex h-full flex-col items-center rounded-2xl px-6 py-8 text-center transition-colors duration-300 ${
                    m.emphasized
                      ? "border border-accent/40 bg-paper shadow-[0_24px_60px_-40px_rgba(240,85,64,0.5)]"
                      : "bg-transparent"
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full ${
                      m.emphasized ? "bg-accent text-paper" : "bg-paper text-accent"
                    }`}
                  >
                    <Icon size={22} weight={m.emphasized ? "fill" : "bold"} />
                  </span>
                  <div className="mt-5 flex items-baseline gap-0.5">
                    <span className="font-display text-4xl font-extrabold tracking-tightest text-ink sm:text-[2.75rem]">
                      {m.value}
                    </span>
                    {m.suffix && (
                      <span className="font-display text-2xl font-bold text-accent">
                        {m.suffix}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 max-w-[24ch] text-[14px] leading-relaxed text-muted">
                    {m.label}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.05}>
          <p className="mt-6 text-center text-[12px] text-faint">* {assuranceNote}</p>
        </Reveal>
      </div>
    </section>
  );
}
