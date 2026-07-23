import { formatKRW, addOns, addOnNotes } from "@/lib/data";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

export default function AddOns() {
  return (
    <section className="container-page section-x py-24 sm:py-32">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading
            eyebrow="Add-ons"
            title={["필요한 기능만", "추가로 선택"]}
            desc="플랜에 포함되지 않은 연동·등록 작업은 필요할 때만 옵션으로 진행합니다."
          />
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <Reveal>
            <ul className="border-t border-line">
              {addOns.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-4 border-b border-line py-4"
                >
                  <span className="text-[16px] text-ink">{item.name}</span>
                  <span className="font-mono text-[15px] font-semibold text-ink">
                    {formatKRW(item.price)}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-6 rounded-2xl bg-mist p-6">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-faint">
                추가 검토 가능한 서비스
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {addOnNotes.map((n) => (
                  <span
                    key={n}
                    className="rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] text-muted"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
