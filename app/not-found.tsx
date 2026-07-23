import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-6">
      <div className="text-center">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-accent">404</p>
        <h1 className="mt-4 h-display text-4xl sm:text-5xl">페이지를 찾을 수 없습니다</h1>
        <p className="mt-4 text-[15px] text-muted">
          주소가 변경되었거나 삭제된 페이지일 수 있어요.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
