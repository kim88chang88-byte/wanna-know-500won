import { SazuApiError, SazuClient } from "@sazuapp/client";
import type { SazuErrorBody, SazuFormInput } from "./types";

// 이 파일은 서버(API route)에서만 불러오세요. API 키가 브라우저로 나가면 안 돼요.

export class SazuNotConfiguredError extends Error {
  constructor() {
    super("SAZU_API_KEY is not set");
    this.name = "SazuNotConfiguredError";
  }
}

let cached: SazuClient | null = null;
let cachedKey: string | undefined;

function getClient(): SazuClient {
  const apiKey = process.env.SAZU_API_KEY;
  if (!apiKey) throw new SazuNotConfiguredError();
  if (!cached || cachedKey !== apiKey) {
    cached = new SazuClient({ apiKey });
    cachedKey = apiKey;
  }
  return cached;
}

/** 만세력 리딩(v2). 모듈 선택 없이 이 메서드 하나로 끝나요. */
export async function fetchManse(input: SazuFormInput): Promise<unknown> {
  const sazu = getClient();
  return sazu.readings.manse({
    birthYear: input.year,
    birthMonth: input.month, // 1~12 (Date.getMonth() 의 0~11 이 아니에요)
    birthDay: input.day,
    birthHour: input.hour,
    birthMinute: input.minute,
    isFemale: input.isFemale,
    isLunar: input.isLunar,
    birthCity: input.city,
  });
}

/** 에러를 사용자에게 보여 줄 문장과 HTTP 상태로 바꿔요. 키·내부 메시지는 응답에 넣지 않아요. */
export function toErrorResponse(err: unknown): { status: number; body: SazuErrorBody } {
  if (err instanceof SazuNotConfiguredError) {
    return { status: 503, body: { code: "not_configured", error: "프리미엄 리포트는 아직 준비 중이에요. 조금만 기다려 주세요 🫧" } };
  }
  if (err instanceof SazuApiError) {
    if (err.isAuthError) {
      // 키가 틀렸거나 폐기됨 — 운영자가 고쳐야 해요. 사용자에게는 중립적으로 안내해요.
      console.error("SAZU auth error:", err.message);
      return { status: 503, body: { code: "auth", error: "지금은 리포트를 만들 수 없어요. 곧 다시 열릴 거예요." } };
    }
    if (err.isRateLimited) {
      return { status: 429, body: { code: "rate_limited", error: "요청이 많아요. 잠시 뒤에 다시 시도해 주세요." } };
    }
    if (err.isTransient) {
      return { status: 502, body: { code: "transient", error: "일시적으로 연결이 불안정해요. 잠시 뒤에 다시 시도해 주세요." } };
    }
    console.error("SAZU api error:", err.message);
    return { status: 400, body: { code: "bad_request", error: "입력한 정보로는 리포트를 만들 수 없어요. 생년월일시를 다시 확인해 주세요." } };
  }
  console.error("SAZU unexpected error:", err instanceof Error ? err.message : "unknown");
  return { status: 500, body: { code: "failed", error: "리포트를 만들지 못했어요. 잠시 뒤에 다시 시도해 주세요." } };
}
