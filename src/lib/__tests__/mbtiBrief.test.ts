import { describe, expect, it } from "vitest";
import { DAYMASTER_BRIEF, MBTI_BRIEF, cleanMbti } from "../mbtiBrief";
import { MBTI_TYPES } from "../ai/mbtiTypes";

describe("mbtiBrief", () => {
  it("16유형이 모두 한 줄 설명을 가진다", () => {
    for (const t of MBTI_TYPES) expect(MBTI_BRIEF[t]).toBeTruthy();
  });
  it("오행 다섯이 모두 설명을 가진다", () => {
    expect(Object.keys(DAYMASTER_BRIEF).sort()).toEqual(["earth", "fire", "metal", "water", "wood"]);
  });
  it("cleanMbti 는 대소문자를 맞추고 잘못된 값은 비운다", () => {
    expect(cleanMbti("enfp")).toBe("ENFP");
    expect(cleanMbti("XXXX")).toBe("");
    expect(cleanMbti("toString")).toBe("");
    expect(cleanMbti(null)).toBe("");
  });
});
