import type { Concern } from "@/lib/concerns";
import type { Gender, SajuChart } from "@/lib/saju/types";
import { buildUserMessage, SYSTEM_PROMPT, type ExtraFacts } from "./prompt";
import { parseReading, READING_SCHEMA, type Reading, type ReadingTopic } from "./reading";

/** API 키가 설정되지 않은 경우 (개발 중에는 정상 상황이에요) */
export class ReadingUnavailableError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY 가 설정되지 않았어요.");
    this.name = "ReadingUnavailableError";
  }
}

/** 풀이를 만들지 못한 경우 (네트워크 오류, 모델 거절, 형식 불일치 등) */
export class ReadingFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReadingFailedError";
  }
}

export interface InterpretOptions {
  topic: ReadingTopic;
  gender: Gender;
  /** 요즘 고민 (선택) */
  concern?: Concern | null;
  /** 오늘의 일진·사주 핵심 같은 추가 재료 (선택). 오늘 날짜는 한국 기준으로 넘겨 주세요. */
  extra?: ExtraFacts;
  /** 테스트용. 기본은 환경변수 ANTHROPIC_API_KEY */
  apiKey?: string;
  /** 기본은 환경변수 ANTHROPIC_MODEL, 없으면 DEFAULT_MODEL. tier "paid" 면 ANTHROPIC_MODEL_PAID, 없으면 PAID_MODEL */
  model?: string;
  /** 유료 풀이는 더 똑똑한 모델을 써요. 기본은 무료. */
  tier?: "free" | "paid";
  /** 테스트용. 기본은 전역 fetch */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** 형식이 어긋났을 때 다시 시도하는 최대 횟수(처음 시도 포함) */
  maxAttempts?: number;
}

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";
/** 500원 한 건에 맞게 가볍고 싼 모델이 기본값이에요. 품질이 아쉬우면 ANTHROPIC_MODEL 로 바꾸세요. */
export const DEFAULT_MODEL = "claude-haiku-5-5";
/** 유료(500원 이상) 풀이 기본 모델 */
export const PAID_MODEL = "claude-sonnet-5-5";
const MAX_TOKENS = 1500;

interface ApiResponse {
  stop_reason?: string;
  content?: Array<{ type: string; text?: string }>;
}

type Attempt = { reading: Reading } | { retry: true; reason: string } | { fatal: string };

async function attemptOnce(chart: SajuChart, o: Required<Pick<InterpretOptions, "topic" | "gender">> & {
  concern?: Concern | null;
  extra?: ExtraFacts;
  apiKey: string; model: string; fetchImpl: typeof fetch; timeoutMs: number;
}): Promise<Attempt> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs);
  try {
    const res = await o.fetchImpl(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": o.apiKey, "anthropic-version": API_VERSION },
      body: JSON.stringify({
        model: o.model,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserMessage(chart, o.topic, o.gender, o.concern, o.extra) }],
        output_config: { format: { type: "json_schema", schema: READING_SCHEMA } },
      }),
      signal: ctrl.signal,
    });

    // 응답 본문은 로그에 남기지 않아요. (키/입력값이 섞여 있을 수 있어서 상태 코드만 씁니다)
    if (res.status === 429 || res.status >= 500) return { retry: true, reason: `HTTP ${res.status}` };
    if (!res.ok) return { fatal: `HTTP ${res.status}` };

    const data = (await res.json()) as ApiResponse;
    if (data.stop_reason === "refusal") return { retry: true, reason: "모델이 답변을 거절함" };
    if (data.stop_reason === "max_tokens") return { retry: true, reason: "답변이 잘림" };

    const text = data.content?.find((b) => b.type === "text")?.text;
    if (!text) return { retry: true, reason: "텍스트 응답 없음" };
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { retry: true, reason: "JSON 해석 실패" };
    }
    const reading = parseReading(json);
    return reading ? { reading } : { retry: true, reason: "형식 또는 금지 표현 검사 실패" };
  } catch (err) {
    return { retry: true, reason: err instanceof Error && err.name === "AbortError" ? "시간 초과" : "네트워크 오류" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 계산된 사주 명식을 받아 풀이(Reading)를 만듭니다. 서버에서만 호출하세요. (API 키가 필요해요)
 * - 키가 없으면 ReadingUnavailableError
 * - 재시도 후에도 실패하면 ReadingFailedError
 */
export async function interpretSaju(chart: SajuChart, opts: InterpretOptions): Promise<Reading> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ReadingUnavailableError();

  const model = opts.model ?? (opts.tier === "paid" ? (process.env.ANTHROPIC_MODEL_PAID ?? PAID_MODEL) : (process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL));
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 25_000;
  const maxAttempts = Math.max(1, opts.maxAttempts ?? 2);

  let lastReason = "알 수 없음";
  for (let i = 0; i < maxAttempts; i++) {
    const r = await attemptOnce(chart, { topic: opts.topic, gender: opts.gender, concern: opts.concern, extra: opts.extra, apiKey, model, fetchImpl, timeoutMs });
    if ("reading" in r) return r.reading;
    if ("fatal" in r) throw new ReadingFailedError(r.fatal);
    lastReason = r.reason;
  }
  throw new ReadingFailedError(lastReason);
}
