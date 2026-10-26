/*
 * 랜딩 화면의 카드 데이터입니다. (수달 도사 '도리' 테마 — DESIGN.md 참고)
 * Tailwind 는 소스에 "완성된 클래스 문자열"이 있어야 스타일을 만들어 주므로,
 * 색상 클래스를 조립하지 않고 항목마다 통째로 적어 두었어요.
 *
 * fortune 값은 서버가 주제(성공운·재물운…)를 알아보는 데 쓰여요. (lib/ai/reading.ts 의 TOPIC_LABEL 과 맞춰요)
 */

export const FREE_PRICE_LABEL = "0원 (매일 첫 1회 무료)";

export interface MachineCard {
  key: string;
  /** imageManifest.json 의 이미지 키 */
  image: string;
  emoji: string;
  /** 카드 맨 위 작은 배지 */
  badge: string;
  name: string;
  /** 모달에 표시되는 운 이름 (서버가 주제를 알아보는 글자가 들어 있어야 해요) */
  fortune: string;
  desc: string;
  /** 오른쪽 위 작은 표시 */
  tag: string;
  best: boolean;
  /** 카드 모서리에 붙는 스티커 문구 (없으면 null) */
  sticker: string | null;
  card: string;
  badgeClass: string;
  tagClass: string;
  button: string;
  imageBox: string;
  titleClass: string;
  divider: string;
}

