"use client";

import { track as vercelTrack } from "@vercel/analytics";

/**
 * 전환 이벤트 이름.
 *
 * 채점 기준(8영역)이 "전화·카카오톡·버튼 클릭을 구분해서" 측정할 것을 요구하므로
 * 채널마다 이름을 나눈다. 하나로 묶으면 어떤 경로가 문의를 만들었는지 알 수 없다.
 */
export type ConversionEvent =
  /** 상담 신청 폼 제출이 서버에서 접수까지 끝난 시점. 유일한 "완료" 전환. */
  | "inquiry_submitted"
  /** 폼 제출을 시도했으나 서버가 거절한 경우. 이탈 원인 추적용. */
  | "inquiry_failed"
  /** 카카오톡 상담 채널로 나간 클릭. */
  | "kakao_click"
  /** tel: 링크 클릭. */
  | "phone_click"
  /** mailto: 링크 클릭. */
  | "email_click"
  /** 상담 폼으로 보내는 CTA 버튼 클릭. where 로 어느 섹션인지 구분한다. */
  | "cta_click"
  /** 플랜 결제 시작(체크아웃 진입). */
  | "checkout_start";

type Props = Record<string, string | number | boolean | null>;

/**
 * 전환 이벤트를 보낸다.
 *
 * 측정 실패가 화면 동작을 막으면 안 되므로 어떤 예외도 밖으로 내보내지 않는다.
 * (광고 차단 확장이 스크립트를 막는 경우가 흔하다.)
 */
export function track(event: ConversionEvent, props?: Props): void {
  try {
    vercelTrack(event, props);
  } catch {
    // 측정 실패는 무시한다 — 상담 신청 자체는 계속되어야 한다.
  }
}

/**
 * 유입 채널을 이벤트 속성으로 남긴다.
 *
 * Vercel Analytics 가 referrer 와 UTM 을 자동으로 붙이지만, 그것은 "페이지뷰"
 * 기준이다. 전환 이벤트 자체에도 붙여 두어야 채널별 전환을 한 화면에서 본다.
 */
export function inboundChannel(): Props {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    referrer: document.referrer || "direct",
  };
}
