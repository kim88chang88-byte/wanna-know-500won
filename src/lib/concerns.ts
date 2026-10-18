/**
 * "요즘 고민" 질문지의 추천 버튼과 입력 검사입니다. 화면·서버가 같은 규칙을 써요.
 * 고민 문장은 풀이를 더 내 얘기처럼 만들기 위한 참고용이고, 서버에 저장하지 않아요.
 */

export type ConcernId =
  | "crush" | "relationship" | "breakup" | "marriage"
  | "job" | "workpeople" | "career"
  | "money" | "burnout" | "selfesteem"
  | "exam" | "friends";

export interface ConcernChip {
  id: ConcernId;
  label: string;
  emoji: string;
  /** 이 고민과 가장 가까운 풀이 주제(자판기 종류). 일반 자판기에서 주제를 못 정했을 때 참고해요. */
  topic: "love" | "marriage" | "money" | "success" | "health" | "study" | "general";
}

/** 2030 여성이 많이 하는 고민들 (복수 선택 가능) */
export const CONCERN_CHIPS: readonly ConcernChip[] = [
  { id: "crush", label: "썸·짝사랑이 어떻게 될지", emoji: "💭", topic: "love" },
  { id: "relationship", label: "지금 연애, 이 사람 괜찮을까", emoji: "💘", topic: "love" },
  { id: "breakup", label: "이별 후 재회·마음 정리", emoji: "🥀", topic: "love" },
  { id: "marriage", label: "결혼 시기·좋은 인연", emoji: "💍", topic: "marriage" },
  { id: "job", label: "이직·퇴사 타이밍", emoji: "🚪", topic: "success" },
  { id: "workpeople", label: "직장 인간관계 스트레스", emoji: "🧩", topic: "success" },
  { id: "career", label: "진로·커리어 방향", emoji: "🧭", topic: "success" },
  { id: "money", label: "돈 모으기·재테크 불안", emoji: "🪙", topic: "money" },
  { id: "burnout", label: "번아웃·무기력", emoji: "🔋", topic: "health" },
  { id: "selfesteem", label: "자존감·불안한 마음", emoji: "🫧", topic: "health" },
  { id: "exam", label: "시험·자격증·공부", emoji: "📖", topic: "study" },
  { id: "friends", label: "친구·가족과의 관계", emoji: "🤝", topic: "general" },
];

export const MAX_CONCERN_TAGS = 3;
export const MAX_CONCERN_TEXT = 200;

export interface Concern {
  tags: ConcernId[];
  text: string;
}

export const EMPTY_CONCERN: Concern = { tags: [], text: "" };

const IDS = new Set<string>(CONCERN_CHIPS.map((c) => c.id));

export function concernLabel(id: ConcernId): string {
  return CONCERN_CHIPS.find((c) => c.id === id)!.label;
}

/** 제어문자·여러 줄을 정리해요. (AI 프롬프트에 그대로 넣기 때문에 형태를 단순하게 만들어요) */
export function cleanConcernText(v: string): string {
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_CONCERN_TEXT);
}

/** 서버 입력 검사: 모르는 값은 버리고, 알 수 없는 모양이면 빈 고민으로 봐요. 고민은 선택 사항이라 실패시키지 않아요. */
export function parseConcern(raw: unknown): Concern {
  if (typeof raw !== "object" || raw === null) return EMPTY_CONCERN;
  const o = raw as Record<string, unknown>;
  const tags: ConcernId[] = [];
  if (Array.isArray(o.tags)) {
    for (const t of o.tags) {
      if (typeof t === "string" && IDS.has(t) && !tags.includes(t as ConcernId)) tags.push(t as ConcernId);
      if (tags.length >= MAX_CONCERN_TAGS) break;
    }
  }
  const text = typeof o.text === "string" ? cleanConcernText(o.text) : "";
  return { tags, text };
}

export function hasConcern(c: Concern | null | undefined): c is Concern {
  return !!c && (c.tags.length > 0 || c.text.length > 0);
}
