import { describe, expect, it } from "vitest";
import { MBTI_TYPES, parseMbti, parseMbtiResult } from "../mbti";

const good = {
  common: "둘 다 혼자 깊이 생각하는 시간이 필요하다고 말해요.",
  differ: "사주는 표현이 많은 편이라 하는데 MBTI는 아끼는 편이라 해요.",
  strength: "차분하게 상황을 읽고 정리하는 힘이 강점이에요.",
  caution: "혼자 오래 끌어안다 지치기 쉬워서 쉬는 틈이 필요해요.",
  tip: "이번 주엔 하루 한 번 생각을 짧게 말로 꺼내 봐요.",
};

describe("MBTI", () => {
  it("16가지만 받는다 (대소문자 무시)", () => {
    expect(MBTI_TYPES.length).toBe(16);
    expect(parseMbti("enfp")).toBe("ENFP");
    expect(parseMbti(" INTJ ")).toBe("INTJ");
    expect(parseMbti("XXXX")).toBeNull();
    expect(parseMbti(3)).toBeNull();
  });
  it("결과 검사: 정상은 통과, 짧거나 금지 표현이면 거른다", () => {
    expect(parseMbtiResult(good)?.tip).toBe(good.tip);
    expect(parseMbtiResult({ ...good, tip: "짧아" })).toBeNull();
    expect(parseMbtiResult({ ...good, caution: "이혼 위험이 커질 수 있어서 조심하세요 꼭이요." })).toBeNull();
  });
});
