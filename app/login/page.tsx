import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import LoginButtons from "@/components/LoginButtons";
import { auth, authEnabled, googleEnabled, kakaoEnabled } from "@/lib/auth";
import { couponDefs, formatWon } from "@/lib/data";

export const metadata: Metadata = {
  title: "로그인",
  description: "구글 또는 카카오 계정으로 마이핏웹에 로그인하고 상담·결제 내역을 확인하세요.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const session = await auth();
  if (session) redirect(searchParams.callbackUrl ?? "/mypage");

  return (
    <>
      <Nav authEnabled={authEnabled()} />
      <main className="container-page section-x flex min-h-[100svh] items-center justify-center py-32">
        <div className="w-full max-w-[420px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            Login
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tightest text-ink">
            간편하게 시작하세요
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            별도 회원가입 절차 없이 구글·카카오 계정으로 바로 로그인합니다.
            로그인하면 상담 진행 상황과 결제 내역을 한곳에서 확인할 수 있습니다.
          </p>

          <p className="mt-5 rounded-xl bg-ink px-4 py-3 text-[13px] font-semibold leading-relaxed text-paper">
            로그인 후 {couponDefs.signup.name} {formatWon(couponDefs.signup.amount)}을
            받을 수 있습니다. 계정당 1장이며, 결제 시 이벤트 쿠폰과 함께 적용됩니다.
          </p>

          {searchParams.error && (
            <p className="mt-5 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3 text-[13px] text-accent">
              로그인에 실패했습니다. 다시 시도해 주세요.
            </p>
          )}

          {authEnabled() ? (
            <LoginButtons
              callbackUrl={searchParams.callbackUrl ?? "/mypage"}
              google={googleEnabled()}
              kakao={kakaoEnabled()}
            />
          ) : (
            <p className="mt-8 rounded-xl border border-line px-4 py-5 text-[14px] leading-relaxed text-muted">
              소셜 로그인 준비 중입니다. 문의는{" "}
              <Link href="/#contact" className="font-semibold text-ink underline">
                상담 신청
              </Link>
              으로 남겨 주세요.
            </p>
          )}

          <p className="mt-8 text-[12px] leading-relaxed text-faint">
            로그인 시 서비스 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.
            소셜 계정에서 받는 정보는 이름·이메일·프로필 이미지뿐입니다.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
