/*
 * 랜딩 화면의 카드 데이터입니다. (첨부된 Stitch 랜딩 HTML 의 문구와 색상을 그대로 옮김)
 * Tailwind 는 소스에 "완성된 클래스 문자열"이 있어야 스타일을 만들어 주므로,
 * 색상 클래스를 조립하지 않고 항목마다 통째로 적어 두었어요.
 */

export const FREE_PRICE_LABEL = "0원 (매일 첫 1회 무료)";

/** 프리미엄 황금 자판기 (히어로 오른쪽) */
export const GOLDEN_MACHINE = {
  key: "golden",
  fortune: "프리미엄 황금 심층 사주",
  price: "2,990원",
} as const;

export interface MachineCard {
  key: string;
  badge: string;
  name: string;
  /** 모달에 표시되는 운 이름 */
  fortune: string;
  desc: string;
  best: boolean;
  card: string;
  badgeClass: string;
  button: string;
  imageBox: string;
  titleClass: string;
  descClass: string;
  footerClass: string;
}

const MACHINE_CARD_BASE = "bg-white border border-brand-200/80 shadow-sm";
const MACHINE_TITLE = "text-gray-800";
const MACHINE_DESC = "text-gray-500";
const MACHINE_FOOTER = "border-gray-100 text-gray-400";

/** 6대 자판기 */
export const MACHINES: readonly MachineCard[] = [
  {
    key: "machine-success",
    badge: "1) 성공운",
    name: "성공운 자판기",
    fortune: "성공운",
    desc: "승진·취업·합격, 기분 좋은 소식 뽑기",
    best: false,
    card: MACHINE_CARD_BASE,
    badgeClass: "bg-blue-100 text-blue-700",
    button: "bg-blue-600 hover:bg-blue-700",
    imageBox: "bg-slate-50 border-gray-100",
    titleClass: MACHINE_TITLE,
    descClass: MACHINE_DESC,
    footerClass: MACHINE_FOOTER,
  },
  {
    key: "machine-money",
    badge: "2) 재물운",
    name: "재물운 자판기",
    fortune: "재물운",
    desc: "통장도 마음도 든든해지는 한마디",
    best: false,
    card: MACHINE_CARD_BASE,
    badgeClass: "bg-amber-100 text-amber-800",
    button: "bg-amber-600 hover:bg-amber-700",
    imageBox: "bg-amber-50/50 border-amber-100",
    titleClass: MACHINE_TITLE,
    descClass: MACHINE_DESC,
    footerClass: MACHINE_FOOTER,
  },
  {
    key: "machine-love",
    badge: "3) 연애운",
    name: "연애운 자판기",
    fortune: "연애운",
    desc: "오늘 이 마음, 맞지? 설레는 연애 한마디",
    best: true,
    card: "bg-brand-50/50 border-2 border-brand-300 shadow-md",
    badgeClass: "bg-brand-600 text-white",
    button: "bg-gradient-to-r from-brand-600 to-rose-500 hover:brightness-105",
    imageBox: "bg-white border-brand-200",
    titleClass: "text-brand-700",
    descClass: "text-gray-600",
    footerClass: "border-brand-200 text-brand-600 font-bold",
  },
  {
    key: "machine-marriage",
    badge: "4) 결혼운",
    name: "결혼운 자판기",
    fortune: "결혼운",
    desc: "내 인연과 결혼 이야기, 한 알로 미리 보기",
    best: false,
    card: MACHINE_CARD_BASE,
    badgeClass: "bg-purple-100 text-purple-700",
    button: "bg-purple-600 hover:bg-purple-700",
    imageBox: "bg-purple-50/50 border-purple-100",
    titleClass: MACHINE_TITLE,
    descClass: MACHINE_DESC,
    footerClass: MACHINE_FOOTER,
  },
  {
    key: "machine-health",
    badge: "5) 건강운",
    name: "건강운 자판기",
    fortune: "건강운",
    desc: "오늘 몸과 마음을 챙기는 다정한 한마디",
    best: false,
    card: MACHINE_CARD_BASE,
    badgeClass: "bg-emerald-100 text-emerald-800",
    button: "bg-emerald-600 hover:bg-emerald-700",
    imageBox: "bg-emerald-50/50 border-emerald-100",
    titleClass: MACHINE_TITLE,
    descClass: MACHINE_DESC,
    footerClass: MACHINE_FOOTER,
  },
  {
    key: "machine-study",
    badge: "6) 학업운",
    name: "학업운 자판기",
    fortune: "학업운",
    desc: "시험·어학·자격증, 집중력 충전 한마디",
    best: false,
    card: MACHINE_CARD_BASE,
    badgeClass: "bg-indigo-100 text-indigo-800",
    button: "bg-indigo-600 hover:bg-indigo-700",
    imageBox: "bg-indigo-50/50 border-indigo-100",
    titleClass: MACHINE_TITLE,
    descClass: MACHINE_DESC,
    footerClass: MACHINE_FOOTER,
  },
];

