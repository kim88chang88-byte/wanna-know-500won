import { afterEach, describe, expect, it, vi } from "vitest";

const state: { mode: "ok" | "limited" | "throw" | "hang" } = { mode: "ok" };

vi.mock("@/lib/db/supabase", () => ({
  loadDbConfig: () => ({ url: "https://x.supabase.co", serviceKey: "k" }),
  createDb: () => ({
    takeRateLimit: async () => {
      if (state.mode === "throw") throw new Error("HTTP 500");
      if (state.mode === "hang") return new Promise<number>(() => undefined);
      return state.mode === "limited" ? 42 : 0;
    },
  }),
}));

import { takeLimit, takeLimitStrict } from "../guard";

afterEach(() => {
  vi.useRealTimers();
});

describe("takeLimitStrict (로그인·인증번호용)", () => {
  it("DB 가 정상이면 통과하고, 한도에 걸렸으면 DB 가 알려준 시간만큼 막아요", async () => {
    state.mode = "ok";
    expect((await takeLimitStrict("s-ok", "e:1", 5, 60_000)).ok).toBe(true);
    state.mode = "limited";
    expect(await takeLimitStrict("s-lim", "e:1", 5, 60_000)).toEqual({ ok: false, retryAfterSec: 42 });
  });

  it("DB 가 오류이면 통과시키지 않고 막아요 (보통 제한은 계속 통과)", async () => {
    state.mode = "throw";
    expect(await takeLimitStrict("s-err", "e:1", 5, 60_000)).toEqual({ ok: false, retryAfterSec: 30 });
    expect((await takeLimit("n-err", "e:1", 5, 60_000)).ok).toBe(true);
  });

  it("DB 가 3초 안에 답하지 않아도 막아요", async () => {
    vi.useFakeTimers();
    state.mode = "hang";
    const p = takeLimitStrict("s-hang", "e:1", 5, 60_000);
    await vi.advanceTimersByTimeAsync(3100);
    expect(await p).toEqual({ ok: false, retryAfterSec: 30 });
  });

  it("서버 메모리 제한은 DB 와 상관없이 먼저 적용돼요", async () => {
    state.mode = "ok";
    expect((await takeLimitStrict("s-mem", "e:1", 1, 60_000)).ok).toBe(true);
    expect((await takeLimitStrict("s-mem", "e:1", 1, 60_000)).ok).toBe(false);
  });
});
