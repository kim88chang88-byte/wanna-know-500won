import { tenGodOf, type TenGod } from "@/lib/ai/dailyFacts";
import { BRANCHES, STEMS, type Element } from "@/lib/saju/constants";
import { josa } from "../josa";
import { groupOf, type Group } from "../topic";
import type { BookSection } from "../types";

/*
 * 전문가 풀이처럼 읽히게 하는 '규칙 기반' 해석 모음. (외부 호출 없이 표와 규칙만 써요)
 *  - 지장간(숨은 천간)과 십성 그룹 세기
 *  - 기둥 사이의 합·충·형·해·원진을 '자리' 기준으로 풀기 (연주-월주는 초년과 사회, 일주는 나와 배우자 자리 ...)
 *  - 세운·대운·월운이 원국과 만나는 합충 (올해/이번 달이 왜 이런지)
 *  - 조후(태어난 계절의 온도), 용신이 돕는 방식, 십성 조합, 배우자 별 읽기
 * 모든 문장은 "~기 쉬워요/~일 수 있어요"처럼 단정하지 않고, 겁주는 말은 쓰지 않아요.
 */

export type PosKey = "year" | "month" | "day" | "hour";
export const POS_LABEL: Record<PosKey, string> = { year: "연주", month: "월주", day: "일주", hour: "시주" };
const POS_ORDER: PosKey[] = ["year", "month", "day", "hour"];

/* ------------------------------------------------------------------ 지장간 */

/** 지지 속에 숨은 천간 (여기 → 중기 → 본기 순서, 마지막이 본기) */
export const HIDDEN_STEMS: Record<string, string[]> = {
  子: ["壬", "癸"],
  丑: ["癸", "辛", "己"],
  寅: ["戊", "丙", "甲"],
  卯: ["甲", "乙"],
  辰: ["乙", "癸", "戊"],
  巳: ["戊", "庚", "丙"],
  午: ["丙", "己", "丁"],
  未: ["丁", "乙", "己"],
  申: ["戊", "壬", "庚"],
  酉: ["庚", "辛"],
  戌: ["辛", "丁", "戊"],
  亥: ["戊", "甲", "壬"],
};

export function mainStemOf(branch: string): string {
  const list = HIDDEN_STEMS[branch];
  return list ? list[list.length - 1] : "";
}

export interface HiddenGod {
  stem: string;
  god: TenGod;
  group: Group;
  pos: PosKey;
}

function groupOfGod(god: TenGod): Group {
  return groupOf(god) ?? "비겁";
}

/** 모든 기둥 지지의 숨은 천간을 일간 기준 십성으로 바꿔요. */
export function hiddenGods(dayStem: string, pillars: Partial<Record<PosKey, string>>): HiddenGod[] {
  const out: HiddenGod[] = [];
  for (const pos of POS_ORDER) {
    const p = pillars[pos];
    if (!p || p.length < 2) continue;
    for (const stem of HIDDEN_STEMS[p[1]] ?? []) {
      const god = tenGodOf(dayStem, stem);
      out.push({ stem, god, group: groupOfGod(god), pos });
    }
  }
  return out;
}

export function hiddenGroupCount(list: HiddenGod[]): Record<Group, number> {
  const c: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  for (const h of list) c[h.group] += 1;
  return c;
}

/* ------------------------------------------------------------------ 지지 관계 */

export type RelType = "충" | "육합" | "반합" | "형" | "해" | "원진";

