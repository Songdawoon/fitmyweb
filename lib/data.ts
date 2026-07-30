export const brand = {
  name: "핏마이웹",
  latin: "FIT MY WEB",
  operator: "코드브릭",
  slogan: "내 사업에 딱 맞는 홈페이지",
  mainCopy: ["우리 사업에 꼭 맞는 홈페이지,", "합리적인 비용으로"],
  subMessage: "제작 과정은 효율적으로, 결과물은 비즈니스에 맞게.",
  oneLiner: "필요한 것은 제대로 맞추고, 불필요한 비용은 줄였습니다.",
  email: "cs@fitmyweb.com",
  phone: "010-2124-8257",
  hours: "평일 10:00 – 19:00",
  // 푸터 하단 사업자 정보. 통신판매업 번호는 신고 완료 후 실제 값으로 교체한다.
  businessNumber: "510-11-92376",
  mailOrderNumber: "111-1111",
  poweredBy: "CODESTORY",
};

export const trustKeywords = [
  "맞춤 기획",
  "반응형 제작",
  "투명한 견적",
  "직접 관리",
  "제작 후 안내",
];

export const heroAssurances = [
  "커스텀 홈페이지 179만원부터",
  "제작 범위 내 기능 오류 6개월 무상 보수",
];

// 히어로 아래 신뢰 배너 — 확정된 사실만 사용 (허위 수치 미노출).
export const assuranceMetrics: {
  value: string;
  label: string;
  icon: "warranty" | "refund";
}[] = [
    { value: "6개월", label: "워런티 · 제작 범위 내 기능 오류 무상 보수", icon: "warranty" },
    { value: "전액 환불", label: "불만족 시 환불 보장", icon: "refund" },
  ];

// 전액 환불/워런티는 실제 적용 조건 확정 후 표기해야 함 (기획서 §9).
export const assuranceNote =
  "워런티와 환불의 적용 시점·범위·제외 조건은 계약 시 안내됩니다.";

// 실적 지표 — 운영자가 검증했다고 확인한 값. 변경 시 여기만 수정.
export const stats: {
  value: string;
  suffix?: string;
  label: string;
  note?: string;
  emphasized?: boolean;
  icon: "brands" | "sales" | "conversion";
}[] = [
    { value: "100", suffix: "+", label: "런칭 브랜드", icon: "brands" },
    // TODO: 누적 판매량 실제 수치로 교체 (아래 1,200은 임시값)
    { value: "1,200", suffix: "+", label: "누적 판매량", emphasized: true, icon: "sales" },
    {
      value: "95",
      suffix: "%",
      label: "오픈 1달 이내 문의·주문 경험 비율",
      note: "네이버·구글 SEO 연동 기준",
      icon: "conversion",
    },
  ];

export const problem = {
  title: ["좋은 홈페이지는", "우리 사업을 정확하게 보여줘야 합니다"],
  questions: [
    "우리 회사의 장점이 한눈에 보이나요?",
    "고객이 원하는 정보를 쉽게 찾을 수 있나요?",
    "신뢰를 줄 수 있는 내용이 충분히 담겨 있나요?",
    "문의와 상담으로 자연스럽게 연결되나요?",
  ],
  body: "디자인이 세련돼도 서비스의 장점이 잘 전달되지 않으면 고객의 선택으로 이어지기 어렵습니다. 핏마이웹은 보기 좋은 화면을 넘어 사업의 특징과 고객의 행동을 함께 고려합니다.",
  closing: "핏마이웹은 이 질문에서부터 홈페이지 제작을 시작합니다.",
};

export type Fit = {
  code: string;
  label: string;
  title: string;
  desc: string;
  results: string[];
};

export const fits: Fit[] = [
  {
    code: "01",
    label: "BUSINESS FIT",
    title: "사업에 맞는 기획",
    desc: "업종, 서비스, 고객층과 경쟁 환경을 이해하고 홈페이지의 목적과 방향을 정리합니다.",
    results: [
      "업종 및 고객 분석",
      "제작 목적 정리",
      "페이지 구성 방향",
      "핵심 서비스 우선순위",
    ],
  },
  {
    code: "02",
    label: "CONTENT FIT",
    title: "고객에게 맞는 콘텐츠",
    desc: "고객이 궁금해하는 순서에 맞춰 서비스와 회사의 장점을 쉽고 명확하게 전달합니다.",
    results: [
      "콘텐츠 구조",
      "섹션 순서",
      "핵심 제목 방향",
      "문의 전 필요한 정보 구성",
    ],
  },
  {
    code: "03",
    label: "DESIGN FIT",
    title: "브랜드에 맞는 디자인",
    desc: "브랜드의 성격과 업종의 전문성을 반영해 색상, 서체, 이미지와 화면 구성을 디자인합니다.",
    results: [
      "메인 화면 디자인",
      "컬러 및 타이포그래피",
      "이미지 스타일",
      "PC·모바일 반응형 화면",
    ],
  },
  {
    code: "04",
    label: "FUNCTION FIT",
    title: "운영에 맞는 기능",
    desc: "상담, 문의, 예약, 게시판, 결제 등 실제 운영에 필요한 기능을 선택해 적용합니다.",
    results: [
      "문의 및 견적 신청",
      "게시판",
      "예약 또는 결제",
      "회원 및 소셜 로그인",
      "검색 등록 및 방문 분석",
    ],
  },
];

