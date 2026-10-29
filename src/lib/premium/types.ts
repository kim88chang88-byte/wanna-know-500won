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
  /** '사주 vs 지금 내 현실' 3갈래 (주제에 맞는 한 가지) */
  reality?: RealityCheck;
  /** 부족한 오행을 채우는 행운 요소 (전통 오행 대응) */
  lucky: { element: string; color: string; hex: string; direction: string };
}

export interface BookSection {
  heading: string;
  body: string;
  /** 잠긴 풀이: body 는 서버에서 같은 길이의 의미 없는 글자로 바꿔 내려보내요. (화면에서만 가리는 게 아니에요) */
  locked?: boolean;
  /** 이용자가 '나와 비슷해요'를 눌러 확인해 볼 수 있는 문장들 (화면에서 체크 목록으로 보여줘요) */
  checks?: string[];
  /** '사주 vs 지금 내 현실' 3갈래 비교 (화면에서 세 버튼으로 보여줘요) */
  reality?: RealityCheck;
}
export interface RealityCheck {
  question: string;
  options: Array<{ label: string; message: string }>;
}
export interface BookRow {
  label: string;
  value: string;
  note?: string;
  /** 잠긴 칸: value/note 는 서버에서 가려서 내려보내요 */
  locked?: boolean;
  /** 표에서 눈에 띄게 (현재 대운, 포인트 달 등) */
  highlight?: boolean;
}
export interface BookTable {
  title: string;
  rows: BookRow[];
}
/** 나이(대운)별 기운 흐름 그래프의 한 점 */
export interface BookChartPoint {
  /** 시작 나이 (예: 29) */
  age: number;
  /** 구간 끝 나이 */
  endAge: number;
  /** 대운 간지 */
  ganzhi: string;
  /** 0~100 상대 지수 (실제 금액·확률이 아니에요) */
  value: number;
  /** 재물 그래프에서만: 이 시기가 끝날 때의 가상 누적 자산(만원). 재미로 보는 시나리오이고 실제 재산 예측이 아니에요. */
  amount?: number;
  current?: boolean;
  /** 가장 힘이 실리는 시기 순위(1, 2) */
  peak?: 1 | 2;
  locked?: boolean;
}
/** 나이별 재물·인연·일 흐름 그래프 */
export interface BookChart {
  /** "asset" 이면 세로축이 가상 누적 자산(만원), 아니면 0~100 지수 */
  mode?: "index" | "asset";
  title: string;
  caption: string;
  points: BookChartPoint[];
  callouts: Array<{ label: string; text: string }>;
}
/** 프리미엄 리포트의 한 페이지 */
export interface BookPage {
  no: number;
  key: string;
  title: string;
  subtitle: string;
  /** 페이지 맨 위 한 줄 요약 */
  lead: string;
  /** AI 가 덧붙이는 "도리의 한 줄" (없을 수 있어요) */
  note?: string;
  /** 고민을 적은 이용자에게 AI 가 쓰는 맞춤 조언 한 문단 (마지막 쪽) */
  advice?: string;
  /** '이 풀이의 근거 보기'에 접어서 보여주는 계산 근거 */
  evidence?: BookRow[];
  sections: BookSection[];
  tables: BookTable[];
  /** 나이별 기운 흐름 그래프 (재물·연애·직업 장) */
  chart?: BookChart;
}

/** basic: 일반 자판기(원국·오행·신강신약) / full: 프리미엄(격국·용신·대운·세운 포함) */
export interface ConcernAnswer {
  id: string;
  emoji: string;
  title: string;
  body: string;
}

/** 손님이 적은 "요즘 고민"과 도리의 답 */
export interface ConcernView {
  /** 직접 적은 글(정리된 상태). 풀이에는 쓰지 않고 그대로 보여 줘요. */
  text: string;
  answers: ConcernAnswer[];
}

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
  /** 요즘 고민을 적었으면 그에 대한 답. 안 적었으면 null */
  concern: ConcernView | null;
  /** true 면 일부 풀이가 잠겨 있어요(서버에서 가려서 내려보냄). 프리미엄 결제 전 미리 보기용 */
  locked: boolean;
  /** 프리미엄(full)만: 10페이지 상세 리포트. basic 은 빈 배열 */
  book: BookPage[];
  /** 궁합 리포트에서 상대방 정보를 받았을 때만 채워져요. 아니면 null */
  compat: CompatView | null;
  /** 연애·결혼운 쪽에 붙는 상상 속 인연 이미지(AI). 글과 따로 받아서 끼워 넣어요. 없으면 안 보여요 */
  partnerImage?: PartnerImageView | null;
}

export interface PartnerImageView {
  /** 이미지 주소. 이미지를 못 만들었으면 null (프로필만 보여요) */
  src: string | null;
  notice: string;
  alt: string;
  /** "<닉네임> 님의 미래 운명의 짝" */
  title: string;
  /** 직업·외모·성격·특징 */
  profile: Array<{ label: string; tags: string[] }>;
}

/** 두 사람 궁합 결과 (궁합 리포트에서만 채워져요) */
export interface CompatPerson {
  /** "나" / "상대" */
  label: string;
  /** 일주 한자 (예: 庚午). 없으면 null */
  dayPillar: string | null;
  /** 일주 한글 읽기 (예: 경오) */
  dayReading: string | null;
  /** 오행 분포 */
  elements: ElementView[];
  /** 태어난 시간을 몰라 시주를 뺀 경우 true */
  hourUnknown: boolean;
}

export interface CompatPoint {
  title: string;
  body: string;
  /** good: 잘 맞는 점, tip: 맞춰 가면 좋은 점 */
  tone: "good" | "tip";
}

export interface CompatView {
  /** 재미로 보는 참고 지수 (55~96) */
  score: number;
  headline: string;
  me: CompatPerson;
  partner: CompatPerson;
  points: CompatPoint[];
  /** 마무리 한마디 */
  closing: string;
}

export type PremiumErrorCode = "bad_request" | "rate_limited" | "failed";

export interface PremiumErrorBody {
  error: string;
  code: PremiumErrorCode;
}
