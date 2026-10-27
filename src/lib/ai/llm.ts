/*
 * 모델 호출을 한 곳에 모은 어댑터예요. 환경변수로 Anthropic(Claude)과 Google Gemini 를 골라요.
 *  - AI_PROVIDER = "gemini" | "anthropic" (비우면: Anthropic 키가 있으면 anthropic, 없고 Gemini 키가 있으면 gemini)
 *  - Gemini: GEMINI_API_KEY, GEMINI_MODEL(500원), GEMINI_MODEL_PAID(프리미엄)
 *  - Anthropic: ANTHROPIC_API_KEY, ANTHROPIC_MODEL, ANTHROPIC_MODEL_PAID
 * 호출하는 쪽은 "시스템 글 + 사용자 글 + JSON 스키마"만 넘기면 되고, 결과는 같은 모양으로 돌려받아요.
 */

import { readingFirst } from "@/lib/hanjaReading";

export type Provider = "anthropic" | "gemini";
export type Tier = "free" | "paid";

export const DEFAULT_MODEL = "claude-haiku-5-5";
export const PAID_MODEL = "claude-sonnet-5-5";
export const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash-lite";
export const GEMINI_PAID_MODEL = "gemini-3.8-flash";

type Env = Record<string, string | undefined>;

export function activeProvider(env: Env = process.env): Provider {
  const p = (env.AI_PROVIDER ?? "").trim().toLowerCase();
  if (p === "gemini" || p === "anthropic") return p;
  if (env.ANTHROPIC_API_KEY) return "anthropic";
  if (env.GEMINI_API_KEY) return "gemini";
  return "anthropic";
}

/** 지금 쓰는 제공자의 API 키. 없으면 undefined. */
export function aiKey(env: Env = process.env): string | undefined {
  const k = activeProvider(env) === "gemini" ? env.GEMINI_API_KEY : env.ANTHROPIC_API_KEY;
  return k || undefined;
}

export function hasAiKey(env: Env = process.env): boolean {
  return !!aiKey(env);
}

/** 제공자별 기본 모델. paid 는 프리미엄 장 풀이용(더 똑똑한 모델). */
export function modelFor(tier: Tier, env: Env = process.env): string {
  if (activeProvider(env) === "gemini") {
    return tier === "paid" ? (env.GEMINI_MODEL_PAID || GEMINI_PAID_MODEL) : (env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL);
  }
  return tier === "paid" ? (env.ANTHROPIC_MODEL_PAID || PAID_MODEL) : (env.ANTHROPIC_MODEL || DEFAULT_MODEL);
}

export interface LlmRequest {
  system: string;
  user: string;
  /** JSON 스키마. 두 제공자 모두 구조화 JSON 으로 답하게 해요. */
  schema: object;
  maxTokens: number;
  model: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export type LlmResult =
  /** 429·5xx 처럼 잠깐 뒤 다시 해 볼 만한 실패 */
  | { kind: "retry"; reason: string }
  /** 키 오류·잘못된 요청 등 다시 해도 소용없는 실패. detail 은 운영자가 로그로 볼 짧은 사유 */
  | { kind: "fatal"; detail: string }
  /** 모델 거절·길이 초과로 잘림 */
  | { kind: "blocked"; reason: "refusal" | "max_tokens" }
  | { kind: "ok"; text: string | null; usage: { input: number; output: number } };

async function errorMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: { message?: string } } | null;
    return j?.error?.message ?? "";
  } catch {
    return "";
  }
}

function shortDetail(status: number, msg: string, billing: RegExp, billingText: string): string {
  if (billing.test(msg)) return `HTTP ${status} ${billingText}`;
  const short = msg.replace(/\s+/g, " ").slice(0, 80);
  return short ? `HTTP ${status} ${short}` : `HTTP ${status}`;
}

async function callAnthropic(r: LlmRequest): Promise<LlmResult> {
  const f = r.fetchImpl ?? fetch;
  const res = await f("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": r.apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: r.model,
      max_tokens: r.maxTokens,
      system: r.system,
      messages: [{ role: "user", content: r.user }],
      output_config: { format: { type: "json_schema", schema: r.schema } },
    }),
    signal: r.signal,
  });
  if (res.status === 429 || res.status >= 500) return { kind: "retry", reason: `HTTP ${res.status}` };
  if (!res.ok) {
    return { kind: "fatal", detail: shortDetail(res.status, await errorMessage(res), /credit balance|billing|purchase credits/i, "크레딧 잔액 부족(Anthropic Billing 확인)") };
  }
  const data = (await res.json()) as { stop_reason?: string; usage?: { input_tokens?: number; output_tokens?: number }; content?: Array<{ type: string; text?: string }> };
  const usage = { input: data.usage?.input_tokens ?? 0, output: data.usage?.output_tokens ?? 0 };
  if (data.stop_reason === "refusal") return { kind: "blocked", reason: "refusal" };
  if (data.stop_reason === "max_tokens") return { kind: "blocked", reason: "max_tokens" };
  return { kind: "ok", text: data.content?.find((b) => b.type === "text")?.text ?? null, usage };
}

/** Gemini 는 생각(thinking) 토큰도 출력 한도에서 쓰는 모델이 많아, 한도에 여유를 더해 줘요. */
const GEMINI_HEADROOM = 3000;

async function callGemini(r: LlmRequest): Promise<LlmResult> {
  const f = r.fetchImpl ?? fetch;
  const res = await f(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(r.model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": r.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: r.system }] },
      contents: [{ role: "user", parts: [{ text: r.user }] }],
      generationConfig: {
        maxOutputTokens: r.maxTokens + GEMINI_HEADROOM,
        responseMimeType: "application/json",
        responseJsonSchema: r.schema,
      },
    }),
    signal: r.signal,
  });
  if (res.status === 429 || res.status >= 500) return { kind: "retry", reason: `HTTP ${res.status}` };
  if (!res.ok) {
    return { kind: "fatal", detail: shortDetail(res.status, await errorMessage(res), /quota|billing|RESOURCE_EXHAUSTED|API key not valid|API_KEY_INVALID/i, "키 또는 요금제 확인(Google AI Studio)") };
  }
  const data = (await res.json()) as {
    promptFeedback?: { blockReason?: string };
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  };
  const usage = {
    input: data.usageMetadata?.promptTokenCount ?? 0,
    output: (data.usageMetadata?.candidatesTokenCount ?? 0) + (data.usageMetadata?.thoughtsTokenCount ?? 0),
  };
  if (data.promptFeedback?.blockReason) return { kind: "blocked", reason: "refusal" };
  const cand = data.candidates?.[0];
  const fr = cand?.finishReason;
  if (fr === "MAX_TOKENS") return { kind: "blocked", reason: "max_tokens" };
  if (fr && fr !== "STOP") return { kind: "blocked", reason: "refusal" };
  const text = (cand?.content?.parts ?? []).filter((p) => !p.thought && typeof p.text === "string").map((p) => p.text).join("") || null;
  return { kind: "ok", text, usage };
}

/** 제공자에 맞는 호출을 해서 같은 모양의 결과로 돌려줘요. 네트워크 오류·시간 초과는 던지니 호출하는 쪽 try/catch 로 받으세요. */
export async function callLlm(r: LlmRequest, env: Env = process.env): Promise<LlmResult> {
  const res = await (activeProvider(env) === "gemini" ? callGemini(r) : callAnthropic(r));
  // 풀이 속 한자는 모두 "음(한자)" 모양으로 맞춰서 돌려줘요. (예: 병오(丙午))
  return res.kind === "ok" && res.text ? { ...res, text: readingFirst(res.text) } : res;
}
