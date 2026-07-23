import { Check } from "@phosphor-icons/react/dist/ssr";
import { promises } from "@/lib/data";
import Reveal from "./Reveal";

export default function TrustPromise() {
  return (
    <section className="border-y border-line bg-mist">
      <div className="container-page section-x py-24 sm:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow">Our promise</p>
              <h2 className="mt-5 h-display leading-[1.4] text-3xl sm:text-4xl lg:text-[2.6rem]">
                합리적인 비용일수록
                <br />
                과정은 더 투명하게
              </h2>
              <p className="mt-6 max-w-[38ch] border-l-2 border-accent pl-4 text-[17px] font-medium text-ink">
                알 수 없는 비용 없이, 확인할 수 있는 과정으로 제작합니다.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              {promises.map((p, i) => (
                <Reveal key={p} delay={i * 0.05}>
                  <li className="flex items-start gap-3 bg-paper p-5">
                    <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-accent" />
                    <span className="text-[15px] leading-relaxed text-ink">{p}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed text-faint">
              * 6개월 보증의 시작일과 무상 보수 범위, 콘텐츠 변경·추가 기능 제외
              여부는 계약서와 함께 안내됩니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
