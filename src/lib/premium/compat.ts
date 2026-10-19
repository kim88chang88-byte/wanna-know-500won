import { STEMS } from "@/lib/saju/constants";
import { branchRelation, tenGodOf, type TenGod } from "@/lib/ai/dailyFacts";
import type { CompatPerson, CompatPoint, CompatView, ElementKind, ElementView } from "./types";

/*
 * 두 사람의 사주를 견주어 궁합을 만들어요. (외부 호출 없이, 표와 산술만 써요)
 * - 일간 관계(십성·합·충), 일지·월지·띠(연지) 관계, 오행 보완을 봐요.
 * - 점수는 재미로 보는 참고 지수예요. 실제 인연을 가르지 않는다는 점을 화면에도 적어요.
 */

/** ssaju 계산 결과 중 궁합에 쓰는 부분만 적은 모양 */
export interface SsajuForCompat {
  pillars: { year: string; month: string; day: string; hour: string };
  pillarDetails: Record<"year" | "month" | "day" | "hour", { stemKo: string; branchKo: string; element: { stem: string; branch: string } }>;
}

const ELEMENTS: { name: string; kind: ElementKind }[] = [
  { name: "목", kind: "wood" },
  { name: "화", kind: "fire" },
  { name: "토", kind: "earth" },
  { name: "금", kind: "metal" },
  { name: "수", kind: "water" },
];

const STEM_COMBINE: ReadonlyArray<[string, string]> = [["甲", "己"], ["乙", "庚"], ["丙", "辛"], ["丁", "壬"], ["戊", "癸"]];

/** 일간 기준으로 상대 글자가 어떤 십성인지에 따른 관계 풀이 (겁주는 말은 쓰지 않아요) */
const GOD_MEANING: Record<TenGod, { text: string; good: boolean }> = {
  비견: { text: "친구처럼 편하고 대등한 사이예요. 서로의 페이스를 존중하면 오래가요.", good: true },
  겁재: { text: "서로 지지 않으려는 승부욕이 있는 사이예요. 경쟁 대신 응원으로 바꾸면 든든해져요.", good: false },
  식신: { text: "함께 있으면 여유롭고 즐거운 사이예요. 맛집, 취미, 수다가 잘 어울려요.", good: true },
  상관: { text: "재치가 통하고 솔직한 대화가 오가는 사이예요. 말은 부드럽게 고르면 더 좋아져요.", good: false },
  편재: { text: "새로운 경험을 함께 즐기는 활동적인 사이예요. 같이 움직일수록 재미가 커져요.", good: true },
  정재: { text: "차분하게 아끼고 챙기게 되는 사이예요. 작은 약속을 잘 지키면 믿음이 쌓여요.", good: true },
  편관: { text: "설렘과 약간의 긴장이 함께 있는 사이예요. 서로의 영역을 존중하면 자극이 힘이 돼요.", good: false },
  정관: { text: "믿음직하고 예의를 지키는 안정적인 사이예요. 서로를 존중하는 마음이 큰 힘이에요.", good: true },
  편인: { text: "서로의 생각을 자극하는 개성 있는 사이예요. 각자 시간을 인정하면 편안해져요.", good: false },
  정인: { text: "기대고 챙김받는 포근한 사이예요. 서로에게 마음의 쉼터가 되어 줘요.", good: true },
};

const RELATION_TEXT = {
  합: "서로 끌어당겨 어울리는 사이예요. 손발이 잘 맞고 편안해요.",
  충: "서로 부딪혀 움직임이 생기는 사이예요. 변화와 활력이 있지만, 의견이 다를 땐 한 박자 쉬어 가면 좋아요.",
  해: "사소한 엇박자가 생길 수 있는 사이예요. 오해가 생기면 바로 풀면 가볍게 지나가요.",
} as const;

const stemOf = (pillar: string) => pillar.charAt(0);
const branchOf = (pillar: string) => pillar.charAt(1);

function hangulStem(hanja: string): string {
  return STEMS.find((s) => s.hanja === hanja)?.hangul ?? hanja;
}

/** 오행 분포. 태어난 시간을 모르면 시주를 빼고 세어요. */
export function countElements(r: SsajuForCompat, hourKnown: boolean): ElementView[] {
  const counts: Record<string, number> = {};
  const keys = hourKnown ? (["year", "month", "day", "hour"] as const) : (["year", "month", "day"] as const);
  for (const k of keys) {
    const d = r.pillarDetails[k];
    counts[d.element.stem] = (counts[d.element.stem] ?? 0) + 1;
    counts[d.element.branch] = (counts[d.element.branch] ?? 0) + 1;
  }
  return ELEMENTS.map(({ name, kind }) => ({ name, kind, count: counts[name] ?? 0 }));
}

