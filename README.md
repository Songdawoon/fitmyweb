# 핏마이웹 — FIT MY WEB

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
  about/page.tsx  핏마이웹 소개 (미션·제작철학·FIT)
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
스타트핏·비즈핏은 고정가 결제, 브랜드핏(349만원부터)은 상담으로 견적 확정.

## 알림 메일 (Resend)

**DB 가 없으므로 상담 신청과 주문은 메일이 유일한 보존 수단입니다.**
`console.log` 는 저장이 아닙니다 — Vercel 런타임 로그는 보존 기간이 짧고 검색·알림이
안 되므로, 메일이 안 나가면 문의가 들어와도 아무도 알 수 없습니다.

```
RESEND_API_KEY=re_xxxx
CONTACT_FROM_EMAIL=cs@fitmyweb.com   # Resend 에서 도메인 인증 필요
CONTACT_TO_EMAIL=cs@fitmyweb.com         # 콤마로 여러 명 가능
```

1. [Resend](https://resend.com) 가입 → Domains 에서 `fitmyweb.com` 인증(DNS 레코드 추가)
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

## 소셜 로그인 · 회원 데이터

구글·카카오 로그인(NextAuth v4)과 Neon Postgres(Drizzle)로 회원·쿠폰·주문·상담을
저장합니다. 키가 없어도 사이트는 그대로 동작합니다 — 소셜 키가 없으면 로그인
버튼 자체를 숨기고, `DATABASE_URL` 이 없으면 로그인은 되되 내역 저장만 꺼집니다.

### 화면

| 경로 | 설명 |
|---|---|
| `/login` | 카카오·구글 버튼. 이미 로그인 상태면 `/mypage` 로 보냅니다. |
| `/mypage` | 보유 쿠폰, 결제 내역, 상담 내역. 비로그인은 `/login` 으로 리다이렉트. |
| `/admin` | 상담·결제 전체 목록. `ADMIN_EMAILS` 에 있는 계정만. |

### 준비 절차

1. **소셜 앱 등록** — 구글 클라우드 콘솔과 카카오 개발자 콘솔에서 각각 OAuth
   앱을 만들고 리디렉션 URI 를 등록합니다. 값과 주소는 `.env.local.example` 의
   "소셜 로그인" 항목에 그대로 적어 두었습니다.
2. **DB 준비** — Vercel → Storage → Neon 을 연결하면 `DATABASE_URL` 이 자동
   주입됩니다. 로컬은 Neon 콘솔의 connection string 을 `.env.local` 에 넣습니다.
3. **스키마 반영** — `npm run db:push` (또는 `drizzle/0000_*.sql` 을 직접 실행).
   스키마를 고친 뒤에는 `npm run db:generate` 로 마이그레이션을 새로 뽑습니다.

### 데이터 구조 (`lib/db/schema.ts`)

- `users` — 소셜 계정. `provider + provider_account_id` 가 유니크. 구글과 카카오를
  각각 쓰면 다른 사람으로 잡히므로 이메일에는 유니크를 걸지 않았습니다.
- `coupons` — 계정에 저장되는 쿠폰(`kind` 는 `event` · `signup`). `(user_id, kind)`
  유니크로 **종류별 1인 1장**을 보장합니다. 코드는 `MFW-XXXXXXXX` 형식이고,
  발급·사용 흐름은 아래 "쿠폰" 절 참고.
- `orders` — 포트원에서 검증된 결제. 브라우저 콜백과 웹훅이 같은 건을 두 번
  보고하므로 `imp_uid` 가 유니크입니다.
- `inquiries` — 상담 신청. 메일 발송 **전에** 먼저 저장하고 발송 성공 시
  `mailed` 를 올립니다. 메일이 실패해도 접수가 사라지지 않게 하기 위함입니다.

비로그인으로 남긴 결제·상담도 이메일이 같으면 마이페이지에 함께 보입니다.
먼저 결제하고 나중에 가입하는 흐름이 흔하기 때문입니다.

### 쿠폰

쿠폰은 두 종류이고 **한 결제에 함께 적용**됩니다. 정의는 `lib/data.ts` 의
`couponDefs` 한곳에 있습니다.

| 종류 | 금액 | 대상 | 내용 |
|---|---|---|---|
| `event` (8월 이벤트 쿠폰) | 750,000원 | 비회원 포함 누구나 | 서치어드바이저·서치콘솔 등록, 주소연동, 결제연동, 소셜로그인 |
| `signup` (회원가입 쿠폰) | 50,000원 | 로그인 계정만 | 제작비 즉시 할인 |

이벤트 쿠폰은 `EVENT_COUPON_ENDS_AT`(2026-08-31 23:59 KST)까지만 발급·적용되며,
기간이 끝나면 결제 화면에서 사라지고 서버 검증에서도 거절됩니다. 기간을 바꾸려면
그 상수만 고치면 됩니다.

**발급** — 홈 팝업의 "쿠폰 다운받기" 가 `POST /api/coupon` 을 부르고 두 종류를
한 번에 발급합니다. 로그인 여부는 서버가 판단해 비로그인이면 401 을 주고, 화면이
`/login?callbackUrl=/?coupon=1` 로 보냅니다. 로그인 후 돌아오면 팝업이 즉시 열리며
발급이 자동으로 이어집니다.

계정당 종류별 1장이라는 규칙은 앱 로직이 아니라 `(user_id, kind)` 유니크 인덱스가
보증합니다. `issueCoupon` 은 조회 없이 바로 insert 를 시도하고, 충돌이 나면 기존
쿠폰을 읽어 "이미 받으셨어요" 로 답합니다 — 버튼을 연타해도 두 장이 나올 수
없습니다. 로그인만으로는 발급되지 않습니다(그러면 버튼이 언제나 "이미 발급됨" 이
되기 때문).

**비회원** — 이벤트 쿠폰은 DB 행 없이 공개 코드 `EVENT_COUPON_CODE` 로 결제
화면에 붙습니다. 이벤트 기간 동안 누구에게나 같은 금액이 적용되는 할인이라 코드가
알려져도 문제가 없고, 할인액은 서버가 `lib/data.ts` 에서 직접 읽습니다. 회원이
계정에 저장해 둔 이벤트 쿠폰이 있으면 그쪽 코드를 우선 써서 사용 이력이
마이페이지에 남습니다.

**사용** — 결제 화면은 적용 가능한 쿠폰을 모두 기본 적용하고(각각 끌 수 있음),
쿠폰마다 무엇이 제공되는지를 카드 안에 펼쳐 보여줍니다. 코드는
`custom_data.couponCodes` 배열로 실려 가고, 서버는 `resolveCoupons` 로 코드마다
유효성과 금액을 다시 확인합니다 — 이벤트 쿠폰은 데이터 파일의 정가에서, 계정
쿠폰은 DB 행에서 읽습니다. 같은 종류가 두 번 오면 한 번만 인정하고, 합산 할인이
플랜 금액을 넘지 않도록 자른 뒤 `plan.price - discount` 와 실제 결제액을
대조합니다(`lib/portone.ts`). 그래서 클라이언트가 금액이나 할인액을 조작해
보내도 통과하지 못합니다. 결제가 확정되면 계정 쿠폰에 `used_at` 이 찍히고, 완료
라우트와 웹훅이 같은 건을 두 번 보고해도 미사용일 때만 갱신하므로 멱등합니다.

### 상담 폼 닫기

`lib/data.ts` 의 `contactFormEnabled` 가 `false` 면 홈 하단 상담 폼은 화면에서
사라지고 전화·이메일·카카오톡 카드만 노출됩니다. 폼 마크업은
`components/ContactForm.tsx` 에 그대로 남아 있으므로 이 값을 `true` 로 되돌리면
그대로 살아납니다. 서버(`POST /api/contact`)도 같은 플래그를 보고 503 으로
거절하므로, 캐시된 예전 화면에서 들어오는 접수도 남지 않습니다.

전화번호는 `brand.phone` 이 자리표시자(`010-0000-0000`)인 동안 카드에서 자동으로
빠집니다(`hasRealPhone`). 실제 번호를 넣으면 바로 노출됩니다.

### 세션

어댑터 없이 JWT 세션을 쓰고, 로그인할 때마다 `users` 를 upsert 합니다
(`lib/auth.ts` 의 `jwt` 콜백 → `lib/account.ts` 의 `ensureUser`). 세션 테이블이
필요 없고 도메인 테이블과 같은 방식으로 다룰 수 있어서입니다. 우리 DB 의
`users.id` 는 `session.user.id` 로 내려갑니다.