const CLASH: ReadonlyArray<[string, string]> = [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]];
const COMBINE6: ReadonlyArray<[string, string]> = [["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]];
const HARM: ReadonlyArray<[string, string]> = [["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]];
const WONJIN: ReadonlyArray<[string, string]> = [["子", "未"], ["丑", "午"], ["寅", "酉"], ["卯", "申"], ["辰", "亥"], ["巳", "戌"]];
const PUNISH: ReadonlyArray<[string, string]> = [["寅", "巳"], ["巳", "申"], ["寅", "申"], ["丑", "戌"], ["戌", "未"], ["丑", "未"], ["子", "卯"]];
const SELF_PUNISH = ["辰", "午", "酉", "亥"];
const TRIADS: ReadonlyArray<{ set: string[]; el: string }> = [
  { set: ["申", "子", "辰"], el: "수(水)" },
  { set: ["亥", "卯", "未"], el: "목(木)" },
  { set: ["寅", "午", "戌"], el: "화(火)" },
  { set: ["巳", "酉", "丑"], el: "금(金)" },
];

const has = (pairs: ReadonlyArray<[string, string]>, a: string, b: string) => pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export interface BranchRel {
  type: RelType;
  /** 반합일 때 만들어지는 기운 */
  element?: string;
}

/** 두 지지 사이의 관계들 (여러 개 겹칠 수 있어요) */
export function branchRels(a: string, b: string): BranchRel[] {
  const out: BranchRel[] = [];
  if (has(CLASH, a, b)) out.push({ type: "충" });
  if (has(COMBINE6, a, b)) out.push({ type: "육합" });
  if (a !== b) {
    const t = TRIADS.find((x) => x.set.includes(a) && x.set.includes(b));
    if (t) out.push({ type: "반합", element: t.el });
  }
  if (has(PUNISH, a, b) || (a === b && SELF_PUNISH.includes(a))) out.push({ type: "형" });
  if (has(HARM, a, b)) out.push({ type: "해" });
  if (has(WONJIN, a, b)) out.push({ type: "원진" });
  return out;
}

const STEM_COMBINE: ReadonlyArray<[string, string]> = [["甲", "己"], ["乙", "庚"], ["丙", "辛"], ["丁", "壬"], ["戊", "癸"]];
const STEM_CLASH: ReadonlyArray<[string, string]> = [["甲", "庚"], ["乙", "辛"], ["丙", "壬"], ["丁", "癸"]];
export const stemCombine = (a: string, b: string) => has(STEM_COMBINE, a, b);
export const stemClash = (a: string, b: string) => has(STEM_CLASH, a, b);

/* ------------------------------------------------------------------ 원국 안의 관계 (자리 기준) */

const PAIR_MEANING: Record<string, string> = {
  "year-month": "어린 시절의 환경(연주)과 사회로 나아가는 자리(월주)",
  "year-day": "뿌리와 첫인상(연주)과 나·배우자 자리(일주)",
  "year-hour": "뿌리(연주)와 꿈·말년 자리(시주)",
  "month-day": "사회·직업 자리(월주)와 나·배우자 자리(일주)",
  "month-hour": "사회·직업 자리(월주)와 꿈·말년 자리(시주)",
  "day-hour": "나·배우자 자리(일주)와 꿈·말년·자녀 자리(시주)",
};

const EFFECT: Record<RelType, (m: string, el?: string) => string> = {
  충: (m) => `${m} 사이에서 기운이 맞부딪혀요. 이 두 영역에서 이동·변화·환경 전환이 잦거나, 한쪽이 바뀌면 다른 쪽도 함께 흔들리기 쉬운 구조예요. 변화가 와도 '내가 정한 속도'를 지키면 오히려 전환점이 돼요.`,
  육합: (m) => `${m}이 서로 끌어당기며 어울려요. 이 두 영역이 서로 돕고 손발이 맞는 편이라, 한쪽에서 얻은 안정이 다른 쪽에도 힘이 돼요.`,
  반합: (m, el) => `${m}이 ${el ?? ""} 기운으로 뭉쳐요. 이 두 영역에 ${el ?? ""} 기운이 모여 힘이 커지고, 뜻이 맞는 사람을 만나면 시너지가 나요.`,
  형: (m) => `${m} 사이에서 서로를 날카롭게 자극해요. 긴장이나 압박으로 느껴질 수 있지만, 그만큼 단련되어 실력이 느는 구조이기도 해요.`,
  해: (m) => `${m} 사이에 속으로 서운함이 쌓이기 쉬운 기운이 있어요. 겉으론 괜찮아 보여도 마음이 어긋날 수 있어서, 확인하는 한마디가 관계를 편하게 해 줘요.`,
  원진: (m) => `${m} 사이에 이유 없는 거리감이나 미묘한 불편함이 생기기 쉬워요. 기대를 조금 낮추고 담백하게 대하면 편해져요.`,
};

const DAY_EXTRA: Record<RelType, string> = {
  충: "일지가 얽히면 가까운 사람과의 관계에서 거리 조절과 대화의 타이밍이 특히 중요해요.",
  육합: "일지가 어울리면 가까운 사람에게 정이 깊고, 안정적인 관계를 원하는 마음이 커요.",
  반합: "일지가 함께 뭉치면 가까운 관계에서 같은 방향을 바라볼 때 힘이 배가 돼요.",
  형: "일지가 얽히면 가까운 사이일수록 말과 행동의 날을 한 겹 다듬어 주면 좋아요.",
  해: "일지가 얽히면 가까운 사이에서 말하지 않은 서운함이 쌓이지 않게 가볍게 풀어 주는 것이 포인트예요.",
  원진: "일지가 얽히면 가까운 사이에서도 각자의 공간을 존중할수록 편해져요.",
};

const TYPE_ORDER: RelType[] = ["충", "육합", "반합", "형", "해", "원진"];

export interface NatalRelation {
  type: RelType;
  a: PosKey;
  b: PosKey;
  branches: string;
  element?: string;
  /** 일지가 포함되면 true */
  dayInvolved: boolean;
  heading: string;
  body: string;
}

export function natalRelations(pillars: Partial<Record<PosKey, string>>): NatalRelation[] {
  const out: NatalRelation[] = [];
  const keys = POS_ORDER.filter((k) => (pillars[k] ?? "").length >= 2);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i];
      const b = keys[j];
      const ba = (pillars[a] as string)[1];
      const bb = (pillars[b] as string)[1];
      const m = PAIR_MEANING[`${a}-${b}`] ?? `${POS_LABEL[a]}와 ${POS_LABEL[b]}`;
      for (const rel of branchRels(ba, bb)) {
        const dayInvolved = a === "day" || b === "day";
        out.push({
          type: rel.type,
          a,
          b,
          branches: `${ba}${bb}`,
          element: rel.element,
          dayInvolved,
          heading: `${rel.type} · ${POS_LABEL[a]}와 ${POS_LABEL[b]} (${ba}${bb}${rel.element ? ` → ${rel.element}` : ""})`,
          body: `${EFFECT[rel.type](m, rel.element)}${dayInvolved ? ` ${DAY_EXTRA[rel.type]}` : ""}`,
        });
      }
    }
  }
  return out.sort((x, y) => TYPE_ORDER.indexOf(x.type) - TYPE_ORDER.indexOf(y.type));
}

/* ------------------------------------------------------------------ 십성 자리 해석 */

export const PLACE_GROUP: Record<PosKey, Record<Group, string>> = {
  year: {
    비겁: "초년에 또래의 영향이 크고, 일찍부터 스스로 서는 법을 익힌 흔적이에요.",
    식상: "어린 시절 표현하고 배우는 환경이 열려 있었거나, 재능이 일찍 드러난 흔적이에요.",
    재성: "초년부터 현실과 살림, 돈의 감각을 일찍 접한 환경으로 읽혀요.",
    관성: "반듯한 가풍과 규칙, 책임을 중시하는 환경에서 자란 흔적이에요.",
    인성: "돌봄과 배움을 받는 환경, 어른들의 지지가 있었던 흔적이에요.",
  },
  month: {
    비겁: "사회에서 독립심과 주관이 먼저 드러나고, 동료·경쟁자와 어울리는 일이 많아요.",
    식상: "일터에서 아이디어와 표현력으로 인정받기 쉬워요.",
    재성: "일에서 실속과 성과를 챙기는 감각이 두드러져요.",
    관성: "조직과 규칙 안에서 책임을 맡고 신뢰를 쌓는 흐름이에요. 안정적인 직장이나 타이틀을 쉽게 놓지 못하는 이유이기도 해요.",
    인성: "배움과 자격, 윗사람의 도움이 일의 바탕이 돼요.",
  },
  day: {
    비겁: "가장 가까운 자리에 나와 같은 기운이 있어, 자기 기준이 분명하고 관계에서도 동등함을 원해요.",
    식상: "가까운 사람에게 속마음을 표현하고 싶은 욕구가 커요.",
    재성: "가까운 관계에서 현실적으로 챙기고 돌보는 면이 드러나요.",
    관성: "가까운 관계에서도 책임과 예의를 중시해요.",
    인성: "가까운 사람에게 안정감과 돌봄을 구하는 편이에요.",
  },
  hour: {
    비겁: "말년에 동료·친구와 힘을 나누는 흐름이고, 꿈을 스스로 이루려 해요.",
    식상: "꿈이 표현과 창작 쪽으로 열려 있고 말년에도 활동적이에요.",
    재성: "꿈을 현실의 결과로 만들려는 마음이 커요.",
    관성: "꿈이 책임과 역할 쪽으로 향하고, 인생 후반에 명예를 중시해요.",
    인성: "배움과 마음의 안식을 바라는 꿈, 안정된 말년이에요.",
  },
};

/** 일지(배우자 자리) 십성별 해석 */
export const PALACE_GROUP: Record<Group, string> = {
  비겁: "배우자 자리에 나와 같은 기운(비겁)이 앉아 있어요. 동등하고 서로 독립적인 관계를 좋아해요. 다만 비교나 경쟁심, 돈과 시간을 어떻게 나눌지에서 선을 긋는 대화가 도움이 돼요.",
  식상: "배우자 자리에 표현하는 기운(식상)이 앉아 있어요. 말이 잘 통하고 재미있는 관계를 원하고, 마음을 말로 풀어 주는 사람에게 끌려요.",
  재성: "배우자 자리에 현실을 챙기는 기운(재성)이 앉아 있어요. 가까운 사람을 실질적으로 돌보고, 생활을 함께 꾸려 가는 관계에 마음이 가요.",
  관성: "배우자 자리에 책임과 질서의 기운(관성)이 앉아 있어요. 믿음직하고 예의 바른 관계를 원하고, 약속을 지키는 사람에게 신뢰를 느껴요.",
  인성: "배우자 자리에 돌봄과 배움의 기운(인성)이 앉아 있어요. 편안하게 의지할 수 있는 안정형 관계를 원해요.",
};

/* ------------------------------------------------------------------ 오행 보조 */

const GENERATES: Record<Element, Element> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CONTROLS: Record<Element, Element> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
const EL_KO: Record<Element, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
const KO_EL: Record<string, Element> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };

