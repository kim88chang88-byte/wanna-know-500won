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

const ASSET_CAPTION = "10년 단위 대운마다 재물 기운이 얼마나 힘을 받는지를 바탕으로, 20세부터 쌓여 가는 자산을 가상으로 그려 본 재미 시나리오예요. 금액은 사주 흐름의 높낮이를 비율로 바꾼 참고 값이고, 실제 수입·재산이나 투자 결과를 예측하는 것이 아니에요.";

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

/** 만원 단위를 "5,000만원", "3.2억", "12억"처럼 읽기 쉽게 */
export function formatWon(man: number): string {
  if (man < 10_000) return `${(Math.round(man / 100) * 100).toLocaleString("ko-KR")}만원`;
  const e = man / 10_000;
  return `${e < 10 ? e.toFixed(1).replace(/\.0$/, "") : Math.round(e)}억`;
}

const ASSET_FROM = 20;
const ASSET_TO = 80;

/**
 * 재물 흐름을 "가상 누적 자산"으로 바꿔 보여 줘요. 재미로 보는 시나리오예요.
 * 20세부터 80세까지, 대운마다 기운 지수가 높을수록 더 많이 쌓인다고 보고, 전체 규모는 평균 지수로 정해요(약 3억~25억).
 */
function applyAssets(points: BookChartPoint[]): void {
  const w = points.map((p) => {
    const years = Math.max(0, Math.min(p.endAge, ASSET_TO) - Math.max(p.age, ASSET_FROM) + 1);
    return years * Math.pow(p.value / 50, 1.5);
  });
  const total = w.reduce((a, b) => a + b, 0);
  if (total <= 0) return;
  const avg = points.reduce((a, p) => a + p.value, 0) / points.length;
  const scale = clamp(40_000 + ((avg - 40) / 55) * 210_000, 30_000, 250_000);
  let cum = 0;
  points.forEach((p, i) => {
    cum += w[i];
    p.amount = Math.round(((cum / total) * scale) / 100) * 100;
  });
}

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
  const asset = kind === "money";
  if (asset) applyAssets(points);
  const hasAsset = asset && points.some((p) => (p.amount ?? 0) > 0);
  const range = (p: BookChartPoint) => `${p.age}~${p.endAge}세 (${p.ganzhi} 대운)`;
  const gain = (i: number) => (points[i].amount ?? 0) - (i > 0 ? (points[i - 1].amount ?? 0) : 0);
  const peakText = (i: number) => (hasAsset ? `${range(points[i])} · 이 시기에 약 ${formatWon(gain(i))} 늘어요` : range(points[i]));
  const callouts = [{ label: t.peak1, text: peakText(first.i) }];
  if (second) callouts.push({ label: t.peak2, text: peakText(second.i) });
  const curP = points.find((p) => p.current);
  if (curP) callouts.push({ label: t.now, text: hasAsset ? `${range(curP)} · 이 시기가 끝날 때 약 ${formatWon(curP.amount ?? 0)}` : `${range(curP)} · 지수 ${curP.value}` });
  const lastP = points[points.length - 1];
  if (hasAsset && lastP.endAge >= ASSET_TO) {
    const at80 = points.find((p) => p.endAge >= ASSET_TO) ?? lastP;
    callouts.push({ label: "80세 무렵", text: `약 ${formatWon(at80.amount ?? 0)}` });
  }
  return { mode: hasAsset ? "asset" : "index", title: hasAsset ? "나이별 재물 흐름과 예상 자산" : t.title, caption: hasAsset ? ASSET_CAPTION : t.caption, points, callouts };
}

/** 잠금 상태: 현재 대운 이후 칸과 풀이 문구는 가려요. */
export function lockChart(chart: BookChart): BookChart {
  const ci = chart.points.findIndex((p) => p.current);
  return {
    ...chart,
    points: chart.points.map((p, i) => (ci >= 0 && i > ci ? { age: p.age, endAge: p.endAge, ganzhi: "●●", value: 0, amount: 0, locked: true } : p)),
    callouts: chart.callouts.filter((c) => c.label === TEXT.money.now || c.label === TEXT.love.now || c.label === TEXT.career.now),
  };
}