export const cost = {
  title: ["불필요한 비용은 줄이고", "필요한 곳에 집중합니다"],
  body: "핏마이웹은 고객과 실제 제작자가 직접 소통하고, 체계화된 제작 절차를 통해 중복 업무와 불필요한 관리 비용을 줄입니다. 그 대신 고객에게 중요한 기획, 콘텐츠 구조, 디자인, 기능과 운영 편의성에 집중합니다.",
  focus: [
    "사업과 고객에 대한 이해",
    "페이지와 콘텐츠 구조",
    "브랜드에 맞는 디자인",
    "사용자 이동 흐름",
    "사업에 필요한 기능",
    "제작 후 관리 편의성",
  ],
  reduce: [
    "불필요하게 긴 회의",
    "복잡한 의사소통 단계",
    "사용하지 않는 기능",
    "과도한 페이지 구성",
    "예측하기 어려운 추가비용",
    "중복되는 제작 작업",
  ],
  emphasis: [
    "핏마이웹 제작 시스템을 통해",
    "더 효율적으로 제작해 비용을 합리적으로 만듭니다.",
  ],
};

export type Step = { no: string; title: string; desc: string; phase: string };

export const steps: Step[] = [
  { no: "01", title: "상담", desc: "업종, 서비스, 주요 고객과 홈페이지 제작 목적을 확인합니다.", phase: "기획" },
  { no: "02", title: "분석", desc: "기존 자료, 참고 사이트와 경쟁 환경을 확인해 제작 방향을 정리합니다.", phase: "기획" },
  { no: "03", title: "기획", desc: "필요한 페이지와 콘텐츠 순서, 고객의 이동 흐름을 설계합니다.", phase: "기획" },
  { no: "04", title: "디자인", desc: "브랜드에 맞는 색상과 서체, 이미지와 화면 구성을 디자인합니다.", phase: "제작" },
  { no: "05", title: "구축", desc: "PC, 태블릿과 모바일 환경에 맞춰 반응형 홈페이지로 구축합니다.", phase: "제작" },
  { no: "06", title: "검수", desc: "텍스트, 이미지, 링크와 기능을 확인하고 고객의 피드백을 반영합니다.", phase: "제작" },
  { no: "07", title: "오픈", desc: "도메인을 연결하고 홈페이지를 정상적으로 공개합니다.", phase: "오픈" },
  { no: "08", title: "운영 안내", desc: "고객이 직접 수정하고 관리할 수 있도록 기본적인 운영 방법을 안내합니다.", phase: "오픈" },
];

export type PortfolioCategory = "shop" | "brand" | "clinic" | "etc";

/** 포트폴리오 필터 탭. "all" 은 기본 선택 상태로 전체를 보여준다. */
export const portfolioCategories: {
  id: PortfolioCategory | "all";
  label: string;
}[] = [
    { id: "all", label: "전체" },
    { id: "shop", label: "쇼핑몰" },
    { id: "brand", label: "브랜드" },
    { id: "clinic", label: "병원" },
    { id: "etc", label: "기타" },
  ];

export type PortfolioItem = {
  title: string;
  industry: string;
  focus: string;
  category: PortfolioCategory;
  /** 공개된 실제 사례만 채운다. 값이 있으면 카드가 링크로 바뀌고 "준비 중" 대신
   *  사이트 보기 안내가 노출된다. */
  url?: string;
  /**
   * 썸네일 경로 (public 기준). 카드가 aspect-[16/10] 이라 같은 비율로 넣어야
   * 잘리지 않는다. 캡처 방법은 README 의 "포트폴리오 추가" 참고.
   */
  image?: string;
};

