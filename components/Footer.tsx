import Link from "next/link";
import { brand } from "@/lib/data";

const cols = [
  {
    title: "서비스",
    links: [
      { label: "4가지 FIT", href: "/#fit" },
      { label: "제작 플랜", href: "/#plans" },
      { label: "제작 과정", href: "/#process" },
      { label: "포트폴리오", href: "/#portfolio" },
    ],
  },
  {
    title: "브랜드",
    links: [
      { label: "마이핏웹 소개", href: "/about" },
      { label: "FAQ", href: "/#faq" },
      { label: "상담 문의", href: "/#contact" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-paper">
      <div className="container-page section-x py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-extrabold tracking-tightest text-ink">
                {brand.name}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                {brand.latin}
              </span>
            </div>
            <p className="mt-4 max-w-[38ch] text-[15px] leading-relaxed text-muted">
              {brand.oneLiner}
            </p>
            <Link
              href="/#contact"
              className="mt-6 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-accent"
            >
              구성 제안받기
            </Link>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-faint">
                {c.title}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[15px] text-muted hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-line pt-6 text-[13px] text-faint md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <p>
              {brand.name}은 {brand.operator}이 운영하는 커스텀 홈페이지 제작
              브랜드입니다.
            </p>
            <dl className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
              <div className="flex gap-2">
                <dt>사업자번호</dt>
                <dd className="text-muted">{brand.businessNumber}</dd>
              </div>
              <div className="flex gap-2">
                <dt>통신판매업</dt>
                <dd className="text-muted">{brand.mailOrderNumber}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
              Powered by {brand.poweredBy}
            </p>
            <p>
              © {year} {brand.latin}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