function person(label: string, r: SsajuForCompat, hourKnown: boolean): CompatPerson {
  const d = r.pillarDetails.day;
  return {
    label,
    dayPillar: r.pillars.day || null,
    dayReading: `${d.stemKo}${d.branchKo}`,
    elements: countElements(r, hourKnown),
    hourUnknown: !hourKnown,
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function headlineFor(score: number): string {
  if (score >= 85) return "서로의 결이 자연스럽게 어우러지는 사이예요";
  if (score >= 75) return "닮은 듯 다르고, 균형이 좋은 사이예요";
  if (score >= 65) return "서로 맞춰 가며 더 빛나는 사이예요";
  return "다른 점이 서로에게 새로운 자극이 되는 사이예요";
}

/** 두 사람의 계산 결과로 궁합을 만들어요. */
export function buildCompat(me: SsajuForCompat, other: SsajuForCompat, meHourKnown: boolean, otherHourKnown: boolean): CompatView {
  const meDay = me.pillars.day;
  const otDay = other.pillars.day;
  const points: CompatPoint[] = [];
  let score = 70;

  // 1) 일간 관계: 내가 보는 상대, 상대가 보는 나
  const god = tenGodOf(stemOf(meDay), stemOf(otDay));
  const godBack = tenGodOf(stemOf(otDay), stemOf(meDay));
  const g = GOD_MEANING[god];
  points.push({ title: `내가 보는 상대 · ${god}의 기운`, body: g.text, tone: g.good ? "good" : "tip" });
  const gb = GOD_MEANING[godBack];
  points.push({ title: `상대가 보는 나 · ${godBack}의 기운`, body: gb.text, tone: gb.good ? "good" : "tip" });
  score += (g.good ? 2 : 0) + (gb.good ? 2 : 0);

  // 2) 일간끼리 합 / 충
  const meStem = stemOf(meDay);
  const otStem = stemOf(otDay);
  const combine = STEM_COMBINE.some(([a, b]) => (a === meStem && b === otStem) || (a === otStem && b === meStem));
  // 천간 충: 같은 음양끼리 6칸 떨어진 사이 (갑-경, 을-신, 병-임, 정-계)
  const clash = Math.abs(STEMS.findIndex((x) => x.hanja === meStem) - STEMS.findIndex((x) => x.hanja === otStem)) === 6;
  if (combine) {
    score += 10;
    points.push({ title: "일간의 합 · 끌림", body: `나의 ${meStem}(${hangulStem(meStem)})과 상대의 ${otStem}(${hangulStem(otStem)})이 서로 합을 이뤄요. 처음부터 마음이 가는 인연의 결이 있어요.`, tone: "good" });
  } else if (clash) {
    score -= 4;
    points.push({ title: "일간의 충 · 자극", body: "서로의 중심 기운이 정면으로 만나 자극이 되는 사이예요. 솔직함이 장점이니, 말투만 부드럽게 맞추면 서로를 단단하게 키워 줘요.", tone: "tip" });
  }

  // 3) 지지 관계: 일지(가까운 마음), 월지(생활 방식), 연지(띠, 집안·주변)
  const pairs: { key: "day" | "month" | "year"; label: string; good: string; weight: { 합: number; 충: number; 해: number } }[] = [
    { key: "day", label: "일지 · 마음의 거리", good: "가장 가까운 자리라서 연인 사이의 편안함에 크게 닿아요.", weight: { 합: 8, 충: -6, 해: -3 } },
    { key: "month", label: "월지 · 생활 방식", good: "일과 생활 리듬에서 서로에게 힘이 돼요.", weight: { 합: 3, 충: -2, 해: -1 } },
    { key: "year", label: "연지 · 띠 궁합", good: "주변과 가족, 큰 흐름에서 서로를 편하게 받아 줘요.", weight: { 합: 3, 충: -2, 해: -1 } },
  ];
  for (const p of pairs) {
    const rel = branchRelation(branchOf(me.pillars[p.key]), branchOf(other.pillars[p.key]));
    if (!rel) continue;
    score += p.weight[rel];
    points.push({
      title: `${p.label} · ${rel}`,
      body: `${RELATION_TEXT[rel]} ${rel === "합" ? p.good : ""}`.trim(),
      tone: rel === "합" ? "good" : "tip",
    });
  }

  // 4) 오행 보완: 한 사람에게 없는 기운을 상대가 넉넉히 갖고 있으면
  const meEl = countElements(me, meHourKnown);
  const otEl = countElements(other, otherHourKnown);
  let fillBonus = 0;
  for (const e of ELEMENTS) {
    const a = meEl.find((x) => x.name === e.name)?.count ?? 0;
    const b = otEl.find((x) => x.name === e.name)?.count ?? 0;
    if (a === 0 && b >= 2 && fillBonus < 9) {
      fillBonus += 3;
      points.push({ title: `오행 보완 · ${e.name}`, body: `나에게 부족한 ${e.name} 기운을 상대가 넉넉히 가지고 있어요. 곁에 있으면 빈자리가 채워지는 느낌이 들 수 있어요.`, tone: "good" });
    } else if (b === 0 && a >= 2 && fillBonus < 9) {
      fillBonus += 3;
      points.push({ title: `오행 보완 · ${e.name}`, body: `상대에게 부족한 ${e.name} 기운을 내가 넉넉히 가지고 있어요. 내가 곁에서 든든한 힘이 되어 줄 수 있어요.`, tone: "good" });
    }
  }
  score += fillBonus;

  const final = clamp(Math.round(score), 55, 96);
  const goods = points.filter((p) => p.tone === "good").length;
  const tips = points.length - goods;
  // 잘 맞는 점이 먼저 오게
  points.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "good" ? -1 : 1));
  return {
    score: final,
    headline: headlineFor(final),
    me: person("나", me, meHourKnown),
    partner: person("상대", other, otherHourKnown),
    points,
    closing:
      tips === 0
        ? "큰 어긋남 없이 편안하게 어울리는 조합이에요. 지금의 편안함을 소중히 가꿔 보세요."
        : goods >= tips
          ? "잘 맞는 부분이 더 많아요. 맞춰 가면 좋은 부분만 서로 알고 있으면 더 오래 편안할 거예요."
          : "다른 점이 많은 만큼 서로에게 배울 것도 많아요. 다름을 틀림이 아니라 보완으로 읽어 보세요.",
  };
}

/** 궁합 요청인지 (화면 문구에서 알아봐요) */
export function isCompatFortune(fortune: string): boolean {
  return fortune.includes("궁합");
}