function stemEl(stem: string): Element | null {
  return STEMS.find((s) => s.hanja === stem)?.element ?? null;
}

/** 일간 오행 기준으로 다른 오행이 어떤 그룹인지 */
export function groupOfElement(dayStem: string, elementKo: string): Group | null {
  const me = stemEl(dayStem);
  const el = KO_EL[elementKo];
  if (!me || !el) return null;
  if (me === el) return "비겁";
  if (GENERATES[me] === el) return "식상";
  if (CONTROLS[me] === el) return "재성";
  if (CONTROLS[el] === me) return "관성";
  return "인성";
}

/* ------------------------------------------------------------------ 조후 */

type Season = "봄" | "여름" | "가을" | "겨울";
const SEASON_OF: Record<string, Season> = { 寅: "봄", 卯: "봄", 辰: "봄", 巳: "여름", 午: "여름", 未: "여름", 申: "가을", 酉: "가을", 戌: "가을", 亥: "겨울", 子: "겨울", 丑: "겨울" };
const SEASON_EL: Record<Season, Element> = { 봄: "wood", 여름: "fire", 가을: "metal", 겨울: "water" };
const SEASON_TEMP: Record<Season, string> = {
  봄: "따뜻해지며 만물이 자라나는 계절이에요",
  여름: "뜨겁고 마르기 쉬운 계절이에요",
  가을: "서늘하고 건조해지는 계절이에요",
  겨울: "춥고 얼어붙기 쉬운 계절이에요",
};
const SEASON_NEED: Record<Season, string> = {
  봄: "따뜻함(화)과 촉촉함(수)이 균형을 이루면 좋아요",
  여름: "시원한 물(수)과 쉬어 가는 시간이 힘이 돼요",
  가을: "온기(화)와 윤기(수)를 더해 주면 편안해요",
  겨울: "따뜻한 온기(화)가 가장 큰 힘이 돼요",
};
const TOWARD_SEASON = {
  same: "계절의 기운이 나와 같은 편이라 힘을 얻는 상태예요(득령).",
  fed: "계절이 나를 생해 주는 편이라 든든하게 도움을 받아요(득령).",
  leak: "계절 쪽으로 내 힘이 흘러 나가는 편이라 에너지를 아껴 쓰는 게 좋아요.",
  control: "내가 계절을 이끌어야 하는 편이라 힘이 많이 들 수 있어요.",
  pressed: "계절의 기운이 나를 누르는 편이라 무리하지 않는 게 좋아요.",
};

