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

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-[13px] text-faint md:flex-row md:items-center md:justify-between">
          <p>
            {brand.name}은 {brand.operator}이 운영하는 커스텀 홈페이지 제작
            브랜드입니다.
          </p>
          <p>
            © {year} {brand.latin}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
