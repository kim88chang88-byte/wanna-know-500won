import { josa } from "./josa";
import type { CompatPerson, CompatView } from "./types";

/*
 * 궁합 결과 맨 앞의 "도리의 답"과 오행 비교 한 줄 해석.
 * AI 를 부르지 않고 계산된 점수·팁만 엮어요. 결혼·연애를 "해도 된다/안 된다"로 단정하지 않아요.
 */

const FRAME: Record<string, string> = {
  결혼: "오래 함께할 사이로 보면",
  연인: "연인으로 보면",
  썸: "지금 알아 가는 사이로 보면",
  친구: "친구로 보면",
};

export interface CompatAnswer {
  /** 고민에서 관계 종류를 읽었는지 (못 읽으면 일반 문구) */
  hasRelation: boolean;
  body: string;
}

export function buildCompatAnswer(c: CompatView): CompatAnswer | null {
  const scores = c.scores ?? [];
  if (scores.length < 2) return null;
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const frame = (c.relation && FRAME[c.relation]) || "두 사람을 보면";
  const tips = c.tips ?? [];
  const tip = tips.find((t) => /마음 쓰면 좋은 점/.test(t.title)) ?? tips[0];
  const lines = [
    `${frame} 가장 든든한 곳은 ‘${best.label}’(${best.score}점)이에요. 반대로 ‘${worst.label}’(${worst.score}점)은 조금 더 맞춰 가면 좋아요.`,
    ...(tip ? [`이번 주엔 이렇게 해 보세요. ${tip.body}`] : []),
  ];
  return { hasRelation: Boolean(c.relation && FRAME[c.relation]), body: lines.join("\n\n") };
}

/** 두 사람 오행 막대 아래에 붙이는 한두 문장 해석 */
export function elementNote(me: CompatPerson, partner: CompatPerson, partnerName: string): string {
  const parts: string[] = [];
  const bothEmpty = me.elements.filter((e, i) => e.kind !== "unknown" && e.count === 0 && (partner.elements[i]?.count ?? 0) === 0);
  if (bothEmpty.length > 0) {
    const names = bothEmpty.map((e) => e.name).join("·");
    parts.push(`${josa(names, "은/는")} 둘 다 0이라, 함께 채워 주면 좋은 기운이에요.`);
  }
  let gapIdx = -1;
  let gap = 1;
  me.elements.forEach((e, i) => {
    if (e.kind === "unknown") return;
    const d = Math.abs(e.count - (partner.elements[i]?.count ?? 0));
    if (d > gap) {
      gap = d;
      gapIdx = i;
    }
  });
  if (gapIdx >= 0) {
    const e = me.elements[gapIdx];
    const o = partner.elements[gapIdx].count;
    parts.push(`${josa(e.name, "은/는")} 나 ${e.count}, ${partnerName} ${o}로 가장 차이가 커요. ${e.count > o ? "내가 앞서 이끌고 상대가 받쳐 주는" : "상대가 앞서 이끌고 내가 받쳐 주는"} 모습이 되기 쉬워요.`);
  }
  if (parts.length === 0) parts.push("두 사람의 오행이 비슷하게 어우러져요. 서로의 결이 닮아서 편안한 사이예요.");
  return parts.join(" ");
}

/* ------------------------------------------------------------------ 둘이 같이 해 보기 */

const QUESTION_BY_LABEL: Record<string, string> = {
  "마음의 거리": "요즘 서로에게 가장 고마웠던 순간은 언제였어요?",
  "대화와 소통": "내가 말하는 방식 중에 이렇게 바뀌면 좋겠다 싶은 게 있어요?",
  "생활 리듬": "하루 중 가장 편한 시간대는 언제예요? 같이 맞출 수 있는 시간이 있을까요?",
  "서로에게 주는 힘": "내가 어떻게 해 주면 가장 힘이 돼요?",
};

const QUESTIONS_BY_RELATION: Record<string, string[]> = {
  결혼: ["오래 함께한다면 우리가 꼭 지키고 싶은 일상의 약속은 뭐예요?", "돈과 시간을 어떻게 쓰고 싶은지, 서로 편한 때에 이야기해 볼까요?"],
  연인: ["우리 둘이 같이 해 보고 싶은 게 있다면 뭐예요?", "서운했는데 말 못 한 게 있다면, 오늘 가볍게 꺼내 볼까요?"],
  썸: ["요즘 어떤 얘기를 할 때 가장 즐거워요?", "다음에 같이 가 보고 싶은 곳이 있어요?"],
  친구: ["우리 사이에서 가장 마음에 드는 점은 뭐예요?", "앞으로 같이 해 보고 싶은 게 있어요?"],
};
const QUESTIONS_DEFAULT = ["우리 둘이 가장 잘 통한다고 느낄 때는 언제예요?", "서로에게 바라는 작은 한 가지가 있다면 뭐예요?"];