// 공개된 실제 사례만 넣는다. 허구 회사명·수치를 실제처럼 노출하지 않는다.
// 새 사례는 맨 앞에 추가하면 최신순으로 노출되고, category 만 맞추면 필터에 자동 반영된다.
export const portfolioSamples: PortfolioItem[] = [
  {
    title: "아이가 말하는 시간을 숫자로 증명하고 무료 레벨테스트로 연결하는 초등 영어학원 사이트",
    industry: "초등 영어학원 · 전국 60개 지점",
    focus: "무료 레벨테스트 신청 · 지점 찾기",
    category: "etc",
    url: "https://fitmyweb-portfolio-22.vercel.app",
    image: "/portfolio/tellmemore.jpg",
  },
  {
    title: "수업 방식을 먼저 보여주고 60분 무료 진단으로 연결하는 초등 수학학원 사이트",
    industry: "초등 수학학원 · 12개 지점",
    focus: "무료 진단 신청 · 지점 찾기",
    category: "etc",
    url: "https://fitmyweb-portfolio-21.vercel.app",
    image: "/portfolio/sussori.jpg",
  },
  {
    title: "먹그림 컬렉션과 내 기종을 골라 주문하는 수제 휴대폰 케이스 브랜드몰",
    industry: "수제 휴대폰 케이스",
    focus: "컬렉션 · 기종 선택 후 주문",
    category: "shop",
    url: "https://fitmyweb-portfolio-20.vercel.app",
    image: "/portfolio/mukhyang.jpg",
  },
  {
    title: "손으로 재단하는 과정을 먼저 보여주고 무신사로 보내는 가죽 공방 브랜드 사이트",
    industry: "가죽 공방 · 핸드메이드",
    focus: "제작 과정 · 무신사 스토어 연결",
    category: "brand",
    url: "https://fitmyweb-portfolio-19.vercel.app",
    image: "/portfolio/morcus.jpg",
  },
  {
    title: "아이와 20분이면 끝나는 비누 키트를 단체와 가정으로 나눠 파는 브랜드몰",
    industry: "비누 만들기 키트",
    focus: "단체 견적 · 인원별 수량 계산",
    category: "shop",
    url: "https://fitmyweb-portfolio17.vercel.app",
    image: "/portfolio/haringharing.jpg",
  },
  {
    title: "필수 기능만 담은 홈페이지 제작 상품을 가격부터 공개하는 서비스몰",
    industry: "홈페이지 제작 서비스",
    focus: "패키지 비교 · 바로 주문",
    category: "etc",
    url: "https://codestory00.mycafe24.com",
    image: "/portfolio/silsokmyweb.jpg",
  },
  {
    title: "회사와 팀, 포트폴리오를 한 흐름으로 보여주는 웹 제작사 소개 사이트",
    industry: "홈페이지 제작 · 웹에이전시",
    focus: "서비스 소개 → 견적 문의",
    category: "etc",
    url: "https://savemyweb00.mycafe24.com",
    image: "/portfolio/webstarter.jpg",
  },
  {
    title: "컬렉션과 룩북으로 무드를 먼저 보여주는 패션 브랜드 사이트",
    industry: "패션 · 의류 브랜드",
    focus: "컬렉션 · 룩북 탐색",
    category: "brand",
    url: "https://savemyweb01.mycafe24.com",
    image: "/portfolio/daymood.jpg",
  },
  {
    title: "인쇄 서비스와 제작 사례를 함께 보여주는 홈데코 인쇄 전문 사이트",
    industry: "인쇄 · 홈데코 제작",
    focus: "서비스 안내 → 견적 문의",
    category: "etc",
    url: "https://savemyweb02.mycafe24.com",
    image: "/portfolio/sdprint.jpg",
  },
  {
    title: "성과 사례와 프로세스로 설득하는 브랜딩·마케팅 에이전시 사이트",
    industry: "브랜딩 · 퍼포먼스 마케팅",
    focus: "성과 사례 · 인사이트 동선",
    category: "etc",
    url: "https://savemyweb03.mycafe24.com",
    image: "/portfolio/ondobranding.jpg",
  },
  {
    title: "운용 철학과 리서치 체계를 단계별로 설명하는 투자 운용사 사이트",
    industry: "투자 운용 · 리서치",
    focus: "운용 철학 · 리서치 구독",
    category: "etc",
    url: "https://savemyweb04.mycafe24.com",
    image: "/portfolio/cashcow.jpg",
  },
  {
    title: "용도별 추천부터 정품 구성과 AS까지 안내하는 드론 판매·촬영 사이트",
    industry: "드론 판매 · 촬영 운용",
    focus: "용도별 제품 추천 동선",
    category: "shop",
    url: "https://savemyweb05.mycafe24.com",
    image: "/portfolio/dronework.jpg",
  },
  {
    title: "사진 수백 장에서 쓸 컷만 골라 영상까지 만들어주는 AI 서비스 소개",
    industry: "AI 사진 선별 · 영상 자동 생성",
    focus: "요금 계산기 · 샘플 신청 동선",
    category: "etc",
    url: "https://fitmyweb-portfolio-16.vercel.app",
    image: "/portfolio/acut.jpg",
  },
  {
    title: "한정 신상빵과 매일 파는 빵을 나눠 보여주는 베이커리 사이트",
    industry: "베이커리 · 5개 지점",
    focus: "신상빵 확인 → 매장 찾기",
    category: "brand",
    url: "https://bbangman.vercel.app",
    image: "/portfolio/bbangman.jpg",
  },
  {
    title: "돈코츠 대신 닭육수를 내세워 설명하는 동네 라멘집 사이트",
    industry: "일본식 라멘 전문점",
    focus: "메뉴 확인 → 길찾기 동선",
    category: "brand",
    url: "https://fitmyweb-portfolio14.vercel.app",
    image: "/portfolio/ramenkami.jpg",
  },
  {
    title: "세 자매를 각자의 색으로 소개하는 캐릭터 브랜드 사이트",
    industry: "캐릭터 · 퍼스널 브랜드",
    focus: "캐릭터별 소개 동선",
    category: "brand",
    url: "https://hereiam.synology.me:666",
    image: "/portfolio/trinityha.jpg",
  },
  {
    title: "선교사의 쉼터와 이동 지원을 한곳에 모은 커뮤니티 포탈",
    industry: "커뮤니티 포탈",
    focus: "구글 로그인 · 회원 전용",
    category: "etc",
    url: "https://hereiam.synology.me:555",
    image: "/portfolio/geoham.jpg",
  },
  {
    title: "40년 토션 기술을 특허와 인증으로 함께 보여주는 제조기업 홈페이지",
    industry: "토션 부품 제조",
    focus: "제품군 · 특허 인증 안내",
    category: "etc",
    url: "https://hereiam.synology.me:444",
    image: "/portfolio/torsionpia.jpg",
  },
  {
    title: "사흘을 말리는 과정부터 보여주고 파는 수제 국수 자사몰",
    industry: "수제 국수 커머스",
    focus: "제조 과정 · 주문 동선",
    category: "shop",
    url: "https://hanol-noodle.vercel.app",
    image: "/portfolio/hanol.jpg",
  },
  {
    title: "세계관과 시리즈로 골라 담게 만든 미니피규어 편집숍",
    industry: "미니피규어 커머스",
    focus: "컬렉션 필터 · 정렬 동선",
    category: "shop",
    url: "https://brickfigs-store.vercel.app",
    image: "/portfolio/brickfigs.jpg",
  },
  {
    title: "한 번에 한 품목만 만드는 이유부터 설명하는 오브제 브랜드",
    industry: "디자인 오브제",
    focus: "재료 · 제작 과정 안내",
    category: "shop",
    url: "https://yeobaek-blond.vercel.app",
    image: "/portfolio/yeobaek.jpg",
  },
  {
    title: "브라우저에서 바로 얹어 보고 주문하는 굿즈 제작 사이트",
    industry: "주문 제작 굿즈",
    focus: "굿즈 에디터 화면",
    category: "shop",
    url: "https://morupress-goods-editor.vercel.app",
    image: "/portfolio/morupress.jpg",
  },
  {
    title: "진단·치료·재활을 한 흐름으로 잇는 정형외과 홈페이지",
    industry: "정형외과의원",
    focus: "부위별 진료 안내",
    category: "clinic",
    url: "https://ieumbon-orthopedic-clinic.vercel.app",
    image: "/portfolio/ieumbon.jpg",
  },
  {
    title: "부품 교체 전에 원인부터 찾는 노트북 수리 서비스",
    industry: "노트북 수리",
    focus: "증상별 접수 동선",
    category: "etc",
    url: "https://corefix-lab.vercel.app",
    image: "/portfolio/corefix.jpg",
  },
  {
    title: "부위와 식감을 기준으로 고르게 만든 직화 닭구이 브랜드",
    industry: "외식 프랜차이즈",
    focus: "고객·창업 동선 분리",
    category: "etc",
    url: "https://hwarodam-chicken-grill.vercel.app",
    image: "/portfolio/hwarodam.jpg",
  },
  {
    title: "아픈 부위만이 아니라 움직임과 생활까지 다루는 통증재활의원",
    industry: "통증재활의원",
    focus: "증상 확인 → 예약 동선",
    category: "clinic",
    url: "https://ongyeol-pain-rehab-clinic.vercel.app",
    image: "/portfolio/ongyeol.jpg",
  },
  {
    title: "공간을 먼저 확인하고 구성을 제안하는 모듈 수납 브랜드",
    industry: "모듈 수납 가구",
    focus: "구성 도구 · 실측 상담",
    category: "brand",
    url: "https://layerroom-modular-storage.vercel.app",
    image: "/portfolio/layerroom.jpg",
  },
  {
    title: "메뉴가 아니라 취향으로 고르게 만든 카페 브랜드 사이트",
    industry: "카페 · 프랜차이즈",
    focus: "고객·예비점주 분리",
    category: "brand",
    url: "https://notebean-coffee.vercel.app",
    image: "/portfolio/notebean.jpg",
  },
  {
    title: "목적과 배송 요일로 30초 만에 고르는 정기배송 사이트",
    industry: "건강식 정기배송",
    focus: "구독 플랜 선택 동선",
    category: "shop",
    url: "https://fitmyweb-portfolio04.vercel.app",
    image: "/portfolio/mealleaf.jpg",
  },
  {
    title: "객실이 아니라 여행 목적으로 고르게 만든 리조트 예약 사이트",
    industry: "리조트 · 숙박",
    focus: "목적별 예약 동선",
    category: "etc",
    url: "https://fitmyweb-portfolio03.vercel.app",
    image: "/portfolio/foredam.jpg",
  },
  {
    title: "흩어진 산지·시세 정보를 한곳에 모은 산업 플랫폼",
    industry: "협회 · 산업 플랫폼",
    focus: "데이터 구조 설계",
    category: "etc",
    url: "https://fitmyweb-portfolio02.vercel.app",
    image: "/portfolio/kmhic.jpg",
  },
  {
    title: "확인된 사실과 가능한 대응을 구분해 안내하는 법률사무소 홈페이지",
    industry: "법률사무소",
    focus: "상담 예약 동선",
    category: "brand",
    url: "https://fitmyweb-portfolio01.vercel.app",
    image: "/portfolio/damyeon.jpg",
  },
];

