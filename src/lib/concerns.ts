/**
 * "요즘 고민" 질문지의 추천 버튼과 입력 검사입니다. 화면·서버가 같은 규칙을 써요.
 * 고민 문장은 풀이를 더 내 얘기처럼 만들기 위한 참고용이고, 서버에 저장하지 않아요.
 */

export type ConcernId =
  | "crush" | "relationship" | "breakup" | "marriage"
  | "job" | "workpeople" | "career"
  | "money" | "burnout" | "selfesteem"
  | "exam" | "friends"
  // 재물
  | "spending" | "saving" | "income" | "stable" | "independence" | "moneyrel"
  // 성공·직장
  | "promotion" | "startup" | "skill" | "jobsearch"
  // 연애
  | "meet" | "express" | "pattern" | "doubt"
  // 결혼
  | "partner" | "family" | "prep" | "single" | "kids"
  // 건강(컨디션·마음)
  | "sleep" | "stress" | "routine" | "loneliness" | "habit"
  // 학업
  | "studyfocus" | "slump" | "major" | "abroad" | "pace" | "motivation";

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
  // ── 재물
  { id: "spending", label: "새는 돈·충동 소비가 고민", emoji: "🧾", topic: "money" },
  { id: "saving", label: "목돈 만들기·내 집 마련 준비", emoji: "🏠", topic: "money" },
  { id: "income", label: "수입 늘리기·부업 고민", emoji: "💼", topic: "money" },
  { id: "stable", label: "월급·수입이 불안정해서 불안", emoji: "🌧️", topic: "money" },
  { id: "independence", label: "경제적 독립·내 몫 만들기", emoji: "🌱", topic: "money" },
  { id: "moneyrel", label: "돈 문제로 생기는 관계 고민", emoji: "🪢", topic: "money" },
  // ── 성공·직장
  { id: "promotion", label: "승진·평가·인정받고 싶어요", emoji: "🏅", topic: "success" },
  { id: "startup", label: "창업·독립해서 일하기 고민", emoji: "🚀", topic: "success" },
  { id: "skill", label: "성장이 정체된 느낌", emoji: "🪜", topic: "success" },
  { id: "jobsearch", label: "취업·이직 준비가 막막해요", emoji: "🗺️", topic: "success" },
  // ── 연애
  { id: "meet", label: "새로운 인연을 만나고 싶어요", emoji: "✨", topic: "love" },
  { id: "express", label: "내 마음 표현이 서툴러요", emoji: "💌", topic: "love" },
  { id: "pattern", label: "비슷한 연애가 반복돼요", emoji: "🔁", topic: "love" },
  { id: "doubt", label: "상대 마음을 모르겠어요", emoji: "🔍", topic: "love" },
  // ── 결혼
  { id: "partner", label: "이 사람과 결혼해도 될까", emoji: "🕊️", topic: "marriage" },
  { id: "family", label: "상견례·양가 관계 걱정", emoji: "🏡", topic: "marriage" },
  { id: "prep", label: "결혼 준비·살림 걱정", emoji: "📋", topic: "marriage" },
  { id: "single", label: "결혼 vs 혼자 사는 삶 고민", emoji: "🌙", topic: "marriage" },
  { id: "kids", label: "아이 계획·육아 고민", emoji: "🍼", topic: "marriage" },
  // ── 건강(컨디션·마음)
  { id: "sleep", label: "잠·피로·컨디션 관리", emoji: "😴", topic: "health" },
  { id: "stress", label: "스트레스를 풀고 싶어요", emoji: "🌊", topic: "health" },
  { id: "routine", label: "생활 리듬이 무너졌어요", emoji: "⏰", topic: "health" },
  { id: "loneliness", label: "외로움·공허한 마음", emoji: "🍃", topic: "health" },
  { id: "habit", label: "운동·식습관 바꾸기", emoji: "🥗", topic: "health" },
  // ── 학업
  { id: "studyfocus", label: "공부 집중이 안 돼요", emoji: "🎯", topic: "study" },
  { id: "slump", label: "성적이 정체된 느낌", emoji: "📉", topic: "study" },
  { id: "major", label: "전공·진로 선택 고민", emoji: "🎓", topic: "study" },
  { id: "abroad", label: "유학·편입·대학원 고민", emoji: "✈️", topic: "study" },
  { id: "pace", label: "공부와 일·생활 병행이 힘들어요", emoji: "⚖️", topic: "study" },
  { id: "motivation", label: "의욕이 안 나요", emoji: "🪫", topic: "study" },
];

/** 풀이 종류(자판기·프리미엄 카드)마다 보여 줄 고민 항목. 이미 고른 종류와 상관없는 항목은 다시 보여주지 않아요. */
const CHIPS_BY_KIND: Array<{ match: string; ids: ConcernId[] }> = [
  // 더 구체적인 이름을 먼저 확인해요. (예: '재물·직장 리포트'가 '재물운'보다 먼저)
  { match: "궁합", ids: ["relationship", "crush", "marriage", "partner", "doubt", "breakup", "friends"] },
  { match: "연애 결혼", ids: ["crush", "meet", "relationship", "marriage", "partner", "breakup", "prep"] },
  { match: "성공 재물", ids: ["job", "career", "promotion", "money", "income", "spending", "stable"] },
  // (예전 이름도 계속 알아봐요)
  { match: "연애 매력", ids: ["crush", "meet", "relationship", "marriage", "partner", "breakup", "prep"] },
  { match: "재물·직장", ids: ["job", "career", "promotion", "money", "income", "spending", "stable"] },
  { match: "성공", ids: ["job", "workpeople", "career", "promotion", "startup", "skill", "jobsearch"] },
  { match: "재물", ids: ["money", "spending", "saving", "income", "stable", "independence", "moneyrel"] },
  { match: "연애", ids: ["crush", "relationship", "breakup", "meet", "express", "pattern", "doubt"] },
  { match: "결혼", ids: ["marriage", "partner", "relationship", "family", "prep", "single", "kids"] },
  { match: "건강", ids: ["burnout", "selfesteem", "sleep", "stress", "routine", "loneliness", "habit"] },
  { match: "학업", ids: ["exam", "studyfocus", "slump", "major", "abroad", "pace", "motivation"] },
];

/** 고른 풀이 이름(예: "성공운")에 맞는 고민 항목만 돌려줘요. 알 수 없는 이름이면 전체를 돌려줘요. */
export function chipsForFortune(fortune: string): readonly ConcernChip[] {
  const hit = CHIPS_BY_KIND.find((k) => fortune.includes(k.match));
  if (!hit) return CONCERN_CHIPS;
  return hit.ids.map((id) => CONCERN_CHIPS.find((c) => c.id === id)!);
}

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
