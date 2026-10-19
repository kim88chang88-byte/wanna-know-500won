import { BRANCHES, STEMS, type Element, type StemInfo } from "@/lib/saju/constants";
import { dayPillar } from "@/lib/saju/ganzhi";
import type { CivilDate, Pillar, SajuChart } from "@/lib/saju/types";

/*
 * "오늘의 일진"과 내 사주의 관계를 계산합니다. (외부 라이브러리 없이, 달력 산술과 표만 씁니다)
 * 같은 사주라도 날마다 풀이가 달라지게 하는 재료예요. AI 가 직접 계산하지 않도록 서버에서 미리 구해 줘요.
 */

export type TenGod = "비견" | "겁재" | "식신" | "상관" | "편재" | "정재" | "편관" | "정관" | "편인" | "정인";

/** 오행 상생 순서: 목→화→토→금→수→목 */
const GENERATES: Record<Element, Element> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
/** 오행 상극: 목→토, 토→수, 수→화, 화→금, 금→목 */
const CONTROLS: Record<Element, Element> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

function stemOf(hanja: string): StemInfo {
  const s = STEMS.find((x) => x.hanja === hanja);
  if (!s) throw new Error(`알 수 없는 천간: ${hanja}`);
  return s;
}

/** 일간(me) 기준으로 다른 천간(other)이 어떤 십성인지. */
export function tenGodOf(me: string, other: string): TenGod {
  const a = stemOf(me);
  const b = stemOf(other);
  const same = a.yinYang === b.yinYang;
  if (a.element === b.element) return same ? "비견" : "겁재";
  if (GENERATES[a.element] === b.element) return same ? "식신" : "상관";
  if (CONTROLS[a.element] === b.element) return same ? "편재" : "정재";
  if (CONTROLS[b.element] === a.element) return same ? "편관" : "정관";
  return same ? "편인" : "정인"; // b 가 a 를 생해 주는 경우
}

/** 십성이 오늘 하루에 주는 "분위기". 어려운 용어 대신 이 말로 풀어 쓰라고 AI 에게 알려 줘요. 겁주는 말은 쓰지 않아요. */
export const TEN_GOD_MOOD: Record<TenGod, string> = {
  비견: "나와 닮은 기운. 내 페이스를 지키기 좋고, 친구·동료와 호흡이 맞는 날",
  겁재: "경쟁심과 나눔의 기운. 활기차지만 충동 지출은 한 번 더 생각하면 좋은 날",
  식신: "표현과 여유의 기운. 맛있는 것, 취미, 가벼운 수다로 기분이 풀리는 날",
  상관: "재치와 끼의 기운. 말솜씨가 반짝이지만 말은 부드럽게 고르면 좋은 날",
  편재: "뜻밖의 기회와 활동의 기운. 움직일수록 재미있는 일이 생기는 날",
  정재: "꾸준한 수확의 기운. 차곡차곡 챙기는 일이 잘 맞는 날",
  편관: "긴장과 책임의 기운. 할 일을 하나씩 끝내면 뿌듯해지는 날",
  정관: "질서와 인정의 기운. 약속과 규칙을 지키면 믿음을 얻는 날",
  편인: "직관과 아이디어의 기운. 혼자 생각을 정리하거나 새로운 걸 떠올리기 좋은 날",
  정인: "도움과 배움의 기운. 쉬거나 배우며 마음이 든든해지는 날",
};

const SIX_COMBINE: ReadonlyArray<[string, string]> = [
  ["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"],
];
/** 해(害): 서로 살짝 어긋나는 사이 */
const SIX_HARM: ReadonlyArray<[string, string]> = [
  ["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"],
];
const STEM_COMBINE: ReadonlyArray<[string, string]> = [
  ["甲", "己"], ["乙", "庚"], ["丙", "辛"], ["丁", "壬"], ["戊", "癸"],
];

const pairHas = (pairs: ReadonlyArray<[string, string]>, a: string, b: string) =>
  pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

