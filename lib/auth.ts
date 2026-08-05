import "server-only";

import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";

import { ensureUser } from "@/lib/account";

/** 관리자 페이지 접근을 허용할 이메일. 콤마로 여러 개. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/** 소셜 앱 키가 하나라도 있으면 로그인 UI 를 노출한다. */
export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function kakaoEnabled(): boolean {
  return Boolean(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET);
}

export function authEnabled(): boolean {
  return googleEnabled() || kakaoEnabled();
}

const providers: NextAuthOptions["providers"] = [];

if (googleEnabled()) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  );
}

if (kakaoEnabled()) {
  providers.push(
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  );
}

/**
 * 세션 전략은 JWT.
 *
 * 어댑터(sessions/verification_tokens 테이블)를 쓰지 않고, 로그인할 때마다
 * users 를 직접 upsert 한다. 필요한 것은 "이 사람이 누구인가" 뿐이라
 * 테이블 4개짜리 어댑터 스키마를 들일 이유가 없고, 우리 도메인 테이블
 * (coupons/orders/inquiries)과 같은 방식으로 다룰 수 있다.
 */
export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    /**
     * 최초 로그인 시에만 account 가 들어온다. 이때 users 를 upsert 하고
     * 회원가입 쿠폰을 발급한 뒤, 우리 DB 의 id 를 토큰에 심는다.
     */
    async jwt({ token, account, profile }) {
      if (!account) return token;

      const user = await ensureUser({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        email: token.email ?? null,
        name: token.name ?? (profile as { name?: string } | undefined)?.name ?? null,
        image: typeof token.picture === "string" ? token.picture : null,
      });

      // DB 가 없으면 uid 없이 로그인만 유지된다(마이페이지는 안내 문구를 띄운다).
      token.uid = user?.id ?? null;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string | null) ?? null;
        session.user.isAdmin = isAdminEmail(session.user.email);
      }
      return session;
    },
  },
};

/** 서버 컴포넌트·라우트 핸들러에서 세션을 읽는 짧은 이름. */
export function auth() {
  return getServerSession(authOptions);
}

/**
 * 관리자 전용 API 라우트의 가드.
 *
 * 로그인하지 않았으면 401, 로그인했지만 관리자가 아니면 **404** 를 준다.
 * /admin 이 허용 목록 밖 계정에게 존재 자체를 알리지 않는 것과 같은 방침이라,
 * 403 으로 "여기 뭔가 있다" 를 알려 주지 않는다.
 *
 * NextResponse 를 만들지 않고 상태 코드만 돌려주는 이유는, 이 파일이
 * 서버 컴포넌트에서도 import 되기 때문이다 — next/server 를 끌고 들어오지 않는다.
 */
export async function requireAdmin(): Promise<
  { ok: true; email: string | null } | { ok: false; status: 401 | 404 }
> {
  const session = await auth();
  if (!session) return { ok: false, status: 401 };
  if (!session.user.isAdmin) return { ok: false, status: 404 };
  return { ok: true, email: session.user.email ?? null };
}
