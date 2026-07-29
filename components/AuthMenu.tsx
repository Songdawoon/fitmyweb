"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { UserCircle } from "@phosphor-icons/react";

/**
 * 네비게이션의 로그인 영역.
 *
 * 소셜 앱 키가 없는 환경에서는 서버가 authEnabled=false 를 내려보내
 * 아예 렌더하지 않는다 — 눌러도 못 쓰는 버튼을 보여주지 않기 위함.
 */
export default function AuthMenu({
  authEnabled,
  variant = "desktop",
  onNavigate,
}: {
  authEnabled: boolean;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const { data: session, status } = useSession();

  if (!authEnabled) return null;

  // 세션 확인 전에는 자리만 잡아 레이아웃이 튀지 않게 한다.
  if (status === "loading") {
    return variant === "desktop" ? <span className="h-9 w-16" aria-hidden /> : null;
  }

  if (variant === "mobile") {
    return session ? (
      <>
        <Link
          href="/mypage"
          onClick={onNavigate}
          className="block border-b border-line py-4 font-display text-3xl font-bold tracking-tightest"
        >
          마이페이지
        </Link>
        <button
          onClick={() => {
            onNavigate?.();
            void signOut({ callbackUrl: "/" });
          }}
          className="block border-b border-line py-4 text-left font-display text-3xl font-bold tracking-tightest text-muted"
        >
          로그아웃
        </button>
      </>
    ) : (
      <Link
        href="/login"
        onClick={onNavigate}
        className="block border-b border-line py-4 font-display text-3xl font-bold tracking-tightest"
      >
        로그인
      </Link>
    );
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="hidden items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink sm:inline-flex"
      >
        <UserCircle size={17} weight="bold" />
        로그인
      </Link>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Link
        href="/mypage"
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink"
      >
        <UserCircle size={17} weight="bold" />
        <span className="max-w-[9ch] truncate">{session.user?.name ?? "마이페이지"}</span>
      </Link>
      <button
        onClick={() => void signOut({ callbackUrl: "/" })}
        className="text-sm text-faint transition-colors hover:text-ink"
      >
        로그아웃
      </button>
    </div>
  );
}