export function johuSection(dayStem: string, monthBranch: string): BookSection | null {
  const season = SEASON_OF[monthBranch];
  const me = stemEl(dayStem);
  if (!season || !me) return null;
  const se = SEASON_EL[season];
  let rel: keyof typeof TOWARD_SEASON;
  if (me === se) rel = "same";
  else if (GENERATES[se] === me) rel = "fed";
  else if (GENERATES[me] === se) rel = "leak";
  else if (CONTROLS[me] === se) rel = "control";
  else rel = "pressed";
  const stemKo = STEMS.find((s) => s.hanja === dayStem)?.hangul ?? "";
  const earthNote = "辰戌丑未".includes(monthBranch) ? " 계절이 바뀌는 길목(토 기운이 강한 달)이라 흙의 안정감과 무게가 함께 작용해요." : "";
  return {
    heading: "조후 · 태어난 계절의 온도",
    body: `${monthBranch}월(${season})에 태어났어요. ${SEASON_TEMP[season]}.${earthNote} 일간 ${dayStem}(${stemKo}, ${EL_KO[me]})는 ${TOWARD_SEASON[rel]} 이 사주는 ${SEASON_NEED[season]}.`,
  };
}

/* ------------------------------------------------------------------ 용신이 돕는 방식 */

const ROLE: Record<Group, string> = {
  식상: "남는 힘을 표현·창작·운동으로 흘려보내는 길",
  재성: "힘을 현실의 성과와 실속으로 바꾸는 길",
  관성: "힘에 틀과 책임을 주어 단단하게 다듬는 길",
  인성: "배우고 쉬며 에너지를 충전하는 길 (넘치지 않게 가볍게)",
  비겁: "같은 편, 동료와 힘을 나누는 길",
};

export function yongsinRoleSection(dayStem: string, elementsKo: string[], gradeLabel: string): BookSection | null {
  const rows = elementsKo
    .map((el) => ({ el, g: groupOfElement(dayStem, el) }))
    .filter((r): r is { el: string; g: Group } => r.g !== null);
  if (rows.length === 0) return null;
  const list = rows.map((r) => `${josa(r.el, "은/는")} ${r.g}의 길 — ${ROLE[r.g]}`).join(" / ");
  return {
    heading: "용신, 어떤 방식으로 도와주나요?",
    body: `${list}. 용신은 한 가지 기준이 아니라 사주의 균형, 계절의 온도, 흐름을 함께 보고 고른 후보예요. ${gradeLabel} 사주이니 먼저 나온 기운을 중심에 두고, 나머지는 필요할 때 보조로 가볍게 써 보세요.`,
  };
}

/* ------------------------------------------------------------------ 십성 조합 */

const COMBOS: Array<{ title: string; test: (g: string[]) => boolean; body: string }> = [
  {
    title: "관인상생 — 책임이 배움으로 이어지는 구조",
    test: (g) => g.some((x) => x === "정관" || x === "편관") && g.some((x) => x === "정인" || x === "편인"),
    body: "책임과 규칙(관성)이 배움과 지원(인성)으로 이어지는 조합이에요. 조직 안에서 신뢰를 쌓고, 자격이나 전문성으로 인정받기 좋은 구조예요.",
  },
  {
    title: "식신생재 — 재능이 현실의 결과가 되는 구조",
    test: (g) => g.some((x) => x === "식신" || x === "상관") && g.some((x) => x === "정재" || x === "편재"),
    body: "표현과 재능(식상)이 돈과 성과(재성)로 이어지는 조합이에요. 좋아하는 일을 꾸준히 내놓을수록 수입과 평가로 돌아오기 쉬워요.",
  },
  {
    title: "상관견관 — 표현과 규칙이 부딪히는 구조",
    test: (g) => g.includes("상관") && g.includes("정관"),
    body: "솔직한 표현(상관)과 조직의 규칙(정관)이 마주치는 조합이에요. 하고 싶은 말을 부드럽게 고르면 오히려 존재감이 살아나요.",
  },
  {
    title: "관살혼잡 — 책임이 겹쳐 오는 구조",
    test: (g) => g.includes("정관") && g.includes("편관"),
    body: "정관과 편관이 함께 있어 해야 할 일과 기대가 겹치기 쉬워요. 우선순위를 3개 이하로 줄이면 한결 가벼워져요.",
  },
  {
    title: "비겁탈재 — 내 몫을 지키는 구조",
    test: (g) => g.filter((x) => x === "비견" || x === "겁재").length >= 2 && g.some((x) => x === "정재" || x === "편재"),
    body: "나와 같은 기운(비겁)이 많아 재물과 인연을 나누거나 비교하는 흐름이 생기기 쉬워요. 돈과 시간의 기준을 미리 정해 두면 편해요.",
  },
  {
    title: "인성 과다 — 생각이 깊은 구조",
    test: (g) => g.filter((x) => x === "정인" || x === "편인").length >= 3,
    body: "배움과 생각(인성)이 많아 깊이 있지만 시작이 늦어질 수 있어요. 70% 준비되면 일단 실행해 보세요.",
  },
];

