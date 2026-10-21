import { analyzeChart } from "@/lib/saju/analysis";
import type { Gender, SajuChart } from "@/lib/saju/types";
import { callJson } from "./callJson";
import type { CoreFacts } from "./coreFacts";
import { SYSTEM_PROMPT } from "./prompt";
import { containsForbidden } from "./reading";

/* 사주 × MBTI 교차. 두 체계가 같은 말을 하는 곳과 다르게 말하는 곳을 쉬운 말로 짚어요. */

export const MBTI_TYPES = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"] as const;
export type Mbti = (typeof MBTI_TYPES)[number];

export function parseMbti(raw: unknown): Mbti | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toUpperCase();
  return (MBTI_TYPES as readonly string[]).includes(v) ? (v as Mbti) : null;
}

export interface MbtiResult {
  common: string;
  differ: string;
  strength: string;
  caution: string;
  tip: string;
}

export const MBTI_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

지금은 "사주 × MBTI 교차" 모드야. 사주(일간·오행·십성·신강신약 등)와 사용자가 고른 MBTI 를 나란히 놓고 풀어줘.
- 반말. 각 항목 1~2문장, 쉬운 말로. 사주 용어는 괄호로 짧게. 재미있게, 하지만 억지로 끼워 맞추지 마. 안 맞는 부분은 안 맞는다고 말해.
- common: 둘이 같은 말을 하는 지점. differ: 서로 다르게 말하는 지점과 이유 추정. strength: 둘이 동시에 가리키는 강점. caution: 둘 다 살짝 알려주는 마음 써야 할 점(겁주지 말고 부드럽게). tip: 이 조합에 맞는 일하는 방식·관계 팁과 이번 주 작은 행동 하나.
- 근거는 "계산된 사주 정보"에 실제로 있는 것만 써. 지어내지 마. 질병·이혼·사고·파산·투자·의료·법률 얘기 금지.`;

const f = (d: string) => ({ type: "string", description: d });
export const MBTI_SCHEMA = {
  type: "object",
  properties: { common: f("사주와 MBTI의 공통점. 1~2문장"), differ: f("서로 다르게 말하는 점과 이유 추정. 1~2문장"), strength: f("동시에 가리키는 강점. 1~2문장"), caution: f("둘 다 알려주는 마음 쓸 점. 1~2문장"), tip: f("일하는 방식·관계 팁과 작은 행동 하나. 1~2문장") },
  required: ["common", "differ", "strength", "caution", "tip"],
  additionalProperties: false,
} as const;

export function parseMbtiResult(value: unknown): MbtiResult | null {
  if (typeof value !== "object" || value === null) return null;
  const o = value as Record<string, unknown>;
  const pick = (k: string): string | null => {
    const v = o[k];
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t.length >= 10 && t.length <= 300 ? t : null;
  };
  const [common, differ, strength, caution, tip] = ["common", "differ", "strength", "caution", "tip"].map(pick);
  if (!common || !differ || !strength || !caution || !tip) return null;
  return containsForbidden([common, differ, strength, caution, tip].join(" ")) ? null : { common, differ, strength, caution, tip };
}

export function buildMbtiMessage(chart: SajuChart, gender: Gender, mbti: Mbti, core: CoreFacts | null): string {
  const facts = analyzeChart(chart);
  const payload = {
    성별: gender === "female" ? "여성" : "남성",
    일간: `${facts.dayMaster.hanja}(${facts.dayMaster.hangul}) · ${facts.dayMaster.elementKo} · ${facts.dayMaster.yinYang === "yang" ? "양" : "음"}`,
    네기둥: facts.pillars.map((p) => `${p.label} ${p.text}`),
    오행분포: { 목: facts.elementCounts.wood, 화: facts.elementCounts.fire, 토: facts.elementCounts.earth, 금: facts.elementCounts.metal, 수: facts.elementCounts.water },
    ...(core ? { 사주핵심: core } : {}),
    태어난시간: facts.hourKnown ? "알고 있음" : "모름 (시주 없이 6글자로 본 결과)",
    MBTI: mbti,
  };
  return `계산된 사주 정보:\n${JSON.stringify(payload, null, 2)}\n\n사주와 MBTI(${mbti})를 교차해서 풀어줘.`;
}

export function crossMbti(o: { chart: SajuChart; gender: Gender; mbti: Mbti; core: CoreFacts | null; apiKey?: string; model?: string; fetchImpl?: typeof fetch }): Promise<MbtiResult> {
  return callJson({ system: MBTI_SYSTEM_PROMPT, user: buildMbtiMessage(o.chart, o.gender, o.mbti, o.core), schema: MBTI_SCHEMA, parse: parseMbtiResult, maxTokens: 1500, apiKey: o.apiKey, model: o.model, fetchImpl: o.fetchImpl });
}