/** 6대 운명의 자판기 */
export const MACHINES: readonly MachineCard[] = [
  {
    key: "machine-success",
    image: "machineSuccess",
    emoji: "💧",
    badge: "성공운",
    name: "성공운",
    fortune: "성공운",
    desc: "승진, 이직, 시험 합격까지 거침없이 뚫어주는 성취의 물길",
    tag: "매일 첫 1회 무료",
    best: false,
    sticker: "HOT",
    card: "bg-gradient-to-b from-amber-50/70 via-white to-white border border-amber-200 shadow-sm",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200/80",
    tagClass: "text-amber-700 bg-amber-50 border border-amber-200",
    button: "bg-gradient-to-r from-amber-400 to-orange-400 hover:brightness-105",
    imageBox: "bg-gradient-to-b from-amber-50/80 to-orange-50/40 border-amber-100",
    titleClass: "text-gray-900",
    divider: "border-amber-100",
  },
  {
    key: "machine-money",
    image: "machineMoney",
    emoji: "🪙",
    badge: "재물운",
    name: "재물운",
    fortune: "재물운",
    desc: "통장에 차곡차곡 쌓이는 금전 행운과 돈 모이는 타이밍",
    tag: "매일 첫 1회 무료",
    best: false,
    sticker: "HOT",
    card: "bg-gradient-to-b from-pink-50/70 via-white to-white border border-pink-200 shadow-sm",
    badgeClass: "bg-pink-100 text-pink-700 border border-pink-200/80",
    tagClass: "text-pink-700 bg-pink-50 border border-pink-200",
    button: "bg-gradient-to-r from-pink-400 to-rose-400 hover:brightness-105",
    imageBox: "bg-gradient-to-b from-pink-50/80 to-rose-50/40 border-pink-100",
    titleClass: "text-gray-900",
    divider: "border-pink-100",
  },
  {
    key: "machine-love",
    image: "machineLove",
    emoji: "🌙",
    badge: "연애운",
    name: "연애운",
    fortune: "연애운",
    desc: "설레는 썸과 인연이 다가오는 타이밍을 짚어줘요",
    tag: "매일 첫 1회 무료",
    best: true,
    sticker: "HOT",
    card: "bg-gradient-to-b from-brand-50 via-white to-white border-2 border-brand-300 shadow-md",
    badgeClass: "bg-brand-500 text-white shadow-sm",
    tagClass: "text-brand-600 bg-brand-100 border border-brand-200",
    button: "bg-gradient-to-r from-brand-500 to-fuchsia-500 hover:brightness-105",
    imageBox: "bg-gradient-to-b from-brand-50 to-fuchsia-50/50 border-brand-200",
    titleClass: "text-brand-600",
    divider: "border-brand-200",
  },
  {
    key: "machine-marriage",
    image: "machineMarriage",
    emoji: "💍",
    badge: "결혼운",
    name: "결혼운",
    fortune: "결혼운",
    desc: "평생의 짝꿍과 함께할 인연의 시기와 궁합 이야기",
    tag: "매일 첫 1회 무료",
    best: false,
    sticker: null,
    card: "bg-gradient-to-b from-fuchsia-50/70 via-white to-white border border-fuchsia-200 shadow-sm",
    badgeClass: "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200/80",
    tagClass: "text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-200",
    button: "bg-gradient-to-r from-fuchsia-400 to-pink-400 hover:brightness-105",
    imageBox: "bg-gradient-to-b from-fuchsia-50/80 to-pink-50/40 border-fuchsia-100",
    titleClass: "text-gray-900",
    divider: "border-fuchsia-100",
  },
  {
    key: "machine-health",
    image: "machineHealth",
    emoji: "🌿",
    badge: "건강운",
    name: "건강운",
    fortune: "건강운",
    desc: "몸과 마음을 가볍게 챙겨 주는 오늘의 컨디션 한마디",
    tag: "매일 첫 1회 무료",
    best: false,
    sticker: null,
    card: "bg-gradient-to-b from-emerald-50/70 via-white to-white border border-emerald-200 shadow-sm",
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200/80",
    tagClass: "text-emerald-700 bg-emerald-50 border border-emerald-200",
    button: "bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-105",
    imageBox: "bg-gradient-to-b from-emerald-50/80 to-teal-50/40 border-emerald-100",
    titleClass: "text-gray-900",
    divider: "border-emerald-100",
  },
  {
    key: "machine-study",
    image: "machineStudy",
    emoji: "🎍",
    badge: "2027 신년운",
    name: "2027 신년운",
    fortune: "2027 신년운",
    desc: "붉은 양의 해, 2027년 한 해의 흐름과 새해에 챙기면 좋은 한마디",
    tag: "매일 첫 1회 무료",
    best: false,
    sticker: "NEW",
    card: "bg-gradient-to-b from-blue-50/70 via-white to-white border border-blue-200 shadow-sm",
    badgeClass: "bg-blue-100 text-blue-800 border border-blue-200/80",
    tagClass: "text-blue-700 bg-blue-50 border border-blue-200",
    button: "bg-gradient-to-r from-blue-400 to-indigo-400 hover:brightness-105",
    imageBox: "bg-gradient-to-b from-blue-50/80 to-indigo-50/40 border-blue-100",
    titleClass: "text-gray-900",
    divider: "border-blue-100",
  },
];

export interface PremiumCard {
  key: string;
  image: string;
  emoji: string;
  fortune: string;
  /** 카드 위쪽 작은 태그 */
  tag: string;
  tagClass: string;
  title: string;
  desc: string;
  card: string;
  imageBox: string;
  button: string;
  /** 오른쪽 위에 걸치는 리본 (없으면 null) */
  ribbon: string | null;
  priceClass: string;
  divider: string;
}

