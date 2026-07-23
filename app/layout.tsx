import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand } from "@/lib/data";

export const metadata: Metadata = {
  metadataBase: new URL("https://myfitweb.kr"),
  title: {
    default: `${brand.name} — ${brand.slogan}`,
    template: `%s | ${brand.name}`,
  },
  description:
    "마이핏웹은 업종과 사업 목적에 맞춰 페이지 구성·디자인·콘텐츠·기능을 제작하는 커스텀 홈페이지 제작 브랜드입니다. 커스텀 홈페이지 99만원부터.",
  keywords: ["홈페이지 제작", "반응형 웹", "커스텀 홈페이지", "마이핏웹", "웹사이트 제작"],
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
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
