/**
 * AI 풀이의 "모양"을 정하는 파일입니다. (JSON 구조, 검사, 무료/유료 공개 범위, 주제 분류)
 * 네트워크 호출 없이 테스트할 수 있도록 interpret.ts 와 분리했어요.
 */

export type ReadingTopic = "general" | "success" | "money" | "love" | "marriage" | "health" | "study";

export const TOPIC_LABEL: Record<ReadingTopic, string> = {
  general: "오늘의 운",
  success: "성공운",
  money: "재물운",
  love: "연애운",
  marriage: "결혼운",
  health: "건강운",
  study: "학업운",
};

/** "연애운 슬롯", "재물운 자판기" 같은 화면 문구에서 주제를 골라요. 모르면 general. */
export function normalizeTopic(raw: unknown): ReadingTopic {
  if (typeof raw !== "string") return "general";
  const found = (Object.entries(TOPIC_LABEL) as Array<[ReadingTopic, string]>).find(
    ([key, label]) => key !== "general" && raw.includes(label),
  );
  return found ? found[0] : "general";
}

export interface Indicator {
  /** 1~5 */
  score: number;
  comment: string;
}

export interface Reading {
  /** 오늘의 운 키워드 (짧게) */
  keyword: string;
  total: { score: number; summary: string };
  love: Indicator;
  money: Indicator;
  mind: Indicator;
  /** 도리(수달 도사)의 한마디 (응원 메시지) */
  kkotgeoji: string;
  /** "도리가 본 이유": 이 풀이가 나온 사주 근거를 쉬운 말로 한두 문장. 없을 수도 있어요. */
  reason?: string;
}

const MAX = { keyword: 20, summary: 120, comment: 160, kkotgeoji: 300, reason: 200 } as const;

const indicatorSchema = (what: string) => ({
  type: "object",
  properties: {
    score: { type: "integer", description: `${what} 점수. 1~5 사이 정수 (보통 3~5, 아주 낮은 점수는 쓰지 않기)` },
    comment: { type: "string", description: `${what}에 대한 1~2문장. ${MAX.comment}자 이내` },
  },
  required: ["score", "comment"],
  additionalProperties: false,
});

/** Claude 구조화 출력(output_config.format)에 넘기는 스키마. 이 API 는 min/max 키워드를 못 써서 범위는 설명+parseReading 으로 지켜요. */
export const READING_SCHEMA = {
  type: "object",
  properties: {
    keyword: { type: "string", description: `오늘의 운 키워드. ${MAX.keyword}자 이내 (예: "설렘 충전")` },
    total: {
      type: "object",
      properties: {
        score: { type: "integer", description: "총운 점수. 1~5 사이 정수" },
        summary: { type: "string", description: `총운 한 줄 요약. ${MAX.summary}자 이내` },
      },
      required: ["score", "summary"],
      additionalProperties: false,
    },
    love: indicatorSchema("연애운"),
    money: indicatorSchema("금전운"),
    mind: indicatorSchema("마음운"),
    kkotgeoji: { type: "string", description: "도리의 응원 한마디. 2~3문장, 120자 안팎으로 짧게 (결과지 카드에 들어가야 해요)" },
    reason: { type: "string", description: `도리가 본 이유. 이 풀이의 사주 근거(합·충·세운·월운·숨은 기운 중 입력에 실제로 있는 것)를 쉬운 말로 풀어 1~2문장, 100자 안팎. ${MAX.reason}자 이내. 근거가 없으면 빈 문자열` },
  },
  required: ["keyword", "total", "love", "money", "mind", "kkotgeoji", "reason"],
  additionalProperties: false,
} as const;

/** 겁주거나 불안을 키우는 표현이 섞이면 걸러냅니다. (BRIEF: 무섭거나 모호한 예언 금지) */
const FORBIDDEN = ["사망", "죽음", "재앙", "저주", "액운", "파산", "이혼", "불행", "흉운", "큰일 난", "조심하세요"];

/** 누구에게나 맞는 뻔한 문장. 이런 말만 있으면 성의 없는 풀이라서 다시 받아요. */
const GENERIC = ["좋은 하루 될 거야", "좋은 하루 보내", "좋은 일이 있을 거", "마음 편히 가져", "모든 게 잘 될 거", "행복한 하루"];