function branchIndex(hanja: string): number {
  return BRANCHES.findIndex((b) => b.hanja === hanja);
}

export type BranchRelation = "합" | "충" | "해" | null;

/** 두 지지의 관계. 충은 정확히 6칸 떨어진 사이(자-오, 축-미 …)예요. */
export function branchRelation(a: string, b: string): BranchRelation {
  if (pairHas(SIX_COMBINE, a, b)) return "합";
  if (Math.abs(branchIndex(a) - branchIndex(b)) === 6) return "충";
  if (pairHas(SIX_HARM, a, b)) return "해";
  return null;
}

const RELATION_MEANING: Record<Exclude<BranchRelation, null>, string> = {
  합: "서로 끌어당겨 어울리는 사이 (편안하고 손발이 맞음)",
  충: "서로 부딪혀 움직임이 생기는 사이 (변화·분주함, 가볍게 넘기면 활력)",
  해: "살짝 어긋나 신경 쓰이는 사이 (사소한 엇박자)",
};

/** 천간 충: 같은 음양끼리 6칸 떨어진 사이 (갑-경, 을-신, 병-임, 정-계) */
function stemClash(a: string, b: string): boolean {
  const ia = STEMS.findIndex((s) => s.hanja === a);
  const ib = STEMS.findIndex((s) => s.hanja === b);
  return Math.abs(ia - ib) === 6; // 0~9 칸에서 6칸 차이는 (0,6)(1,7)(2,8)(3,9) 네 쌍뿐이에요
}

export interface DailyFacts {
  /** 예: 丙午(병오) */
  오늘일진: string;
  /** 일간과 오늘 천간의 관계 */
  일간과의관계: { 십성: TenGod; 분위기: string };
  /** 오늘 천간이 일간과 합이 되거나 부딪치면 */
  일간합충?: string;
  /** 오늘 지지와 내 일지·월지의 관계 (관계가 있는 것만) */
  지지관계: string[];
}

function pillarLabel(p: Pillar): string {
  const s = stemOf(p.stem);
  const b = BRANCHES.find((x) => x.hanja === p.branch);
  return `${p.stem}${p.branch}(${s.hangul}${b?.hangul ?? "?"})`;
}

/** 양력 날짜(오늘)의 일진과 이 명식의 관계를 구해요. today 는 한국 날짜 기준으로 넘겨 주세요. */
export function buildDailyFacts(chart: SajuChart, today: CivilDate): DailyFacts {
  const todayPillar = dayPillar(today);
  const god = tenGodOf(chart.day.stem, todayPillar.stem);

  let 일간합충: string | undefined;
  if (pairHas(STEM_COMBINE, chart.day.stem, todayPillar.stem)) {
    일간합충 = "오늘 글자가 내 일간과 합(끌림·어울림)";
  } else if (stemClash(chart.day.stem, todayPillar.stem)) {
    일간합충 = "오늘 글자가 내 일간과 충(부딪힘·자극)";
  }

  const 지지관계: string[] = [];
  for (const [label, p] of [["일지", chart.day], ["월지", chart.month]] as const) {
    const rel = branchRelation(todayPillar.branch, p.branch);
    if (rel) 지지관계.push(`오늘 ${todayPillar.branch}와 내 ${label} ${p.branch}: ${rel} — ${RELATION_MEANING[rel]}`);
  }

  return {
    오늘일진: pillarLabel(todayPillar),
    일간과의관계: { 십성: god, 분위기: TEN_GOD_MOOD[god] },
    ...(일간합충 ? { 일간합충 } : {}),
    지지관계,
  };
}

/** 서버 시계(UTC)에서 한국 날짜(KST, UTC+9)를 구해요. */
export function kstToday(now: Date = new Date()): CivilDate {
  const k = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return { year: k.getUTCFullYear(), month: k.getUTCMonth() + 1, day: k.getUTCDate() };
}
