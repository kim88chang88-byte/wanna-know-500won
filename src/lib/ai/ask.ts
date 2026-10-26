import { analyzeChart } from "@/lib/saju/analysis";
import type { Gender, SajuChart } from "@/lib/saju/types";
import type { CoreFacts } from "./coreFacts";
import { containsForbidden, isGeneric } from "./reading";
import { trimToLastSentence } from "@/lib/storyHelpers";
import { SYSTEM_PROMPT } from "./prompt";
import type { AskQuestion } from "./askQuestions";
import { ReadingFailedError, ReadingUnavailableError } from "./interpret";
import { aiKey, callLlm, modelFor } from "./llm";

export const ASK_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

지금은 "더 물어보기" 모드야. 사용자가 고른 질문 하나에 JSON 의 answer 로만 답해.
- 반말, 220~380자. 3~5문장. 첫 문장은 질문에 바로 답하는 결론, 다음은 "왜 그런지" 사주 근거를 쉬운 말로(용어는 괄호로 짧게), 마지막은 이번 주에 해 볼 작은 행동 하나.
- 근거는 "계산된 사주 정보"에 실제로 있는 것만 써. 없는 합충·신살은 지어내지 마. 근거가 부족하면 "이 부분은 사주만으로 단정하긴 어려워"라고 솔직히 말하고, 칭찬으로 포장하지 마.
- 흐름은 숨기지 말고 그대로 말하되, 해석은 긍정적으로: 약한 때는 "채울 여지", 강한 때는 "잡을 때"로. 금액·나이 같은 숫자는 말하지 마. 끝에 "지금 실제로는 어때?" 하고 가볍게 되물어도 좋아.
- 좋은 점과 조심할 점을 같이 말하되, 겁주지 말고 "~기 쉬워/~일 수 있어"로.
- "sum" 질문은 번호 없이 줄바꿈으로 3줄만, 마지막 줄에 응원 한마디.`;

export const ASK_SCHEMA = {
  type: "object",
  properties: { answer: { type: "string", description: "도리의 답변. 220~380자 안팎, 최대 600자" } },
  required: ["answer"],
  additionalProperties: false,
} as const;

const MIN = 60;
const MAX = 600;

/** 너무 길게 온 답은 버리지 않고, 600자 안의 마지막 완성 문장까지만 써요. */
function fitLength(t: string): string {
  if (t.length <= MAX) return t;
  return trimToLastSentence(t.slice(0, MAX));
}

export function parseAnswer(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const a = (value as Record<string, unknown>).answer;
  if (typeof a !== "string") return null;
  const t = fitLength(a.trim());
  if (t.length < MIN || t.length > MAX) return null;
  if (isGeneric(t) || containsForbidden(t)) return null;
  return t;
}

export function buildAskMessage(chart: SajuChart, gender: Gender, q: AskQuestion, core: CoreFacts | null): string {
  const facts = analyzeChart(chart);
  const payload = {
    성별: gender === "female" ? "여성" : "남성",
    일간: `${facts.dayMaster.hanja}(${facts.dayMaster.hangul}) · ${facts.dayMaster.elementKo} · ${facts.dayMaster.yinYang === "yang" ? "양" : "음"}`,
    네기둥: facts.pillars.map((p) => `${p.label} ${p.text}`),
    오행분포: { 목: facts.elementCounts.wood, 화: facts.elementCounts.fire, 토: facts.elementCounts.earth, 금: facts.elementCounts.metal, 수: facts.elementCounts.water },
    ...(core ? { 사주핵심: core } : {}),
    태어난시간: facts.hourKnown ? "알고 있음" : "모름 (시주 없이 6글자로 본 결과)",
  };
  return `계산된 사주 정보:\n${JSON.stringify(payload, null, 2)}\n\n사용자가 고른 질문: "${q.label}" (id: ${q.id})\n답할 때 볼 것: ${q.focus}`;
}

interface Opts {
  chart: SajuChart;
  gender: Gender;
  question: AskQuestion;
  core: CoreFacts | null;
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** 칩 질문 하나에 답을 만들어요. 키가 없으면 ReadingUnavailableError, 실패하면 ReadingFailedError. */
export async function askDori(o: Opts): Promise<string> {
  const apiKey = o.apiKey ?? aiKey();
  if (!apiKey) throw new ReadingUnavailableError();
  const model = o.model ?? modelFor("free");
  let last = "알 수 없음";
  // 막히면(과부하·형식 어긋남) 잠깐 쉬고 세 번까지 시도해요. 한 번에 18초, 합쳐서 60초 안에 끝나요.
  for (let i = 0; i < 3; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 700));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 18_000);
    try {
      const r = await callLlm({ system: ASK_SYSTEM_PROMPT, user: buildAskMessage(o.chart, o.gender, o.question, o.core), schema: ASK_SCHEMA, maxTokens: 1200, model, apiKey, fetchImpl: o.fetchImpl, signal: ctrl.signal });
      if (r.kind === "retry") { last = r.reason; continue; }
      if (r.kind === "fatal") throw new ReadingFailedError(r.detail);
      if (r.kind === "blocked") { last = r.reason; continue; }
      let json: unknown;
      try { json = r.text ? JSON.parse(r.text) : null; } catch { last = "JSON 해석 실패"; continue; }
      const ans = parseAnswer(json);
      if (ans) return ans;
      last = "형식 또는 금지 표현 검사 실패";
    } catch (err) {
      if (err instanceof ReadingFailedError) throw err;
      last = err instanceof Error && err.name === "AbortError" ? "시간 초과" : "네트워크 오류";
    } finally {
      clearTimeout(timer);
    }
  }
  throw new ReadingFailedError(last);
}
