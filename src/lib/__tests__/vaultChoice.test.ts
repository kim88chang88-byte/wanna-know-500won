import { describe, expect, it } from "vitest";
import { readTodayChoice, saveChoice } from "../vaultFollowup";

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe("오늘 고른 안부 답 기억", () => {
  const now = new Date("2026-11-06T13:00:00+09:00");
  it("같은 날에는 고른 답을 그대로 돌려줘요", () => {
    const s = mem();
    saveChoice(s, "abc", 2, now);
    expect(readTodayChoice(s, new Date("2026-11-06T23:30:00+09:00"))).toEqual({ id: "abc", index: 2 });
  });
  it("날짜가 지나면 잊어요", () => {
    const s = mem();
    saveChoice(s, "abc", 1, now);
    expect(readTodayChoice(s, new Date("2026-11-07T00:10:00+09:00"))).toBeNull();
  });
  it("저장소가 없거나 값이 망가져 있어도 안전해요", () => {
    expect(readTodayChoice(null, now)).toBeNull();
    const s = mem();
    s.setItem("wanna500:vault-followup:choice:v1", "{oops");
    expect(readTodayChoice(s, now)).toBeNull();
    s.setItem("wanna500:vault-followup:choice:v1", JSON.stringify({ id: "a", index: -1, day: "x" }));
    expect(readTodayChoice(s, now)).toBeNull();
  });
});
