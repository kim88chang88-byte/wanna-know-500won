import type { SajuResult } from "ssaju";
import { groupOf, type Group } from "../topic";
import type { BookChart, BookChartPoint } from "../types";

/*
 * 나이(대운)별 기운 흐름 그래프. 10년 단위 대운의 천간·지지 십성으로 "그 시기에 이 기운이 얼마나 힘을 받는지"를 0~100 상대 지수로 보여 줘요.
 * 실제 금액이나 일이 일어날 확률이 아니라, 흐름의 높낮이를 눈으로 보기 위한 참고용 그림이에요.
 */

export type ChartKind = "money" | "love" | "career";

type Weights = Partial<Record<Group, number>>;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** 대운 한 칸의 점수: 천간 십성은 100%, 지지 십성은 80% 반영해요. */
function score(base: number, w: Weights, stemGod: string | undefined, branchGod: string | undefined): number {
  const s = groupOf(stemGod);
  const b = groupOf(branchGod);
  const v = base + (s ? (w[s] ?? 0) : 0) + (b ? (w[b] ?? 0) * 0.8 : 0);
  return Math.round(clamp(v, 8, 95));
}

function weightsFor(kind: ChartKind, female: boolean): { w: Weights; focus: Group } {
  if (kind === "money") return { w: { 재성: 26, 식상: 9, 관성: 3, 인성: -3, 비겁: -9 }, focus: "재성" };
  if (kind === "career") return { w: { 관성: 24, 식상: 10, 인성: 10, 재성: 3, 비겁: -4 }, focus: "관성" };
  // 연애·결혼: 여성은 관성, 남성은 재성이 인연의 별이에요.
  return female
    ? { w: { 관성: 26, 재성: 4, 식상: -4, 인성: 2, 비겁: -2 }, focus: "관성" }
    : { w: { 재성: 26, 식상: 5, 관성: 2, 인성: 0, 비겁: -8 }, focus: "재성" };
}

const TEXT: Record<ChartKind, { title: string; caption: string; peak1: string; peak2: string; now: string }> = {
  money: {
    title: "나이별 재물 기운 흐름",
    caption: "10년 단위 대운마다 재물 기운이 얼마나 힘을 받는지 보여 주는 상대 지수예요. 실제 금액이 아니라 흐름의 높낮이를 읽는 참고용 그림이에요.",
    peak1: "재물 기운이 가장 힘을 받는 시기",
    peak2: "그다음으로 힘이 실리는 시기",
    now: "지금 시기",
  },
  love: {
    title: "나이별 인연 기운 흐름",
    caption: "10년 단위 대운마다 인연(만남·결혼)의 기운이 얼마나 짙어지는지 보여 주는 상대 지수예요. 그 시기에 꼭 만난다는 뜻이 아니라, 인연 이야기가 가까워지기 쉬운 때를 가늠하는 참고용 그림이에요.",
    peak1: "인연의 기운이 가장 짙은 시기",
    peak2: "그다음으로 인연이 짙은 시기",
    now: "지금 시기",
  },
  career: {
    title: "나이별 일 기운 흐름",
    caption: "10년 단위 대운마다 일·성취의 기운이 얼마나 힘을 받는지 보여 주는 상대 지수예요. 성공을 장담하는 숫자가 아니라, 힘을 쏟기 좋은 때를 가늠하는 참고용 그림이에요.",
    peak1: "일의 기운이 가장 힘을 받는 시기",
    peak2: "그다음으로 힘이 실리는 시기",
    now: "지금 시기",
  },
};

export function buildLifeChart(r: SajuResult, kind: ChartKind): BookChart | null {
  const list = r.daeun.list;
  if (!list || list.length < 3) return null;
  const female = r.input.gender === "여";
  const { w, focus } = weightsFor(kind, female);
  // 원국에 그 기운이 이미 있으면 바탕이 조금 높아져요.
  const natal = [r.tenGods.year.stem, r.tenGods.year.branch, r.tenGods.month.stem, r.tenGods.month.branch, r.tenGods.day.branch].filter((g) => groupOf(g) === focus).length;
  const base = 40 + Math.min(natal, 3) * 3;
  const cur = r.daeun.current;
  const points: BookChartPoint[] = list.map((d) => ({
    age: d.startAge,
    endAge: d.endAge,
    ganzhi: d.ganzhi,
    value: score(base, w, d.stemTenGod, d.branchTenGod),
    ...(cur !== null && d.startAge === cur.startAge ? { current: true } : {}),
  }));
  // 가장 높은 두 시기(값이 같으면 앞쪽)
  const ranked = points.map((p, i) => ({ p, i })).sort((a, b) => b.p.value - a.p.value || a.i - b.i);
  const first = ranked[0];
  const second = ranked.find((x) => x.p.value >= first.p.value - 25 && Math.abs(x.i - first.i) >= 2);
  points[first.i].peak = 1;
  if (second) points[second.i].peak = 2;
  const t = TEXT[kind];
  const range = (p: BookChartPoint) => `${p.age}~${p.endAge}세 (${p.ganzhi} 대운)`;
  const callouts = [{ label: t.peak1, text: range(points[first.i]) }];
  if (second) callouts.push({ label: t.peak2, text: range(points[second.i]) });
  const curP = points.find((p) => p.current);
  if (curP) callouts.push({ label: t.now, text: `${range(curP)} · 지수 ${curP.value}` });
  return { title: t.title, caption: t.caption, points, callouts };
}

/** 잠금 상태: 현재 대운 이후 칸과 풀이 문구는 가려요. */
export function lockChart(chart: BookChart): BookChart {
  const ci = chart.points.findIndex((p) => p.current);
  return {
    ...chart,
    points: chart.points.map((p, i) => (ci >= 0 && i > ci ? { age: p.age, endAge: p.endAge, ganzhi: "●●", value: 0, locked: true } : p)),
    callouts: chart.callouts.filter((c) => c.label === TEXT.money.now || c.label === TEXT.love.now || c.label === TEXT.career.now),
  };
}