const ACTION_BY_LABEL: Record<string, string> = {
  "마음의 거리": "오늘 하루 중 고마웠던 일을 한 가지만 말로 전해 보세요.",
  "대화와 소통": "이번 주엔 하루에 한 번, 상대의 말이 끝날 때까지 끼어들지 않고 들어 보세요.",
  "생활 리듬": "이번 주에 둘이 편한 시간을 하나 정해 함께 보내 보세요. 짧아도 괜찮아요.",
  "서로에게 주는 힘": "이번 주엔 상대가 힘들어 보일 때 조언 대신 ‘많이 힘들었겠다’는 말을 먼저 건네 보세요.",
};
const ACTION_DEFAULT = "이번 주엔 서로에게 고마운 점을 한 가지씩 말해 보세요.";

export interface Together {
  questions: string[];
  action: string;
}

/** 둘이 같이 해 볼 질문 3개와 이번 주 작은 행동 하나. 가장 맞춰 갈 항목에 맞춰 골라요. */
export function buildTogether(c: CompatView): Together {
  const worst = [...(c.scores ?? [])].sort((a, b) => a.score - b.score)[0]?.label;
  const first = (worst && QUESTION_BY_LABEL[worst]) || null;
  const rel = (c.relation && QUESTIONS_BY_RELATION[c.relation]) || QUESTIONS_DEFAULT;
  const questions = [...(first ? [first] : []), ...rel].slice(0, 3);
  while (questions.length < 3) questions.push(QUESTIONS_DEFAULT[questions.length % 2]);
  return { questions, action: (worst && ACTION_BY_LABEL[worst]) || ACTION_DEFAULT };
}

/** 상대에게 보낼 한 장 요약 글 (생년월일 같은 개인 정보는 담지 않아요) */
export function buildShareSummary(c: CompatView, names: { me?: string | null; partner?: string | null }, together: Together, url: string): string {
  const me = names.me?.trim() ? `${names.me.trim()}님` : "나";
  const pa = names.partner?.trim() ? `${names.partner.trim()}님` : "너";
  const best = [...(c.scores ?? [])].sort((a, b) => b.score - a.score)[0];
  return [
    `💞 ${josa(me, "과/와")} ${pa}의 궁합 ${c.score}점`,
    `“${c.headline}”`,
    ...(best ? [`가장 든든한 곳은 ‘${best.label}’(${best.score}점)이래요.`] : []),
    "",
    "도리가 알려 준 우리 둘의 질문 3개:",
    ...together.questions.map((q, i) => `${i + 1}. ${q}`),
    "",
    `너도 무료로 볼 수 있어요 👉 ${url}`,
  ].join("\n");
}

/* ------------------------------------------------------------------ 풀이 제목을 쉬운 말로 */

const GOD_FEEL: Record<string, string> = {
  비견: "대등한 친구 같은 느낌",
  겁재: "승부욕 있는 라이벌 같은 느낌",
  식신: "함께 있으면 여유로운 느낌",
  상관: "솔직하고 재치 있는 느낌",
  편재: "새로운 경험을 함께하는 느낌",
  정재: "차분히 아끼고 챙기는 느낌",
  편관: "설렘과 긴장이 함께 있는 느낌",
  정관: "믿음직하고 반듯한 느낌",
  편인: "개성 있고 자극이 되는 느낌",
  정인: "포근하게 기대는 느낌",
};
const EL_PLAIN: Record<string, string> = { 목: "나무", 화: "불", 토: "땅", 금: "쇠", 수: "물" };
const REL_VERB: Record<string, string> = { 합: "서로 끌어당겨요", 충: "서로 부딪혀요", 해: "살짝 엇갈려요" };
const SEAT: Record<string, string> = { 일지: "마음이 가장 가까운 자리", 월지: "생활 방식이 만나는 자리", 연지: "띠 자리(주변·가족)" };

/** 풀이 제목의 사주 용어를 일상 말로 바꿔요. 모르는 제목은 그대로 둬요. (화면에서만 바꿔서 예전에 저장된 풀이에도 적용돼요) */
export function plainPointTitle(title: string): string {
  let m = title.match(/^(내가 보는 상대|상대가 보는 나) · (.+)의 기운$/);
  if (m && GOD_FEEL[m[2]]) return `${m[1]} · ${GOD_FEEL[m[2]]}`;
  m = title.match(/^(일지|월지|연지) · .+ · (합|충|해)$/);
  if (m) return `${SEAT[m[1]]}: ${REL_VERB[m[2]]}`;
  m = title.match(/^오행 보완 · (.+)$/);
  if (m) return `빈 ${EL_PLAIN[m[1]] ?? m[1]} 기운을 채워 줘요`;
  if (title === "일간의 합 · 끌림") return "처음부터 마음이 끌리는 사이";
  if (title === "일간의 충 · 자극") return "솔직하게 부딪히며 자극이 되는 사이";
  return title;
}
