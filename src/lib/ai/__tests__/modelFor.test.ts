import { describe, expect, it } from "vitest";
import { GEMINI_DEFAULT_MODEL, GEMINI_PAID_MODEL, DEFAULT_MODEL, PAID_MODEL, modelFor } from "../llm";

const g = { AI_PROVIDER: "gemini" };

describe("modelFor", () => {
  it("Gemini 기본값: 상담실은 일반 풀이와 같다", () => {
    expect(modelFor("free", g)).toBe(GEMINI_DEFAULT_MODEL);
    expect(modelFor("paid", g)).toBe(GEMINI_PAID_MODEL);
    expect(modelFor("chat", g)).toBe(GEMINI_DEFAULT_MODEL);
  });
  it("Gemini: 세 가지를 따로 정한다", () => {
    const env = { ...g, GEMINI_MODEL: "a", GEMINI_MODEL_PAID: "b", GEMINI_MODEL_CHAT: "c" };
    expect([modelFor("free", env), modelFor("paid", env), modelFor("chat", env)]).toEqual(["a", "b", "c"]);
  });
  it("Gemini: 상담실 값이 비면 일반 풀이 모델을 따른다", () => {
    expect(modelFor("chat", { ...g, GEMINI_MODEL: "a", GEMINI_MODEL_CHAT: "  " })).toBe("a");
  });
  it("Anthropic도 같은 규칙", () => {
    const a = { AI_PROVIDER: "anthropic" };
    expect(modelFor("chat", a)).toBe(DEFAULT_MODEL);
    expect(modelFor("paid", a)).toBe(PAID_MODEL);
    expect(modelFor("chat", { ...a, ANTHROPIC_MODEL: "x", ANTHROPIC_MODEL_CHAT: "y" })).toBe("y");
  });
});
