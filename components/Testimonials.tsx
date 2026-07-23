import { testimonialSamples } from "@/lib/data";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

export default function Testimonials() {
  return (
    <section className="container-page section-x py-24 sm:py-32">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeading eyebrow="Voices" title={["제작을 경험한", "고객의 이야기"]} />
        <Reveal>
          <span className="inline-flex items-center rounded-full border border-line bg-mist px-3 py-1.5 text-[12px] font-medium text-muted">
            후기 예시 · 실제 후기는 확보 후 교체됩니다
          </span>
        </Reveal>
      </div>

      <div className="mt-12 columns-1 gap-6 sm:columns-2 [&>*]:mb-6">
        {testimonialSamples.map((t, i) => (
          <Reveal key={t.heading} delay={(i % 2) * 0.06}>
            <figure className="break-inside-avoid rounded-2xl border border-line bg-paper p-7">
              <h3 className="text-[17px] font-bold leading-snug tracking-tight text-ink">
                “{t.heading}”
              </h3>
              <blockquote className="mt-3 text-[15px] leading-relaxed text-muted">
                {t.body}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-2 text-[13px]">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="font-medium text-ink">{t.author}</span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