export type Plan = {
  id: string;
  name: string;
  price: number;
  fromPrice?: boolean;
  summary: string;
  audience: string[];
  scope: string[];
  featured?: boolean;
  payable: boolean;
};

export const plans: Plan[] = [
  {
    id: "startfit",
    name: "스타트핏",
    price: 1_790_000,
    summary: "작은 사업과 개인 브랜드를 위한 핵심 정보 중심의 맞춤 홈페이지",
    audience: ["1인 기업", "전문가", "초기 창업자", "소규모 회사", "개인 브랜드"],
    scope: [
      "원페이지 또는 소규모 홈페이지",
      "페이지 및 섹션 구성 제안",
      "브랜드 색상과 서체 적용",
      "메인 화면 맞춤 구성",
      "PC·모바일 반응형",
      "상담 또는 문의 기능",
      "기본 검색 환경 설정",
      "고객 직접 수정 가능",
      "기본 운영 안내",
    ],
    payable: true,
  },
  {
    id: "bizfit",
    name: "비즈핏",
    price: 2_490_000,
    summary: "기업과 전문 서비스에 가장 적합한 핏마이웹 대표 제작 플랜",
    audience: ["중소기업", "제조기업", "기업 홈페이지 리뉴얼"],
    scope: [
      "최대 5페이지",
      "업종 및 경쟁 환경 분석",
      "전체 페이지 구조 기획",
      "메인 화면 맞춤 디자인",
      "서브페이지 구성",
      "PC·모바일 반응형",
      "문의 및 게시판 기능",
      "기본 검색 등록",
      "방문 분석 도구 연결",
      "관리 방법 안내",
    ],
    featured: true,
    payable: true,
  },
  {
    id: "brandfit",
    name: "브랜드핏",
    price: 3_490_000,
    fromPrice: true,
    summary: "브랜드 이미지와 콘텐츠가 중요한 프리미엄 커스텀 홈페이지",
    audience: ["신규 브랜드", "스타트업", "고급 전문 서비스", "프로젝트 중심 기업"],
    scope: [
      "최대 8페이지",
      "사업 및 브랜드 분석",
      "전체 콘텐츠 구조 기획",
      "메인 및 서브페이지 맞춤 디자인",
      "핵심 메시지와 제목 방향 제안",
      "이미지 스타일 제안",
      "PC·모바일 반응형",
      "문의 및 게시판 기능",
      "검색엔진 기본 최적화",
      "방문 분석 도구 설정",
      "오픈 후 기본 운영 지원",
    ],
    payable: false,
  },
];