export function isGeneric(text: string): boolean {
  return GENERIC.some((g) => text.includes(g));
}

export function containsForbidden(text: string): string | null {
  return FORBIDDEN.find((w) => text.includes(w)) ?? null;
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 0 && s.length <= max ? s : null;
}

function score(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
}

function indicator(v: unknown): Indicator | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  const s = score(o.score);
  const c = str(o.comment, MAX.comment);
  return s !== null && c !== null ? { score: s, comment: c } : null;
}

/** 모델이 돌려준 값이 약속한 모양인지 꼼꼼히 확인해요. 하나라도 어긋나거나 금지 표현이 있으면 null. */
export function parseReading(value: unknown): Reading | null {
  if (typeof value !== "object" || value === null) return null;
  const o = value as Record<string, unknown>;
  const total = o.total as Record<string, unknown> | undefined;
  if (typeof total !== "object" || total === null) return null;

  const keyword = str(o.keyword, MAX.keyword);
  const totalScore = score(total.score);
  const summary = str(total.summary, MAX.summary);
  const love = indicator(o.love);
  const money = indicator(o.money);
  const mind = indicator(o.mind);
  const kkotgeoji = str(o.kkotgeoji, MAX.kkotgeoji);
  if (!keyword || totalScore === null || !summary || !love || !money || !mind || !kkotgeoji) return null;

  // 네 점수가 전부 같으면 성의 없는 풀이라서 다시 받아요. (프롬프트에서 지표마다 다르게 달라고 했어요)
  if (new Set([totalScore, love.score, money.score, mind.score]).size === 1) return null;

  // 도리 한마디가 너무 짧거나 뻔한 말뿐이면 다시 받아요.
  if (kkotgeoji.length < 20 || isGeneric(kkotgeoji)) return null;

  const reason = str(o.reason, MAX.reason);
  const reading: Reading = { keyword, total: { score: totalScore, summary }, love, money, mind, kkotgeoji, ...(reason && reason.length >= 20 && !isGeneric(reason) ? { reason } : {}) };
  const allText = [keyword, summary, love.comment, money.comment, mind.comment, kkotgeoji, reason ?? ""].join(" ");
  return containsForbidden(allText) ? null : reading;
}

/* ------------------------------------------------------------------ 무료/유료 공개 범위 */

export type ReadingTier = "free";

export interface PublicIndicator {
  key: "love" | "money" | "mind";
  label: string;
  score: number;
  /** 잠겨 있으면 null. 화면에서 흐리게 가리는 게 아니라 아예 내려보내지 않아요. */
  comment: string | null;
  locked: boolean;
}

export interface DetailFolds {
  elements?: string;
  self?: string;
  praise?: string;
  lack?: string;
  improve?: string;
  lucky?: string;
}

export interface PublicReading {
  tier: ReadingTier;
  keyword: string;
  total: { score: number; summary: string };
  kkotgeoji: string;
  reason?: string;
  /** 길게 풀어 쓴 "요약하자면" 문단 (별도 AI 호출. 없을 수도 있어요) */
  story?: string;
  /** 접이식 풀이를 쭉 이어 쓴 글 (없을 수도 있어요) */
  folds?: DetailFolds;
  indicators: PublicIndicator[];
}

/**
 * 손님에게 내려보낼 내용을 고릅니다.
 * 무료: 키워드 + 총운 + 도리 한마디 + 세 지표의 점수. 세 지표의 풀이 문장은 서버에서 빼고 보내요.
 * (CSS 블러로만 가리면 개발자 도구로 그대로 보이기 때문에, 잠긴 내용은 응답에 아예 넣지 않습니다.)
 */
export function toPublicReading(r: Reading, tier: ReadingTier = "free", open = false): PublicReading {
  const indicators: PublicIndicator[] = [
    { key: "love", label: "연애운", score: r.love.score, comment: open ? r.love.comment : null, locked: !open },
    { key: "money", label: "금전운", score: r.money.score, comment: open ? r.money.comment : null, locked: !open },
    { key: "mind", label: "마음운", score: r.mind.score, comment: open ? r.mind.comment : null, locked: !open },
  ];
  return { tier, keyword: r.keyword, total: r.total, kkotgeoji: r.kkotgeoji, ...(r.reason ? { reason: r.reason } : {}), indicators };
}
