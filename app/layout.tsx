import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { brand } from "@/lib/data";
import { cabinetGrotesk, pretendard } from "@/lib/fonts";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://fitmyweb.com"),
  title: {
    default: `${brand.name} — ${brand.slogan}`,
    template: `%s | ${brand.name}`,
  },
  description:
    "핏마이웹은 업종과 사업 목적에 맞춰 페이지 구성·디자인·콘텐츠·기능을 제작하는 커스텀 홈페이지 제작 브랜드입니다. 커스텀 홈페이지 179만원부터.",
  keywords: [
    "홈페이지 제작",
    "반응형 웹",
    "커스텀 홈페이지",
    "핏마이웹",
    "Fitmyweb",
    "웹사이트 제작",
  ],
  openGraph: {
    title: `${brand.name} · ${brand.latin}`,
    description: brand.slogan,
    type: "website",
    locale: "ko_KR",
    siteName: brand.name,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${cabinetGrotesk.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
        {/* 전환 측정. 이벤트는 lib/track.ts 를 통해 채널별로 나눠 보낸다. */}
        <Analytics />
      </body>
    </html>
  );
}