export const addOns = [
  { name: "네이버 서치어드바이저 등록", price: 50_000 },
  { name: "구글 서치콘솔 등록", price: 50_000 },
  { name: "홈페이지 주소·도메인 연동", price: 50_000 },
  { name: "결제 연동", price: 300_000 },
  { name: "소셜 로그인 연동", price: 300_000 },
];

export const addOnNotes = [
  "이미지 제작",
  "별도 제작 의뢰",
  "네이버·구글 검색 환경 설정",
  "카드·카카오페이·네이버페이 연결",
];

export const promises = [
  "제작 전 작업 범위와 비용을 안내합니다.",
  "계약된 범위 안에서 임의로 비용을 추가하지 않습니다.",
  "디자인 방향을 확인한 뒤 다음 단계로 진행합니다.",
  "PC와 모바일 환경을 함께 검수합니다.",
  "제작 범위 내 오류는 약속된 기간 동안 수정합니다.",
  "제작 완료 후 6개월간 제작 범위 내 기능 오류를 무상 보수합니다.",
];

// 원본 기획안의 샘플 후기. 실제 후기 확보 전까지 '예시'로만 사용한다.
export const testimonialSamples = [
  {
    heading: "회사의 강점을 잘 정리해주셨습니다",
    body: "기존 홈페이지가 오래되기도 했지만, 무엇보다 저희가 어떤 회사인지 제대로 전달되지 않는 것이 고민이었습니다. 처음 상담할 때 사업 내용과 주요 고객을 꼼꼼히 물어보시고, 어떤 내용을 먼저 보여줘야 하는지 구성부터 제안해주셨습니다.",
    author: "경기 소재 산업용 부품 제조업체 김대표님",
  },
  {
    heading: "생각했던 것보다 훨씬 전문적으로 완성됐어요",
    body: "처음에는 제작비가 합리적이라 완성도가 부족하지 않을까 걱정했습니다. 그런데 상담부터 디자인 시안, 수정 과정까지 체계적으로 진행되어 걱정이 금방 사라졌습니다. 모바일에서도 상담 신청이 편리하게 구성됐습니다.",
    author: "서울 마포구 영어학원 이원장님",
  },
  {
    heading: "요청한 내용만 만드는 업체와는 달랐습니다",
    body: "다른 업체는 페이지 수와 기능 이야기만 했는데, 핏마이웹은 저희 고객이 어떤 부분에서 신뢰를 느끼는지부터 질문해주셨습니다. 단순히 보기 좋은 홈페이지가 아니라 실제 상담으로 연결되는 구조를 만들어주셨습니다.",
    author: "기업경영 컨설팅사 박대표님",
  },
  {
    heading: "저희 브랜드에 잘 맞는 홈페이지가 완성됐습니다",
    body: "참고 사이트를 그대로 따라 만드는 것이 아니라, 저희 브랜드에 어울리는 색상과 이미지 방향을 새롭게 제안해주셨습니다. 제작이 끝난 뒤에는 직접 수정하는 방법까지 알려주셔서 운영하기도 어렵지 않았습니다.",
    author: "주거공간 인테리어 스튜디오 최대표님",
  },
  {
    heading: "비용과 제작 과정이 투명해서 믿을 수 있었습니다",
    body: "추가비용이 계속 발생하지 않을까 가장 걱정했는데, 상담 단계에서 포함되는 작업과 별도 비용을 정확히 설명해주셔서 예산을 정하기 쉬웠습니다. 합리적인 비용이었지만 결과물은 저렴한 홈페이지처럼 보이지 않았습니다.",
    author: "생활용품 온라인 브랜드 정대표님",
  },
]

