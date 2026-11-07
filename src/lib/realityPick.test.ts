import { describe, expect, it } from "vitest";
import { readRealityPick, saveRealityPick } from "./realityPick";

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe("realityPick", () => {
  it("저장한 답을 다시 읽어요", () => {
    const s = mem();
    expect(readRealityPick(s, "질문", 3)).toBeNull();
    saveRealityPick(s, "질문", 1);
    expect(readRealityPick(s, "질문", 3)).toBe(1);
    expect(readRealityPick(s, "다른 질문", 3)).toBeNull();
  });
  it("범위를 벗어난 값은 무시해요", () => {
    const s = mem();
    saveRealityPick(s, "질문", 5);
    expect(readRealityPick(s, "질문", 3)).toBeNull();
  });
  it("저장소가 없어도 안 깨져요", () => {
    expect(readRealityPick(null, "질문", 3)).toBeNull();
    expect(() => saveRealityPick(null, "질문", 1)).not.toThrow();
  });
});
