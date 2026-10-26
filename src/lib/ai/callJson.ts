import { ReadingFailedError, ReadingUnavailableError } from "./interpret";
import { aiKey, callLlm, modelFor } from "./llm";

/** 구조화 JSON 답변을 받는 공통 호출. 형식이 어긋나면 한 번 더 시도해요. 키가 없으면 ReadingUnavailableError, 실패하면 ReadingFailedError. */
export async function callJson<T>(o: {
  system: string;
  user: string;
  schema: object;
  parse: (v: unknown) => T | null;
  maxTokens?: number;
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  attempts?: number;
  /** 호출마다 쓴 토큰 수를 알려 줘요(비용 측정용). */
  onUsage?: (u: { input: number; output: number }) => void;
}): Promise<T> {
  const apiKey = o.apiKey ?? aiKey();
  if (!apiKey) throw new ReadingUnavailableError();
  const model = o.model ?? modelFor("free");
  let last = "알 수 없음";
  for (let i = 0; i < (o.attempts ?? 2); i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 700));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 25_000);
    try {
      const r = await callLlm({ system: o.system, user: o.user, schema: o.schema, maxTokens: o.maxTokens ?? 1500, model, apiKey, fetchImpl: o.fetchImpl, signal: ctrl.signal });
      if (r.kind === "retry") { last = r.reason; continue; }
      if (r.kind === "fatal") {
        console.error("AI 호출 실패:", r.detail);
        throw new ReadingFailedError(r.detail);
      }
      if (r.kind === "blocked") { last = r.reason; continue; }
      o.onUsage?.(r.usage);
      let json: unknown;
      try { json = r.text ? JSON.parse(r.text) : null; } catch { last = "JSON 해석 실패"; continue; }
      const parsed = o.parse(json);
      if (parsed !== null) return parsed;
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