export const faqs = [
  {
    q: "어떤 부분이 맞춤 제작되나요?",
    a: "업종과 제작 목적에 따라 페이지 구성, 콘텐츠 순서, 메인 화면 디자인, 색상, 서체, 이미지와 필요한 기능을 조정합니다.",
  },
  {
    q: "제작비가 합리적인 이유는 무엇인가요?",
    a: "고객과 제작자가 직접 소통하고 체계화된 제작 절차를 통해 불필요한 관리 비용과 중복 작업을 줄이기 때문입니다. 기획과 디자인 등 결과물에 중요한 작업은 필요한 수준으로 진행합니다.",
  },
  {
    q: "홈페이지 자료는 누가 준비하나요?",
    a: "회사와 서비스에 관한 기본 자료는 고객님이 제공해주셔야 합니다. 핏마이웹은 전달해주신 자료를 검토한 뒤 홈페이지에 적합한 구성과 제목 방향을 제안합니다.",
  },
  {
    q: "제작 기간은 얼마나 걸리나요?",
    a: "일반적인 홈페이지는 자료가 준비된 시점부터 약 7~20영업일이 소요됩니다. 페이지 수와 기능, 피드백 일정에 따라 달라질 수 있습니다.",
  },
  {
    q: "제작 후 직접 수정할 수 있나요?",
    a: "네. 텍스트, 이미지와 게시물 등 일반적인 콘텐츠는 직접 관리할 수 있습니다. 제작 완료 후 기본적인 관리 방법을 안내합니다.",
  },
  {
    q: "유지관리 계약이 필수인가요?",
    a: "필수 유지관리 계약을 강요하지 않습니다. 추가 수정이나 기능 개발이 필요한 경우 필요한 작업만 별도로 요청할 수 있습니다.",
  },
];

