import { calculateSaju } from "@/lib/saju/calculate";
import type { BirthInput, Gender, Pillar, SajuChart } from "@/lib/saju/types";
import { callJson } from "./callJson";
import { buildCoreFacts, type CoreFacts } from "./coreFacts";
import { SYSTEM_PROMPT } from "./prompt";
import { containsForbidden } from "./reading";

/*
 * 태어난 시간이 애매할 때("오전 7~9시쯤"), 그 범위 안에서 시주가 달라지는 경우를 모두 찾아 나란히 비교해요.
 * 시주는 두 시간(1시진)마다 바뀌어서, 범위가 걸쳐 있으면 후보가 2~3개가 돼요. 자정을 넘는 범위는 받지 않아요.
 */

export const MAX_SPAN_HOURS = 4;
const MAX_CANDIDATES = 3;

export type RangeCheck = { ok: true; start: number; end: number } | { ok: false; error: string };

/** 시작·끝 시(0~24)를 검사해요. 끝은 포함하지 않고(예: 7~9 는 07:00~08:59), 4시간까지만 받아요. */
export function parseRange(rawStart: unknown, rawEnd: unknown): RangeCheck {
  const s = typeof rawStart === "number" ? rawStart : NaN;
  const e = typeof rawEnd === "number" ? rawEnd : NaN;
  if (!Number.isInteger(s) || !Number.isInteger(e) || s < 0 || s > 23 || e < 1 || e > 24) return { ok: false, error: "시간 범위를 다시 골라 주세요." };
  if (e <= s) return { ok: false, error: "끝나는 시간은 시작 시간보다 뒤여야 해요. (자정을 넘는 범위는 나눠서 따로 봐 주세요)" };
  if (e - s > MAX_SPAN_HOURS) return { ok: false, error: `범위는 ${MAX_SPAN_HOURS}시간 이내로 좁혀 주세요.` };
  return { ok: true, start: s, end: e };
}

export interface HourCandidate {
  /** 이 시주가 되는 시간대 (예: "07:00~08:29") */
  window: string;
  hourPillar: string;
  /** 연·월·일·시 네 기둥 (절기 경계에서는 월주도 달라질 수 있어서 모두 보여줘요) */
  pillars: string[];
  input: BirthInput;
  core: CoreFacts | null;
}

const p2 = (n: number) => String(n).padStart(2, "0");
const pill = (p: Pillar | null) => (p ? `${p.stem}${p.branch}` : "");
const fmt = (t: number) => `${p2(Math.floor(t / 60))}:${p2(t % 60)}`;

/** 범위 안을 30분 간격으로 훑어, 시주(와 월주)가 달라지는 후보를 찾아요. */
export function findCandidates(base: BirthInput, start: number, end: number, coreFor: (i: BirthInput) => CoreFacts | null = (i) => buildCoreFacts(i)): HourCandidate[] {
  const groups = new Map<string, { from: number; to: number; input: BirthInput; chart: SajuChart }>();
  for (let t = start * 60; t < end * 60; t += 30) {
    const input: BirthInput = { ...base, hour: Math.floor(t / 60), minute: t % 60 };
    const chart = calculateSaju(input);
    const key = [pill(chart.year), pill(chart.month), pill(chart.day), pill(chart.hour)].join("|");
    const g = groups.get(key);
    if (g) g.to = t + 29;
    else groups.set(key, { from: t, to: t + 29, input, chart });
  }
  return [...groups.values()].slice(0, MAX_CANDIDATES).map((g) => ({
    window: `${fmt(g.from)}~${fmt(Math.min(g.to, end * 60 - 1))}`,
    hourPillar: pill(g.chart.hour),
    pillars: [pill(g.chart.year), pill(g.chart.month), pill(g.chart.day), pill(g.chart.hour)],
    input: g.input,
    core: coreFor(g.input),
  }));
}

export interface HourResult {
  /** AI 없이 계산만으로 알 수 있는 사실: 후보가 하나뿐인지 */
  same: boolean;
  candidates: Array<{ window: string; pillars: string[]; feel: string }>;
  common: string;
  differ: string;
  howToCheck: string;
}

export const HOURS_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