export function comboSections(visibleGods: string[]): BookSection[] {
  return COMBOS.filter((c) => c.test(visibleGods)).slice(0, 3).map((c) => ({ heading: c.title, body: c.body }));
}

/* ------------------------------------------------------------------ 지장간 요약 */

export function hiddenSummary(list: HiddenGod[], group: Group): string | null {
  const hits = list.filter((h) => h.group === group);
  if (hits.length === 0) return null;
  const txt = hits.slice(0, 3).map((h) => `${POS_LABEL[h.pos]}의 ${h.stem}(${h.god})`).join(", ");
  return txt;
}

/* ------------------------------------------------------------------ 세운·대운·월운이 원국과 만날 때 */

export interface Incoming {
  /** 예: "2026년 세운", "지금 대운", "이번 달" */
  label: string;
  ganzhi: string;
}

export interface Interaction {
  text: string;
  /** 설명에서 강조할 종류 */
  kind: "충" | "합" | "형" | "해";
}

/** 한자 뒤에 조사를 붙일 때는 한글 읽기로 받침을 봐요. 예: 丙 + 이/가 → 丙(병)이 */
function hj(ch: string, kind: "이/가" | "과/와"): string {
  const ko = STEMS.find((x) => x.hanja === ch)?.hangul ?? BRANCHES.find((x) => x.hanja === ch)?.hangul ?? "";
  if (!ko) return ch;
  return `${ch}(${ko})${josa(ko, kind).slice(ko.length)}`;
}

const STEM_POS: PosKey[] = ["year", "month", "day", "hour"];

/** 들어오는 간지(세운·대운·월운)가 원국 천간·지지와 만드는 관계를 모아요. */
export function interactions(pillars: Partial<Record<PosKey, string>>, incoming: Incoming): Interaction[] {
  const out: Interaction[] = [];
  const g = incoming.ganzhi;
  if (g.length < 2) return out;
  const stem = g[0];
  const branch = g[1];
  for (const pos of STEM_POS) {
    const p = pillars[pos];
    if (!p || p.length < 2) continue;
    if (stemClash(stem, p[0])) out.push({ kind: "충", text: `${stem}${p[0]}충 — ${incoming.label} 천간 ${hj(stem, "이/가")} ${POS_LABEL[pos]} 천간 ${hj(p[0], "과/와")} 부딪혀요` });
    else if (stemCombine(stem, p[0])) out.push({ kind: "합", text: `${stem}${p[0]}합 — ${incoming.label} 천간 ${hj(stem, "이/가")} ${POS_LABEL[pos]} 천간 ${hj(p[0], "과/와")} 어울려요` });
    for (const rel of branchRels(branch, p[1])) {
      if (rel.type === "원진") continue;
      const kind: Interaction["kind"] = rel.type === "충" ? "충" : rel.type === "육합" || rel.type === "반합" ? "합" : rel.type === "형" ? "형" : "해";
      const name = rel.type === "반합" ? `${branch}${p[1]}반합→${rel.element ?? ""}` : `${branch}${p[1]}${rel.type}`;
      out.push({ kind, text: `${name} — ${incoming.label} 지지 ${hj(branch, "이/가")} ${POS_LABEL[pos]} 지지 ${hj(p[1], "과/와")} 만나요` });
    }
  }
  return out;
}

const AREA: Record<PosKey, string> = { year: "초년·뿌리", month: "일·사회", day: "가까운 관계", hour: "꿈·앞날" };

/** 관계가 어느 영역을 흔드는지 한 문장으로. 단정하지 않아요. */
export function interactionLine(pillars: Partial<Record<PosKey, string>>, incoming: Incoming): string | null {
  const list = interactions(pillars, incoming);
  if (list.length === 0) return null;
  const areas = new Set<string>();
  for (const pos of STEM_POS) {
    const p = pillars[pos];
    if (!p) continue;
    const g = incoming.ganzhi;
    if (stemClash(g[0], p[0]) || stemCombine(g[0], p[0]) || branchRels(g[1], p[1]).some((r) => r.type !== "원진")) areas.add(AREA[pos]);
  }
  const head = list.slice(0, 3).map((x) => x.text).join("; ");
  const hasClash = list.some((x) => x.kind === "충");
  const hasCombine = list.some((x) => x.kind === "합");
  const tone = hasClash && hasCombine ? "끌림과 긴장이 함께 와서 마음이 바빠지기 쉬운 흐름이에요" : hasClash ? "변화와 부딪힘이 생기기 쉬워 속도 조절이 도움이 되는 흐름이에요" : hasCombine ? "서로 어울려 판이 커지기 쉬운 흐름이에요" : "미묘한 긴장이 오가는 흐름이에요";
  return `${head}. 특히 ${[...areas].join(", ")} 영역에서 ${tone}.`;
}

