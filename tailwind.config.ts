import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy acts as the near-black ink / dark surface.
        ink: "#101733",
        paper: "#ffffff",
        mist: "#f4f6fa",
        line: "#e5e8f0",
        muted: "#5c6472",
        faint: "#8a92a3",
        // Single vivid brand accent.
        accent: "#f05540",
        "accent-ink": "#c8402d",
        // KakaoTalk brand pair — 채널 버튼은 가이드라인상 옐로우 배경 + 검정 심볼
        // 조합을 유지해야 해서 팔레트 밖 색이지만 별도 토큰으로 둔다.
        kakao: "#FEE500",
        "kakao-ink": "#191600",
      },
      fontFamily: {
        // 실제 폰트 이름 대신 next/font 가 만들어 주는 CSS 변수를 쓴다.
        // 변수 안에 fallback 지표까지 들어 있어 로딩 중 레이아웃 이동이 줄어든다.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.035em",
      },
      maxWidth: {
        page: "1240px",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-h)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
