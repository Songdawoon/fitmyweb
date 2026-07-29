"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/** 구글 G 로고 — 외부 이미지 없이 인라인 SVG 로 넣어 CLS 와 추적을 피한다. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

/** 카카오 말풍선 심볼. 브랜드 가이드상 버튼은 노란 배경 + 검정 심볼. */
function KakaoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#000000"
        d="M12 3C6.9 3 2.8 6.3 2.8 10.3c0 2.6 1.7 4.8 4.3 6.1l-1.1 4c-.1.3.3.6.6.4l4.7-3.1c.2 0 .5.1.7.1 5.1 0 9.2-3.3 9.2-7.5S17.1 3 12 3z"
      />
    </svg>
  );
}

export default function LoginButtons({
  callbackUrl,
  google,
  kakao,
}: {
  callbackUrl: string;
  google: boolean;
  kakao: boolean;
}) {
  const [pending, setPending] = useState<string | null>(null);

  const start = (provider: string) => {
    setPending(provider);
    void signIn(provider, { callbackUrl });
  };

  return (
    <div className="mt-8 flex flex-col gap-3">
      {kakao && (
        <button
          onClick={() => start("kakao")}
          disabled={pending !== null}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-kakao px-5 py-4 text-[15px] font-bold text-kakao-ink transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <KakaoMark />
          {pending === "kakao" ? "카카오로 이동 중…" : "카카오로 시작하기"}
        </button>
      )}

      {google && (
        <button
          onClick={() => start("google")}
          disabled={pending !== null}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-paper px-5 py-4 text-[15px] font-bold text-ink transition-colors hover:border-ink disabled:opacity-60"
        >
          <GoogleMark />
          {pending === "google" ? "구글로 이동 중…" : "구글로 시작하기"}
        </button>
      )}
    </div>
  );
}