지금은 "태어난 시간이 애매할 때 후보 비교" 모드야. 같은 생년월일에서 시간대에 따라 사주(주로 시주)가 달라지는 후보들을 나란히 풀어줘.
- 반말, 쉬운 말. 각 항목 1~2문장. 사주 용어는 괄호로 짧게.
- 후보마다 feel(그 시간이라면 어떤 결의 사람인지, 신강신약·격국·용신 근거 한 가지)을 써. 후보 수와 순서를 그대로 지켜.
- common: 후보와 상관없이 변하지 않는 핵심(일간·일주 등). differ: 후보에 따라 달라지는 부분(시주 자리 = 꿈·말년·자녀, 신강신약 등). 달라지는 게 거의 없으면 그렇게 말해.
- howToCheck: 정확한 시간을 확인하는 현실적인 방법 한두 가지(부모님께 여쭤보기, 출생증명서·산모수첩·병원 기록 등)와, 확인 전에는 둘 다 가볍게 참고하라는 말.
- 후보에 없는 사실은 지어내지 마. 어느 쪽이 맞다고 단정하지 마. 겁주기·예언 금지.`;

const f = (d: string) => ({ type: "string", description: d });
export const HOURS_SCHEMA = {
  type: "object",
  properties: {
    candidates: { type: "array", items: { type: "object", properties: { feel: f("그 시간이라면 어떤 결인지. 1~2문장, 120자 이내") }, required: ["feel"], additionalProperties: false } },
    common: f("후보와 상관없이 변하지 않는 핵심. 1~2문장, 150자 이내"),
    differ: f("후보에 따라 달라지는 부분. 1~2문장, 150자 이내"),
    howToCheck: f("정확한 시간을 확인하는 방법. 1~2문장, 150자 이내"),
  },
  required: ["candidates", "common", "differ", "howToCheck"],
  additionalProperties: false,
} as const;

export function parseHours(value: unknown, count: number): { feels: string[]; common: string; differ: string; howToCheck: string } | null {
  if (typeof value !== "object" || value === null) return null;
  const o = value as Record<string, unknown>;
  const t = (v: unknown, max = 500): string | null => (typeof v === "string" && v.trim().length >= 10 && v.trim().length <= max ? v.trim() : null);
  const feels = Array.isArray(o.candidates) ? o.candidates.map((c) => t((c as Record<string, unknown> | null)?.feel)) : [];
  const common = t(o.common);
  const differ = t(o.differ);
  const howToCheck = t(o.howToCheck);
  if (feels.length !== count || feels.some((x) => x === null) || !common || !differ || !howToCheck) return null;
  if (containsForbidden([...(feels as string[]), common, differ, howToCheck].join(" "))) return null;
  return { feels: feels as string[], common, differ, howToCheck };
}

export function buildHoursMessage(gender: Gender, cands: HourCandidate[]): string {
  const payload = {
    성별: gender === "female" ? "여성" : "남성",
    후보: cands.map((c, i) => ({ 번호: i + 1, 시간대: c.window, 네기둥_연월일시: c.pillars, 사주핵심: c.core ?? "계산 실패" })),
  };
  return `시간대별 후보:\n${JSON.stringify(payload, null, 2)}\n\n후보 ${cands.length}개를 순서대로 비교해 줘.`;
}

/** 후보가 둘 이상일 때만 AI 를 불러요. 하나뿐이면 계산만으로 "범위 안에서는 같아요"를 알려줘요. */
export async function compareHours(o: { base: BirthInput; start: number; end: number; coreFor?: (i: BirthInput) => CoreFacts | null; apiKey?: string; model?: string; fetchImpl?: typeof fetch; skipAi?: boolean }): Promise<HourResult> {
  const cands = findCandidates(o.base, o.start, o.end, o.coreFor);
  if (cands.length <= 1) {
    const c = cands[0];
    return {
      same: true,
      candidates: c ? [{ window: c.window, pillars: c.pillars, feel: "이 시간대 안에서는 사주가 바뀌지 않아요." }] : [],
      common: "고른 범위 안에서는 시주가 같아서, 어느 시각에 태어났어도 풀이가 달라지지 않아요.",
      differ: "달라지는 부분이 없어요. 안심하고 지금 풀이를 보셔도 돼요.",
      howToCheck: "더 정확히 알고 싶다면 부모님이나 출생증명서, 산모수첩의 시간을 확인해 보세요.",
    };
  }
  const ai = await callJson({
    system: HOURS_SYSTEM_PROMPT,
    user: buildHoursMessage(o.base.gender, cands),
    schema: HOURS_SCHEMA,
    parse: (v) => parseHours(v, cands.length),
    maxTokens: 2500,
    apiKey: o.apiKey,
    model: o.model,
    fetchImpl: o.fetchImpl,
  });
  return {
    same: false,
    candidates: cands.map((c, i) => ({ window: c.window, pillars: c.pillars, feel: ai.feels[i] })),
    common: ai.common,
    differ: ai.differ,
    howToCheck: ai.howToCheck,
  };
}