/* ------------------------------------------------------------------ 세운·월운 십성 한 줄 (월별 흐름 변주) */

export const GOD_MONTH_LINE: Record<string, string> = {
  비견: "내 페이스를 지키기 좋은 달. 동료와 호흡이 맞아요.",
  겁재: "경쟁심과 활기가 함께 오는 달. 지출은 한 번 더 생각해요.",
  식신: "여유와 표현이 풀리는 달. 취미나 맛있는 것으로 충전해요.",
  상관: "재치와 끼가 반짝이는 달. 말은 부드럽게 고르면 좋아요.",
  편재: "움직일수록 기회가 보이는 달. 사람을 만나 보세요.",
  정재: "차곡차곡 챙기는 일이 잘 맞는 달. 지출 정리에 좋아요.",
  편관: "긴장과 책임이 오는 달. 할 일을 하나씩 끝내면 뿌듯해요.",
  정관: "규칙과 약속이 중요한 달. 신뢰를 쌓기 좋아요.",
  편인: "혼자 생각을 정리하기 좋은 달. 새로운 관점을 얻어요.",
  정인: "배우고 쉬며 채우는 달. 안쪽이 단단해져요.",
};

export const GOD_PAST_YEAR: Record<string, string> = {
  비견: "내 방식을 지키며 또래·동료와 비교하거나 협력할 일이 늘었을 수 있어요.",
  겁재: "경쟁이나 나눔, 돈과 시간을 쓰는 일이 늘었을 수 있어요.",
  식신: "여유롭게 즐기거나 배우고 표현할 일이 늘었을 수 있어요.",
  상관: "하고 싶은 말을 꺼내거나 새로운 시도를 하고 싶어진 일이 있었을 수 있어요.",
  편재: "사람을 만나고 돈이 움직이는 일, 새로운 활동이 늘었을 수 있어요.",
  정재: "꾸준히 모으거나 현실적인 계획을 세운 일이 있었을 수 있어요.",
  편관: "책임이나 압박, 시험대에 오르는 일을 겪었을 수 있어요.",
  정관: "직책이나 약속, 평가와 관련된 일이 부각됐을 수 있어요.",
  편인: "혼자 깊이 생각하거나 새로운 분야에 빠져든 일이 있었을 수 있어요.",
  정인: "공부, 자격, 이사, 마음의 안식처 같은 '준비하고 쉬어 가는' 주제가 있었을 수 있어요.",
};

/* ------------------------------------------------------------------ 배우자 별 읽기 (연애 심층용) */

export interface LoveInput {
  dayStem: string;
  /** "남" | "여" */
  gender: string;
  pillars: Partial<Record<PosKey, string>>;
  /** 일지 십성(본기 기준) 이름 */
  dayBranchGod: string | undefined;
  year: number;
  seyun: string | null;
  seyunNext: string | null;
  daeunNow: { ganzhi: string; startAge: number; endAge: number } | null;
  daeunNext: { ganzhi: string; startAge: number } | null;
}

function partnerGroup(gender: string): Group {
  return gender === "여" ? "관성" : "재성";
}

function visiblePartnerGods(i: LoveInput): string[] {
  const pg = partnerGroup(i.gender);
  const out: string[] = [];
  for (const pos of POS_ORDER) {
    const p = i.pillars[pos];
    if (!p || p.length < 2) continue;
    if (pos !== "day") {
      const g = tenGodOf(i.dayStem, p[0]);
      if (groupOf(g) === pg) out.push(g);
    }
    const bg = tenGodOf(i.dayStem, mainStemOf(p[1]));
    if (groupOf(bg) === pg) out.push(bg);
  }
  return out;
}

function incomingHasPartner(dayStem: string, ganzhi: string, pg: Group): { stem: boolean; branch: boolean; gods: string[] } {
  const sg = tenGodOf(dayStem, ganzhi[0]);
  const bg = tenGodOf(dayStem, mainStemOf(ganzhi[1]));
  return { stem: groupOf(sg) === pg, branch: groupOf(bg) === pg, gods: [sg, bg].filter((g) => groupOf(g) === pg) };
}