/** 9,900원 프리미엄 심층 사주서 3종 */
export const PREMIUM_CARDS: readonly PremiumCard[] = [
  {
    key: "premium-compat",
    image: "premiumCompat",
    emoji: "🦦",
    fortune: "우리 둘의 궁합 리포트",
    tag: "🔮 둘의 궁합",
    tagClass: "bg-brand-50 text-brand-700 border border-brand-100",
    title: "궁합 리포트",
    desc: "상대방의 생년월일시도 함께 넣으면, 두 사람의 사주가 만나는 지점과 잘 맞는 부분, 맞춰가면 좋은 부분을 정리해요.",
    card: "border-2 border-brand-300 shadow-md",
    imageBox: "bg-white border-amber-300 ring-2 ring-amber-100 ring-offset-2 ring-offset-white",
    button: "bg-gradient-to-r from-brand-500 to-fuchsia-500 hover:brightness-105",
    // 판매 실적이 없는 상태에서 "1위" 같은 순위를 단정할 수 없어 'HOT' 스티커로 표시해요.
    ribbon: "HOT",
    priceClass: "text-brand-700",
    divider: "border-brand-100",
  },
  {
    key: "premium-dohwa",
    image: "premiumDohwa",
    emoji: "🐰",
    fortune: "연애 결혼 리포트",
    tag: "💍 연애 결혼",
    tagClass: "bg-pink-50 text-pink-700 border border-pink-100",
    title: "연애 결혼 리포트",
    desc: "나의 연애 스타일과 결혼으로 이어지는 인연의 결, 인연이 찾아오기 쉬운 시기를 사주 흐름으로 풀어봤어요.",
    card: "border border-pink-200 shadow-sm",
    imageBox: "bg-white border-amber-300 ring-2 ring-amber-100 ring-offset-2 ring-offset-white",
    button: "bg-gradient-to-r from-pink-400 to-rose-400 hover:brightness-105",
    ribbon: null,
    priceClass: "text-pink-700",
    divider: "border-pink-100",
  },
  {
    key: "premium-fortune",
    image: "premiumFortune",
    emoji: "🐉",
    fortune: "올해 성공 재물 리포트",
    tag: "✨ 성공 재물",
    tagClass: "bg-amber-100 text-amber-900 border border-amber-200",
    title: "성공 재물 리포트",
    desc: "일과 성공의 길, 돈이 모이는 흐름을 월별(1~12월)로 달력처럼 정리하고, 흐름이 좋은 시기를 짚어드려요.",
    card: "border border-amber-200 shadow-sm",
    imageBox: "bg-white border-amber-300 ring-2 ring-amber-100 ring-offset-2 ring-offset-white",
    button: "bg-gradient-to-r from-amber-400 to-orange-400 hover:brightness-105",
    ribbon: "HOT",
    priceClass: "text-amber-800",
    divider: "border-amber-100",
  },
];

export interface SampleQuotePart {
  text: string;
  strong?: boolean;
}

export interface SampleCapsule {
  key: string;
  tag: string;
  tagClass: string;
  border: string;
  parts: readonly SampleQuotePart[];
}

/**
 * 풀이 분위기를 보여주는 "예시 문구"입니다.
 * 원본 시안에는 실존 인물처럼 보이는 이름·나이·지역·적중률과 "실시간 뽑힘" 표시가 붙어 있었는데,
 * 실제 이용자 기록이 아니므로 모두 빼고 "예시"로만 표시합니다.
 */
export const SAMPLE_CAPSULES: readonly SampleCapsule[] = [
  {
    key: "sample-love",
    tag: "🌙 연애운",
    tagClass: "bg-brand-500 text-white",
    border: "border-brand-200",
    parts: [
      { text: "“달빛이 수면 위로 맑게 부서지듯, 이번 주말엔 좋아하는 사람이 " },
      { text: "'같이 산책할래요?'", strong: true },
      { text: " 하고 먼저 연락할지도 몰라요. 하늘빛 옷이 행운 아이템!”" },
    ],
  },
  {
    key: "sample-career",
    tag: "💧 성공운",
    tagClass: "bg-amber-100 text-amber-800",
    border: "border-amber-200",
    parts: [
      { text: "“새로운 물길이 슬쩍 열려 있어요. 미뤄 둔 지원서, 오늘은 한 줄만 써봐요. " },
      { text: "500원짜리 작은 용기!", strong: true },
      { text: "”" },
    ],
  },
  {
    key: "sample-health",
    tag: "🌿 건강운",
    tagClass: "bg-emerald-100 text-emerald-800",
    border: "border-emerald-200",
    parts: [
      {
        text: "“어깨에 얹힌 짐이 무거웠죠? 오늘 밤은 따뜻한 물 한 잔 마시고 옹달샘처럼 맑게 푹 자도 괜찮아요. 내일은 몸도 마음도 한결 가벼울 거예요.”",
      },
    ],
  },
];
