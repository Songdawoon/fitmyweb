import Link from "next/link";
import Nav from "./Nav";
import Footer from "./Footer";
import { authEnabled } from "@/lib/auth";

export type LegalSection = {
  heading: string;
  /** 문단. 배열 원소 하나가 <p> 하나다. */
  paragraphs?: string[];
  /** 순서 없는 목록. */
  bullets?: string[];
  /** 표. head 는 열 제목, rows 는 행. 수집 항목·보관 기간처럼 대응 관계가
   *  중요한 내용은 문단보다 표가 훨씬 빨리 읽힌다. */
  table?: { head: string[]; rows: string[][] };
};

/**
 * 약관·방침 문서의 공통 껍데기.
 *
 * 세 문서(개인정보·이용약관·환불)가 같은 구조라 레이아웃을 한곳에 둔다.
 * 본문은 데이터로만 넘겨 문구 수정이 마크업 수정이 되지 않게 한다.
 */
export default function LegalPage({
  title,
  updatedAt,
  intro,
  sections,
}: {
  title: string;
  /** 시행일. 개정하면 반드시 함께 올린다. */
  updatedAt: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="container-page section-x pb-24 pt-36 sm:pt-40">
        <div className="max-w-[52rem]">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-5 h-display text-3xl/[1.3] sm:text-4xl/[1.3]">{title}</h1>
          <p className="mt-4 text-[14px] text-faint">시행일 · {updatedAt}</p>
          {intro && (
            <p className="mt-7 text-[16px] leading-relaxed text-muted">{intro}</p>
          )}

          <div className="mt-14 flex flex-col gap-12">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-[19px] font-bold tracking-tight text-ink">
                  {s.heading}
                </h2>

                {s.paragraphs?.map((p) => (
                  <p key={p} className="mt-3.5 text-[15px] leading-relaxed text-muted">
                    {p}
                  </p>
                ))}

                {s.bullets && (
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-muted">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {s.table && (
                  // 표는 좁은 화면에서 스스로 가로 스크롤한다. 페이지 전체가
                  // 가로로 밀리면 모바일에서 읽기가 무너진다.
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[34rem] border-collapse text-left text-[14px]">
                      <thead>
                        <tr className="border-b border-line">
                          {s.table.head.map((h) => (
                            <th key={h} className="py-3 pr-5 font-semibold text-ink">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.table.rows.map((row) => (
                          <tr key={row.join("|")} className="border-b border-line/70">
                            {row.map((cell) => (
                              <td key={cell} className="py-3 pr-5 align-top leading-relaxed text-muted">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>

          <div className="mt-16 border-t border-line pt-8">
            <Link
              href="/#contact"
              className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-accent"
            >
              상담 문의하기
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