export function loveSections(i: LoveInput): { core: BookSection[]; timing: BookSection | null } {
  const pg = partnerGroup(i.gender);
  const starName = pg === "재성" ? "재성(연인·배우자 별)" : "관성(연인·배우자 별)";
  const visible = visiblePartnerGods(i);
  const hid = hiddenGods(i.dayStem, i.pillars).filter((h) => h.group === pg);
  const core: BookSection[] = [];

  let star: string;
  if (visible.length === 0 && hid.length === 0) {
    star = `원국에 ${starName}이 거의 보이지 않아요. 인연이 없다는 뜻이 아니라, 운에서 그 기운이 들어올 때 존재감이 크게 느껴지는 구조예요. 기다리기보다 만남의 접점을 일부러 만들 때 잘 풀려요.`;
  } else if (visible.length === 0) {
    const where = hid.slice(0, 2).map((h) => `${POS_LABEL[h.pos]}의 ${h.stem}(${h.god})`).join(", ");
    star = `겉으로는 ${starName}이 드러나지 않지만, 지장간(지지 속에 숨은 천간)에 ${where}이 숨어 있어요. 마음은 깊은데 표현은 늦는 편이라, 마음을 일찍 작게라도 표현하는 연습이 도움이 돼요. 운에서 이 기운이 들어올 때 인연이 눈에 띄게 움직이기 쉬워요.`;
  } else if (visible.length === 1) {
    star = `원국에 ${starName}이 하나(${visible[0]})로 또렷해요. 마음이 가는 한 사람에게 집중하는 편이고, 기준이 분명한 만큼 천천히 확신이 쌓일 때 깊어져요.`;
  } else {
    star = `원국에 ${starName}이 여러 개(${visible.slice(0, 3).join("·")}) 있어요. 끌리는 유형이 여러 갈래라 마음의 기준을 한 번 정리해 두면 선택이 편해져요.`;
  }
  core.push({ heading: `연애의 별 · ${pg}`, body: star });

  const palaceGroup = groupOf(i.dayBranchGod);
  if (palaceGroup) {
    core.push({ heading: `배우자 자리(일지) · ${i.dayBranchGod}`, body: PALACE_GROUP[palaceGroup] });
  }
  const dayRel = natalRelations(i.pillars).filter((r) => r.dayInvolved);
  if (dayRel.length > 0) {
    const r = dayRel[0];
    core.push({ heading: `배우자 자리의 어울림 · ${POS_LABEL[r.a]}와 ${POS_LABEL[r.b]} ${r.type}`, body: `일지가 ${r.type === "충" ? "부딪히는" : r.type === "육합" || r.type === "반합" ? "어울리는" : "자극받는"} 구조예요. ${DAY_EXTRA[r.type]}` });
  }

  // 시기: 대운·세운
  const parts: string[] = [];
  if (i.daeunNow) {
    const h = incomingHasPartner(i.dayStem, i.daeunNow.ganzhi, pg);
    if (h.stem || h.branch) {
      const meaning =
        visible.length > 0
          ? "원래 있던 인연의 기운이 한층 선명해지는 시기예요."
          : hid.length > 0
            ? "겉으로는 보이지 않던(숨어 있던) 인연의 기운이 바깥으로 드러나는 시기라, 존재감이 크게 느껴지기 쉬워요."
            : "원국에 없던 인연의 기운이 들어오는 시기라 존재감이 크게 느껴지기 쉬워요.";
      parts.push(`지금 대운 ${i.daeunNow.ganzhi}(${i.daeunNow.startAge}~${i.daeunNow.endAge}세)에는 ${starName}이 들어와요(${h.gods.join("·")}). ${meaning}`);
    } else {
      parts.push(`지금 대운 ${i.daeunNow.ganzhi}은 인연의 별이 직접 들어오는 시기는 아니에요. 대신 나를 가꾸고 접점을 넓히는 데 힘을 쓰기 좋아요.`);
    }
    const inter = interactionLine(i.pillars, { label: "대운", ganzhi: i.daeunNow.ganzhi });
    if (inter) parts.push(`대운이 원국과 만나는 모습: ${inter}`);
  }
  if (i.seyun) {
    const h = incomingHasPartner(i.dayStem, i.seyun, pg);
    parts.push(
      h.stem || h.branch
        ? `${i.year}년 세운 ${i.seyun}에도 ${starName}이 들어와요(${h.gods.join("·")}). 인연과 관련된 일이 마음에 자주 오르내리기 쉬운 해예요.`
        : `${i.year}년 세운 ${i.seyun}은 인연의 별이 직접 들어오는 해는 아니에요.`,
    );
    const inter = interactionLine(i.pillars, { label: `${i.year}년 세운`, ganzhi: i.seyun });
    if (inter) parts.push(`올해 세운이 원국과 만나는 모습: ${inter}`);
  }
  if (i.daeunNext) {
    const h = incomingHasPartner(i.dayStem, i.daeunNext.ganzhi, pg);
    parts.push(
      h.stem || h.branch
        ? `${i.daeunNext.startAge}세부터의 대운 ${i.daeunNext.ganzhi}에도 ${starName}이 이어져요.`
        : `${i.daeunNext.startAge}세부터의 대운 ${i.daeunNext.ganzhi}은 분위기가 달라지는 시기예요.`,
    );
  }
  const timing: BookSection | null = parts.length > 0 ? { heading: `${i.year}년 흐름 · 인연의 시기`, body: parts.join(" ") } : null;
  return { core, timing };
}

/* ------------------------------------------------------------------ 재물·성공(직장) 심층용 */

export interface CareerInput extends Omit<LoveInput, "dayBranchGod"> {
  /** 월주 천간·지지(본기) 십성 */
  monthStemGod: string | undefined;
  monthBranchGod: string | undefined;
}

