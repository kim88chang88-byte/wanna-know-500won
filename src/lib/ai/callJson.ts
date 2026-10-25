import { DEFAULT_MODEL, ReadingFailedError, ReadingUnavailableError } from "./interpret";

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
  const apiKey = o.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ReadingUnavailableError();
  const model = o.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const fetchImpl = o.fetchImpl ?? fetch;
  let last = "알 수 없음";
  for (let i = 0; i < (o.attempts ?? 2); i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 700));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 25_000);
    try {
      const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model,
          max_tokens: o.maxTokens ?? 1500,
          system: o.system,
          messages: [{ role: "user", content: o.user }],
          output_config: { format: { type: "json_schema", schema: o.schema } },
        }),
        signal: ctrl.signal,
      });
      if (res.status === 429 || res.status >= 500) { last = `HTTP ${res.status}`; continue; }
      if (!res.ok) throw new ReadingFailedError(`HTTP ${res.status}`);
      const data = (await res.json()) as { stop_reason?: string; usage?: { input_tokens?: number; output_tokens?: number }; content?: Array<{ type: string; text?: string }> };
      o.onUsage?.({ input: data.usage?.input_tokens ?? 0, output: data.usage?.output_tokens ?? 0 });
      if (data.stop_reason === "refusal" || data.stop_reason === "max_tokens") { last = data.stop_reason; continue; }
      const text = data.content?.find((b) => b.type === "text")?.text;
      let json: unknown;
      try { json = text ? JSON.parse(text) : null; } catch { last = "JSON 해석 실패"; continue; }
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
