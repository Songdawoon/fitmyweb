# 마이핏웹 — MY FIT WEB

> 내 사업에 딱 맞는 홈페이지, 합리적인 비용으로

업종과 사업 목적에 맞춰 페이지 구성·디자인·콘텐츠·기능을 제작하는 커스텀 홈페이지
제작 브랜드 사이트. `코드브릭` 운영. PortOne V2 결제 연동 포함.

## 스택

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — 라이트/전문 에이전시 톤 (네이비 잉크 + 코랄 액센트)
- **Framer Motion** — 절제된 스크롤 리빌·아코디언·오버레이
- **@portone/browser-sdk** — 카드·간편결제
- 폰트: Pretendard(한글) + Cabinet Grotesk(라틴 라벨)

## 실행

```bash
npm install
cp .env.local.example .env.local   # PortOne 키 (아래 참고)
npm run dev                        # http://localhost:3000
```

## 페이지 / 구조

```
app/
  page.tsx        메인 (Hero → 문제공감 → 4가지 FIT → 비용의 이유 → 제작과정
                        → 포트폴리오 → 플랜 → 추가서비스 → 신뢰약속 → 후기 → FAQ → 상담CTA)
  about/page.tsx  마이핏웹 소개 (미션·제작철학·FIT)
  checkout/       플랜 결제 (?plan=startfit|bizfit) — PortOne 결제
  api/
    contact/        상담 신청 접수 (현재 로그만; 이메일/DB 연동 지점 표시)
    payment/complete  결제 서버 검증 (금액 대조)
components/        섹션·폼 컴포넌트
lib/data.ts        모든 콘텐츠 (여기만 고치면 문구·플랜·FAQ 교체)
```

## 기획서 준수 사항 (중요)

기획서의 원칙에 따라 다음을 지켰습니다.

- **허위 데이터 미노출** — 검증 안 된 실적/수치/누적판매량은 넣지 않음.
- **포트폴리오** — 실제 사례 준비 전이라 "준비 중" 자리표시 카드로 구성.
- **고객 후기 5건** — "후기 예시" 배지를 달아 샘플임을 명시 (실제 후기 확보 후 교체).
- **전액 환불 문구** — 정책 확정 전이라 노출하지 않음. (6개월 무상 보수만 표기)
- **추가 서비스** — 원본의 `무료서비스`는 금액이 있으므로 `추가 서비스(유료 옵션)`로 표기.

### 오픈 전 확정 필요 (lib/data.ts / 계약서 반영)

- 전액 환불 정책 운영 여부·조건
- 6개월 보증 시작일·포함 범위
- 플랜별 페이지 수·수정 횟수 확정
- 실제 포트폴리오 10건, 실제 후기 확보 후 교체
- 연락처(`brand.phone`), 이메일(`brand.email`) 실제 값 입력

## PortOne 결제 연동

현재는 **테스트/플레이스홀더 모드**입니다. 키가 없어도 UI가 동작하며, 결제 시
"테스트 모드" 안내가 표시됩니다.

1. [PortOne 콘솔](https://admin.portone.io)에서 상점 생성 → PG 채널 연결
2. `.env.local`:
   ```
   NEXT_PUBLIC_PORTONE_STORE_ID=store-xxxx
   NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-xxxx
   PORTONE_API_SECRET=xxxx   # 서버 검증용, 노출 금지
   ```
3. 재시작하면 실제 결제창 + 서버 금액 검증이 활성화됩니다.

**결제 흐름**: 플랜 선택 → `/checkout` → `PortOne.requestPayment()` →
`POST /api/payment/complete`(서버가 paymentId로 재조회해 `plan.price` 대조) → 성공.
스타트핏·비즈핏은 고정가 결제, 브랜드핏(249만원부터)은 상담으로 견적 확정.

> 운영 시 `app/api/payment/complete/route.ts`의 `TODO`에서 주문을 DB에 저장하세요.
> 상담 폼은 `app/api/contact/route.ts`에서 이메일/DB 연동을 붙이면 됩니다.
