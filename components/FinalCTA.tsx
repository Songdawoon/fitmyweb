import ContactForm from "./ContactForm";
import Reveal from "./Reveal";

export default function FinalCTA() {
  return (
    <section id="contact" className="border-t border-line bg-mist">
      <div className="container-page section-x py-24 sm:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow">Start here</p>
              <h2 className="mt-5 h-display text-3xl sm:text-4xl lg:text-[2.75rem]">
                우리 사업에 맞는 홈페이지,
                <br />
                어디서부터 시작할까요?
              </h2>
              <p className="mt-6 max-w-[44ch] text-[16px] leading-relaxed text-muted">
                원하는 디자인과 페이지 구성이 아직 정확하게 정해지지 않아도
                괜찮습니다. 사업과 서비스, 예상 예산을 알려주시면 필요한 제작
                범위와 적합한 방향을 안내해드립니다.
              </p>
              <ul className="mt-8 flex flex-col gap-3 border-t border-line pt-8 text-[15px]">
                {[
                  "제작 전 작업 범위와 비용을 먼저 안내",
                  "계약 범위 밖의 비용을 임의로 추가하지 않음",
                  "제작 완료 후 6개월 기능 오류 무상 보수",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-ink">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={0.1}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