// ── 쿠폰 ───────────────────────────────────────────────────────────
/**
 * 쿠폰은 두 종류이고, 한 결제에 함께 적용된다(최대 80만원).
 *
 *   event  — 8월 이벤트 쿠폰. 비회원도 결제 화면에서 바로 쓸 수 있고,
 *            회원은 계정에 저장해 마이페이지에서 확인할 수 있다.
 *   signup — 회원가입 쿠폰. 로그인한 계정만 발급받고 사용할 수 있다.
 *
 * "계정당 종류별 1장" 은 앱 로직이 아니라 coupons 테이블의 유니크 인덱스
 * (user_id, kind)가 보증한다.
 */
export type CouponKind = "event" | "signup";

/** 이벤트 쿠폰이 대신해 주는 유상 옵션 — 이 합계가 곧 쿠폰 금액이다. */
const eventCouponIncludes = [
  { label: "네이버 서치어드바이저 등록", value: 50_000 },
  { label: "구글 서치콘솔 등록", value: 50_000 },
  { label: "홈페이지 주소연동", value: 50_000 },
  { label: "결제연동", value: 300_000 },
  { label: "소셜로그인", value: 300_000 },
];

export type CouponDef = {
  kind: CouponKind;
  name: string;
  amount: number;
  /** true 면 로그인 계정만 발급·사용할 수 있다. */
  memberOnly: boolean;
  /** 결제 화면에서 "이 쿠폰으로 무엇을 받는지" 를 밝히는 목록. */
  includes: { label: string; value?: number }[];
  /** 목록 아래 한 줄 안내. */
  note: string;
};

export const couponDefs: Record<CouponKind, CouponDef> = {
  event: {
    kind: "event",
    name: "8월 이벤트 쿠폰",
    amount: eventCouponIncludes.reduce((sum, b) => sum + b.value, 0),
    memberOnly: false,
    includes: eventCouponIncludes,
    note: "제작 계약 시 위 유상 옵션을 무상으로 제공합니다. 로그인 없이도 결제 화면에서 사용할 수 있습니다.",
  },
  signup: {
    kind: "signup",
    name: "회원가입 쿠폰",
    amount: 50_000,
    memberOnly: true,
    includes: [{ label: "제작비 즉시 할인", value: 50_000 }],
    note: "로그인한 계정에만 발급되며, 이벤트 쿠폰과 함께 사용할 수 있습니다.",
  },
};

export const couponKinds: CouponKind[] = ["event", "signup"];

/**
 * 비회원이 결제 화면에서 쓰는 이벤트 쿠폰 코드.
 *
 * 계정에 저장된 쿠폰과 달리 DB 행이 없는 공개 코드다. 이벤트 기간 동안
 * 누구에게나 동일하게 적용되는 할인이므로 코드가 알려져도 문제가 없고,
 * 할인액은 서버가 이 상수에서 직접 읽는다(클라이언트 값은 믿지 않는다).
 */
export const EVENT_COUPON_CODE = "MFW-AUGUST-EVENT";

/** 이벤트 쿠폰 종료 시각(KST). 이 시각 이후에는 발급도 적용도 되지 않는다. */
export const EVENT_COUPON_ENDS_AT = new Date("2026-08-31T23:59:59+09:00");

export const eventCouponPeriodLabel = "2026년 8월 31일까지";

export function isEventCouponActive(now: Date = new Date()): boolean {
  return now.getTime() <= EVENT_COUPON_ENDS_AT.getTime();
}

/** 두 쿠폰을 모두 받았을 때의 총 할인액. */
export const totalCouponBenefit = couponDefs.event.amount + couponDefs.signup.amount;

