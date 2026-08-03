import localFont from "next/font/local";

/**
 * 폰트는 자체 호스팅한다.
 *
 * 예전에는 jsdelivr(Pretendard)와 fontshare(Cabinet Grotesk) 두 곳의 CSS 를
 * <head> 에서 <link rel="stylesheet"> 로 불러왔다. 스타일시트는 렌더를 막는
 * 자원이라, 첫 화면을 그리기 전에 외부 도메인 두 곳의 DNS·TLS·CSS·폰트까지
 * 왕복을 기다려야 했다. next/font/local 은 같은 출처에서 preload 로 내려주고
 * fallback 지표까지 맞춰 레이아웃 이동도 줄인다.
 */

export const pretendard = localFont({
  src: [
    {
      path: "../public/fonts/PretendardVariable.woff2",
      weight: "45 920",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  // 본문 폰트가 늦어도 글자는 먼저 보여야 한다.
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const cabinetGrotesk = localFont({
  src: [
    { path: "../public/fonts/CabinetGrotesk-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/CabinetGrotesk-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/CabinetGrotesk-Extrabold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["Pretendard Variable", "system-ui", "sans-serif"],
});
