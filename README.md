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
    contact/        상담 신청 접수 → 담당자 메일 발송
    payment/complete  결제 서버 검증 (금액 대조) → 주문 확인 메일
components/        섹션·폼 컴포넌트
lib/data.ts        모든 콘텐츠 (여기만 고치면 문구·플랜·FAQ 교체)
public/portfolio/  포트폴리오 썸네일 (16:10 JPEG)
```

## 포트폴리오 추가

포트폴리오 섹션은 업종 필터(`전체·쇼핑몰·브랜드·병원·기타`)와 "더 보기"(초기 6개,
클릭 시 4개씩)로 동작합니다. 사례 하나를 추가하는 절차는 다음과 같습니다.

**1. 썸네일 캡처** — 헤드리스 Chrome 으로 1440×900(16:10)을 찍고 `sips` 로 줄입니다.

```bash
SITE="https://example.vercel.app"
SLUG="example"

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --virtual-time-budget=6000 --window-size=1440,900 \
  --screenshot=/tmp/$SLUG.png "$SITE"

sips -Z 1200 --setProperty format jpeg --setProperty formatOptions 82 \
  /tmp/$SLUG.png --out public/portfolio/$SLUG.jpg
```

`--virtual-time-budget` 은 폰트·이미지가 다 뜬 뒤 찍히도록 기다리는 시간입니다.
줄이면 로딩 중 화면이 찍힙니다. 결과는 카드 비율과 같은 **16:10**이어야 잘리지
않습니다.

**2. `lib/data.ts` 의 `portfolioSamples` 맨 앞에 추가** — 최신 사례가 위로 옵니다.

```ts
{
  title: "사례를 한 줄로 설명하는 제목",
  industry: "법률사무소",          // 카드 좌상단 배지
  focus: "상담 예약 동선",          // "핵심 · " 뒤에 붙음
  category: "brand",              // shop | brand | clinic | etc
  url: "https://example.vercel.app",
  image: "/portfolio/example.jpg",
}
```

필터 개수, 더 보기 개수, 카드 링크 처리는 전부 자동 반영됩니다. `url` 이 있으면
카드가 새 탭 링크가 되고, `image` 가 없으면 "준비 중" 자리표시로 남습니다.

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

## 알림 메일 (Resend)

**DB 가 없으므로 상담 신청과 주문은 메일이 유일한 보존 수단입니다.**
`console.log` 는 저장이 아닙니다 — Vercel 런타임 로그는 보존 기간이 짧고 검색·알림이
안 되므로, 메일이 안 나가면 문의가 들어와도 아무도 알 수 없습니다.

```
RESEND_API_KEY=re_xxxx
CONTACT_FROM_EMAIL=marketing@myfitweb.kr   # Resend 에서 도메인 인증 필요
CONTACT_TO_EMAIL=hello@myfitweb.kr         # 콤마로 여러 명 가능
```

1. [Resend](https://resend.com) 가입 → Domains 에서 `myfitweb.kr` 인증(DNS 레코드 추가)
2. API Keys 에서 키 발급 → 위 세 값을 `.env.local` 과 Vercel 환경변수에 등록
3. 도메인 인증 전 테스트는 `CONTACT_FROM_EMAIL=onboarding@resend.dev` 로 가능

발송 로직은 `lib/email.ts` 한 곳에 모여 있습니다. 고객 입력이 HTML 로 들어가므로
템플릿에서 반드시 이스케이프합니다(`esc()`).

**설정 상태별 동작**

| 상황 | 상담 폼 | 결제 |
|---|---|---|
| 키 미설정 | 200 + 전체 내용을 `console.warn` (개발용) | 결제는 정상, 메일만 생략 |
| 발송 실패 | **502** + "카카오톡으로 문의" 안내, 원문 로그 | 결제 응답 유지, 에러 로그로 주문 정보 보존 |
| 발송 성공 | 200, 담당자 메일 수신 | 담당자 메일 수신 |

상담 폼에서 발송 실패 시 성공 화면을 띄우지 않는 것은 의도한 동작입니다 — 고객에게
접수됐다고 알린 뒤 아무 데도 남지 않는 상황이 가장 나쁩니다.

메일은 답장하면 고객에게 바로 가도록 `reply_to` 에 고객 이메일을 넣습니다.

> 정상 결제 한 건에 완료 라우트와 웹훅이 모두 `recordOrder()` 를 호출해 주문 메일이
> 두 번 갈 수 있습니다. 중복이 누락보다 낫다고 보고 그대로 두었습니다. DB 를 붙일 때
> `imp_uid` 기준 멱등 처리를 넣으면 해소됩니다.
