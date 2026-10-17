export type ElementKind = "wood" | "fire" | "earth" | "metal" | "water" | "unknown";

export interface PillarView {
  key: "year" | "month" | "day" | "hour";
  label: string; // 연주 / 월주 / 일주 / 시주
  /** 간지 두 글자(한자). 태어난 시간을 모르는 시주는 null */
  full: string | null;
  /** 한글 읽기 (예: "경오") */
  reading: string | null;
  /** 천간/지지 십성 (일간 자리는 "일간") */
  tenGodStem: string | null;
  tenGodBranch: string | null;
}

export interface ElementView {
  name: string;
  count: number;
  kind: ElementKind;
}

export interface StrengthView {
  /** 신강 / 신약 / 중화 */
  grade: string;
  score: number;
}

export interface DaeunView {
  startAge: number;
  direction: "순행" | "역행";
  list: { age: number; ganzhi: string; current: boolean }[];
}

export interface SeyunView {
  year: number;
  ganzhi: string;
  tenGodStem: string;
  tenGodBranch: string;
}

export type TopicKey = "love" | "marriage" | "money" | "success" | "health" | "study" | "general";

/** 자판기(주제)별 맞춤 분석 */
export interface TopicInsight {
  key: TopicKey;
  label: string; // 연애운 등
  emoji: string;
  /** 한 줄 요약 */
  headline: string;
  /** 주제별 핵심 포인트 (기본 3개, 프리미엄은 +α) */
  points: { title: string; body: string }[];
  /** 프리미엄만: 올해 세운·현재 대운 흐름 */
  timing: { title: string; body: string }[];
  /** 포토카드 해시태그 3개 */
  tags: string[];
  /** 포토카드 한 줄 문구 */
  quote: string;
  /** 부족한 오행을 채우는 행운 요소 (전통 오행 대응) */
  lucky: { element: string; color: string; hex: string; direction: string };
}

/** basic: 일반 자판기(원국·오행·신강신약) / full: 프리미엄(격국·용신·대운·세운 포함) */
export type ReportLevel = "basic" | "full";

/** 결과창에 그릴 리포트. ssaju 계산 결과에서 필요한 것만 추렸어요. */
export interface PremiumReportView {
  level: ReportLevel;
  pillars: PillarView[];
  elements: ElementView[];
  strength: StrengthView;
  /** 격국 (예: 인수격) */
  geukguk: string;
  /** 용신 (예: ["丙(병)", "癸(계)"]) */
  yongsin: string[];
  gilsin: string[];
  hyungsin: string[];
  daeun: DaeunView | null;
  seyun: SeyunView | null;
  /** 도리 한마디 아님! 계산 엔진이 만든 짧은 구조 설명 */
  summary: string;
  /** 태어난 시간을 몰라 시주를 비워 둔 경우 true. (신강·신약·용신은 정오 기준이라 달라질 수 있어요) */
  hourUnknown: boolean;
  /** 자판기(주제)별 맞춤 분석 */
  topic: TopicInsight;
}

export type PremiumErrorCode = "bad_request" | "rate_limited" | "failed";

export interface PremiumErrorBody {
  error: string;
  code: PremiumErrorCode;
}