// 홈 첫 진입 시 노출되는 런칭 기념 이벤트 팝업 카피.
// 안내(쿠폰 구성)와 행동(쿠폰 발급)이 함께 있는 팝업이다. 로그인하면 두 쿠폰이
// 계정에 저장되고, 비회원은 이벤트 쿠폰만 결제 화면에서 바로 쓸 수 있다.
export const launchPromo = {
  badge: "서비스 런칭 기념",
  sideLeft: ["런칭", "기념"],
  sideRight: ["혜택", "안내"],
  amountLabel: "총 할인",
  cta: "쿠폰 다운받기",
  /**
   * 쿠폰 발급 버튼의 결과 문구. 종류별 1장이라 재시도는 "이미 받음" 으로 답한다.
   * 문구를 컴포넌트가 아니라 여기 두는 이유는 나머지 팝업 카피와 한자리에서
   * 고칠 수 있게 하기 위함.
   */
  couponMessages: {
    issued: "쿠폰이 계정에 저장되었어요. 결제 화면에서 자동으로 적용됩니다.",
    already: "이미 발급받은 쿠폰이에요. 쿠폰은 계정당 종류별 1장만 발급됩니다.",
    used: "이미 사용까지 완료한 쿠폰이에요. 계정당 종류별 1장만 발급됩니다.",
    unavailable: "지금은 쿠폰을 발급할 수 없어요. 잠시 후 다시 시도해 주세요.",
    error: "쿠폰 발급에 실패했어요. 잠시 후 다시 시도해 주세요.",
  },
  // 줄 단위로 나눠 둔 이유: 자동 줄바꿈에 맡기면 "제작을 / 계약하시면" 처럼
  // 조건절 중간이 끊긴다. 의미 단위(조건 / 결과)로 직접 끊어 준다.
  notice: [
    `이벤트 쿠폰은 ${eventCouponPeriodLabel} 사용할 수 있고, 회원가입 쿠폰과 함께 적용됩니다.`,
    "이벤트 쿠폰은 로그인 없이도 결제 화면에서 사용할 수 있습니다.",
  ],
};

// 홈 우하단 플로팅 상담 버튼. 페이지 내 #contact 폼과 달리 카카오톡 채널로
// 바로 연결되는 즉시 상담 경로다.
export const kakaoConsult = {
  url: "https://pf.kakao.com/_xjxixbZX/chat",
  label: "카카오톡 상담하기",
  // 데스크톱에서 버튼 왼쪽에 붙는 짧은 안내. 모바일은 공간이 없어 숨긴다.
  tooltip: "1:1 상담",
};

/**
 * 상담 신청 폼 사용 여부. false 면 폼은 화면에서 감추고 전화·이메일·카카오톡
 * 카드만 보여준다. 폼 마크업 자체는 components/ContactForm.tsx 에 그대로
 * 남아 있으므로, 다시 열 때는 이 값을 true 로만 바꾸면 된다.
 */
export const contactFormEnabled = false;

export const contactPaused = {
  title: "상담 신청 폼은 잠시 닫아 두었습니다",
  body: "아래 연락처로 문의해 주시면 같은 담당자가 확인 후 빠르게 답변드립니다.",
  /** 폼이 닫힌 동안 접수 요청에 답하는 문구(POST /api/contact). */
  closedNotice:
    "상담 신청 폼을 잠시 닫아 두었습니다. 전화·이메일·카카오톡으로 문의해 주세요.",
};

/**
 * brand.phone 이 아직 자리표시자(010-0000-0000)인지.
 * 실제 번호가 들어오기 전까지 전화 항목을 숨겨 가짜 번호 노출을 막는다.
 */
export const hasRealPhone = !/0{4}/.test(brand.phone.replace(/\D/g, ""));

export const budgetOptions = [
  "100만원 미만",
  "100만~150만원",
  "150만~250만원",
  "250만원 이상",
  "아직 정하지 못함",
];

export const about = {
  title: ["비즈니스를 이해하고", "꼭 맞는 웹사이트를 만듭니다"],
  intro:
    "핏마이웹은 고객의 업종과 사업 목적을 먼저 파악합니다. 페이지 구성, 콘텐츠, 디자인과 기능을 사업에 맞춰 설계하고, 반복되는 기술 작업과 제작 과정은 효율화해 전문적인 커스텀 홈페이지를 합리적인 비용으로 제공합니다.",
  mission:
    "비싸고 복잡하게 느껴졌던 커스텀 홈페이지를 더 많은 사업자가 이용할 수 있도록 만드는 것.",
  philosophy: [
    "사업의 강점을 먼저 이해합니다.",
    "고객이 이해하기 쉬운 순서로 구성합니다.",
    "브랜드에 맞는 디자인을 제안합니다.",
    "실제 운영에 필요한 기능을 적용합니다.",
    "비용과 제작 과정을 투명하게 안내합니다.",
  ],
};

export function formatKRW(value: number): string {
  return "₩" + value.toLocaleString("ko-KR");
}

export function formatManwon(value: number): string {
  return (value / 10_000).toLocaleString("ko-KR") + "만원";
}

/** 990000 → "990,000원". 작은 글씨 안내문처럼 ₩ 기호 없이 쓸 때. */
export function formatWon(value: number): string {
  return value.toLocaleString("ko-KR") + "원";
}

export function getPlan(id: string | null | undefined): Plan | undefined {
  return plans.find((p) => p.id === id);
}