export function careerSections(i: CareerInput, topic: "money" | "success"): { core: BookSection[]; timing: BookSection | null } {
  const pg: Group = topic === "money" ? "재성" : "관성";
  const starName = topic === "money" ? "재성(돈과 성과의 별)" : "관성(직장·책임의 별)";
  const label = topic === "money" ? "재물" : "직장·성취";
  const visible: string[] = [];
  for (const pos of POS_ORDER) {
    const p = i.pillars[pos];
    if (!p || p.length < 2) continue;
    if (pos !== "day") {
      const g = tenGodOf(i.dayStem, p[0]);
      if (groupOf(g) === pg) visible.push(g);
    }
    const bg = tenGodOf(i.dayStem, mainStemOf(p[1]));
    if (groupOf(bg) === pg) visible.push(bg);
  }
  const hid = hiddenGods(i.dayStem, i.pillars).filter((h) => h.group === pg);
  const core: BookSection[] = [];

  let star: string;
  if (visible.length === 0 && hid.length === 0) {
    star = `원국에 ${starName}이 거의 보이지 않아요. 약점이라기보다, 운에서 이 기운이 들어올 때 존재감이 크게 느껴지는 구조예요. 그때는 ${topic === "money" ? "돈과 성과를 현실로 만들려는 마음이 커져요" : "책임과 평가가 한꺼번에 느껴질 수 있어요"}.`;
  } else if (visible.length === 0) {
    const where = hid.slice(0, 2).map((h) => `${POS_LABEL[h.pos]}의 ${h.stem}(${h.god})`).join(", ");
    star = `겉으로는 ${starName}이 드러나지 않지만 지장간에 ${where}이 숨어 있어요. 평소엔 조용하다가 운에서 이 기운이 들어오면 ${label}에 대한 욕구와 기회가 눈에 띄게 올라와요.`;
  } else if (visible.length === 1) {
    star = `원국에 ${starName}이 하나(${visible[0]})로 또렷해요. ${label}에서 기준이 분명하고, 한 가지를 꾸준히 밀어붙일 때 힘이 나요.`;
  } else {
    star = `원국에 ${starName}이 여러 개(${visible.slice(0, 3).join("·")}) 있어요. ${topic === "money" ? "돈과 성과를 다루는 감각이 좋지만 신경 쓸 곳이 많아 우선순위 정리가 필요해요" : "책임과 기대가 겹쳐 오기 쉬워서 우선순위를 줄이는 것이 중요해요"}.`;
  }
  core.push({ heading: `${label}의 별 · ${pg}`, body: star });

  const mg = groupOf(i.monthBranchGod);
  if (mg) {
    const stemPart = i.monthStemGod ? `월간 ${i.monthStemGod}, ` : "";
    core.push({ heading: `일·직업 자리(월주) · ${stemPart}월지 ${i.monthBranchGod}`, body: PLACE_GROUP.month[mg] });
  }
  const monthRel = natalRelations(i.pillars).filter((r) => r.a === "month" || r.b === "month");
  if (monthRel.length > 0) {
    const r = monthRel[0];
    core.push({ heading: `일·직업 자리의 어울림 · ${POS_LABEL[r.a]}와 ${POS_LABEL[r.b]} ${r.type}`, body: `월주가 ${r.type === "충" ? "부딪히는" : r.type === "육합" || r.type === "반합" ? "어울리는" : "자극받는"} 구조예요. 일과 사회 영역에서 ${r.type === "충" ? "환경 변화나 이동이 잦을 수 있어, 한쪽을 안정시키며 다른 쪽을 움직이는 방식이 잘 맞아요" : r.type === "육합" || r.type === "반합" ? "사람과 환경이 나를 도와주는 방향으로 모이기 쉬워요" : "긴장이 쌓이지 않게 쉬는 구간을 의식적으로 두면 좋아요"}.` });
  }

  const parts: string[] = [];
  const add = (who: string, gz: string, endText?: string) => {
    const h = incomingHasPartner(i.dayStem, gz, pg);
    if (h.stem || h.branch) {
      const meaning = visible.length > 0 ? `원래 있던 ${label}의 기운이 한층 선명해져요.` : hid.length > 0 ? `숨어 있던 ${label}의 기운이 겉으로 드러나요.` : `원국에 없던 ${label}의 기운이 들어와 존재감이 크게 느껴져요.`;
      parts.push(`${who} ${gz}에는 ${starName}이 들어와요(${h.gods.join("·")}). ${meaning}${endText ?? ""}`);
    } else {
      parts.push(`${who} ${gz}은 ${label}의 별이 직접 들어오는 흐름은 아니에요.`);
    }
    const inter = interactionLine(i.pillars, { label: who.replace(/\(.*$/, "").trim(), ganzhi: gz });
    if (inter) parts.push(`${who.replace(/\(.*$/, "").trim()}이 원국과 만나는 모습: ${inter}`);
  };
  if (i.daeunNow) add(`지금 대운(${i.daeunNow.startAge}~${i.daeunNow.endAge}세)`, i.daeunNow.ganzhi);
  if (i.seyun) add(`${i.year}년 세운`, i.seyun);
  const timing: BookSection | null = parts.length > 0 ? { heading: `${i.year}년 흐름 · ${label}의 시기`, body: parts.join(" ") } : null;
  return { core, timing };
}

/** 이번 달·다음 달 한눈에 */
export function monthSection(pillars: Partial<Record<PosKey, string>>, months: Array<{ label: string; ganzhi: string; stemGod: string }>): BookSection | null {
  if (months.length === 0) return null;
  const lines = months.map((m) => {
    const base = GOD_MONTH_LINE[m.stemGod] ?? "";
    const inter = interactionLine(pillars, { label: m.label, ganzhi: m.ganzhi });
    return `${m.label} ${m.ganzhi}(${m.stemGod}): ${base}${inter ? ` ${inter}` : ""}`;
  });
  return { heading: "이번 달과 다가오는 달", body: lines.join(" ") };
}