export interface SlotCard {
  key: string;
  no: string;
  icon: string;
  name: string;
  fortune: string;
  desc: string;
  best: boolean;
  card: string;
  iconBox: string;
  labelClass: string;
  titleClass: string;
  descClass: string;
  footerBorder: string;
  priceClass: string;
  button: string;
}

const SLOT_CARD_BASE = "bg-white border border-gray-100 shadow-sm";

/** 6대 운세 슬롯 */
export const SLOTS: readonly SlotCard[] = [
  {
    key: "slot-success",
    no: "Slot 01",
    icon: "military_tech",
    name: "성공운 슬롯",
    fortune: "성공운 슬롯",
    desc: "승진, 취업, 사업! 내 안의 리더십을 응원하는 한마디가 나와요.",
    best: false,
    card: SLOT_CARD_BASE,
    iconBox: "bg-blue-50 text-blue-600",
    labelClass: "text-blue-600",
    titleClass: "text-gray-900",
    descClass: "text-gray-500",
    footerBorder: "border-gray-100",
    priceClass: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  {
    key: "slot-money",
    no: "Slot 02",
    icon: "monetization_on",
    name: "재물운 슬롯",
    fortune: "재물운 슬롯",
    desc: "돈 들어올 타이밍과 새어 나가는 지출 점검, 가볍게 챙기는 한마디.",
    best: false,
    card: SLOT_CARD_BASE,
    iconBox: "bg-amber-50 text-amber-600",
    labelClass: "text-amber-600",
    titleClass: "text-gray-900",
    descClass: "text-gray-500",
    footerBorder: "border-gray-100",
    priceClass: "text-amber-600",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  {
    key: "slot-love",
    no: "Slot 03 · 인기",
    icon: "favorite",
    name: "연애운 슬롯",
    fortune: "연애운 슬롯",
    desc: "오늘 이 마음, 맞지? 설레는 인연이 가까워지는 흐름과 행운의 한마디.",
    best: true,
    card: "bg-brand-50/40 border-2 border-brand-200",
    iconBox: "bg-brand-100 text-brand-600",
    labelClass: "text-brand-600",
    titleClass: "text-brand-700",
    descClass: "text-gray-600",
    footerBorder: "border-brand-100",
    priceClass: "text-brand-600",
    button: "bg-brand-600 hover:bg-brand-700",
  },
  {
    key: "slot-marriage",
    no: "Slot 04",
    icon: "diamond",
    name: "결혼운 슬롯",
    fortune: "결혼운 슬롯",
    desc: "내 인연은 언제쯤 만날까? 결혼 이야기를 설레게 풀어주는 한마디.",
    best: false,
    card: SLOT_CARD_BASE,
    iconBox: "bg-purple-50 text-purple-600",
    labelClass: "text-purple-600",
    titleClass: "text-gray-900",
    descClass: "text-gray-500",
    footerBorder: "border-gray-100",
    priceClass: "text-purple-600",
    button: "bg-purple-600 hover:bg-purple-700",
  },
  {
    key: "slot-health",
    no: "Slot 05",
    icon: "spa",
    name: "건강운 슬롯",
    fortune: "건강운 슬롯",
    desc: "오행(목화토금수)의 균형을 바탕으로 한 기운 충전 팁과 오늘의 컨디션 한마디.",
    best: false,
    card: SLOT_CARD_BASE,
    iconBox: "bg-emerald-50 text-emerald-600",
    labelClass: "text-emerald-600",
    titleClass: "text-gray-900",
    descClass: "text-gray-500",
    footerBorder: "border-gray-100",
    priceClass: "text-emerald-600",
    button: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    key: "slot-study",
    no: "Slot 06",
    icon: "menu_book",
    name: "학업운 슬롯",
    fortune: "학업운 슬롯",
    desc: "자격증, 어학, 시험 준비에 힘이 되는 응원과 집중력 충전 팁.",
    best: false,
    card: SLOT_CARD_BASE,
    iconBox: "bg-indigo-50 text-indigo-600",
    labelClass: "text-indigo-600",
    titleClass: "text-gray-900",
    descClass: "text-gray-500",
    footerBorder: "border-gray-100",
    priceClass: "text-indigo-600",
    button: "bg-indigo-600 hover:bg-indigo-700",
  },
];

export interface PremiumCard {
  key: string;
  fortune: string;
  /** 카드 위쪽 작은 태그 */
  tag: string;
  tagClass: string;
  title: string;
  desc: string;
  perk: string;
  perkClass: string;
  card: string;
  /** 오른쪽 위에 걸치는 리본 (없으면 null) */
  ribbon: string | null;
  priceClass: string;
  button: string;
}

/** 2,990원 프리미엄 심층 사주서 3종 */
export const PREMIUM_CARDS: readonly PremiumCard[] = [
  {
    key: "premium-dohwa",
    fortune: "연애 매력 리포트",
    tag: "🌸 연애 매력 포인트",
    tagClass: "bg-brand-50 text-brand-700",
    title: "나의 연애 매력 & 인연 타이밍 리포트",
    desc: "나만의 매력 포인트와 인연이 찾아오기 쉬운 시기를 사주 흐름으로 차근차근 풀어봤어요.",
    perk: "✨ 특전: 2026 인연 행운 키워드 카드",
    perkClass: "bg-rose-50 text-brand-700",
    card: "border border-amber-200/60 shadow-sm",
    ribbon: null,
    priceClass: "text-brand-600",
    button: "bg-brand-600 hover:bg-brand-700",
  },
  {
    key: "premium-fortune",
    fortune: "2026 재물·직장 운 리포트",
    tag: "✨ 재물 & 직장",
    tagClass: "bg-amber-100 text-amber-900",
    title: "2026 재물·직장 흐름 리포트",
    desc: "월별(1~12월) 금전·이직운을 달력처럼 정리하고, 흐름이 좋은 시기를 짚어드려요.",
    perk: "🪙 특전: 이달의 행운 키워드 카드",
    perkClass: "bg-amber-50 text-amber-800",
    card: "border-2 border-gold-400 shadow-md relative",
    // 원본 문구는 "압도적 1위 BEST" 였지만, 판매 실적이 없는 상태에서 순위를 단정할 수 없어 바꿨어요.
    ribbon: "👑 꽃거지 추천",
    priceClass: "text-amber-700",
    button: "bg-gradient-to-r from-gold-600 to-amber-600 hover:brightness-105",
  },
  {
    key: "premium-compat",
    fortune: "우리 둘의 궁합 리포트",
    tag: "💞 둘의 궁합",
    tagClass: "bg-purple-50 text-purple-700",
    title: "우리 둘의 궁합 & 관계 케미 리포트",
    desc: "두 사람의 사주가 만나는 지점, 잘 맞는 부분과 서로 맞춰가면 좋은 부분을 정리했어요.",
    perk: "📜 특전: 우리 사이 대화 힌트 카드",
    perkClass: "bg-purple-50 text-purple-700",
    card: "border border-purple-200/60 shadow-sm",
    ribbon: null,
    priceClass: "text-purple-600",
    button: "bg-purple-600 hover:bg-purple-700",
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
 * 원본 HTML 에는 실존 인물처럼 보이는 이름/나이/지역/적중률이 붙어 있었는데,
 * 실제 이용자 기록이 아니므로 모두 빼고 "예시"로만 표시합니다.
 */
export const SAMPLE_CAPSULES: readonly SampleCapsule[] = [
  {
    key: "sample-love",
    tag: "🌸 연애",
    tagClass: "bg-brand-50 text-brand-700",
    border: "border-brand-100",
    parts: [
      { text: "“오늘 이 마음, 맞지? 이번 주말엔 좋아하는 사람이 " },
      { text: "'시간 어때요?'", strong: true },
      { text: " 하고 먼저 연락할지도 몰라요. 핑크빛 옷이 행운 아이템!”" },
    ],
  },
  {
    key: "sample-career",
    tag: "✨ 이직/재물",
    tagClass: "bg-purple-50 text-purple-700",
    border: "border-purple-100",
    parts: [
      {
        text: "“새로운 기회의 문이 슬쩍 열려 있어요. 미뤄 둔 지원서, 오늘은 한 줄만 써봐요. ",
      },
      { text: "500원짜리 작은 용기!", strong: true },
      { text: "”" },
    ],
  },
  {
    key: "sample-night",
    tag: "🌙 심야 위로점",
    tagClass: "bg-amber-50 text-amber-800",
    border: "border-amber-100",
    parts: [
      {
        text: "“어깨에 얹힌 짐이 무거웠죠? 오늘 밤은 자책은 내려놓고 푹 자도 괜찮아요. 내일은 한결 가벼울 거예요.”",
      },
    ],
  },
];
