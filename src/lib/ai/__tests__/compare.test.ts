import { describe, expect, it } from "vitest";
import { cleanOption, parseCompare } from "../compare";

const good = {
  lean: "B",
  summary: "지금은 B 쪽이 흐름에 조금 더 맞아 보여요.",
  whyA: "안정적으로 쌓는 방식이 일간의 성향과 어울려요.",
  whyB: "올해 세운이 변화를 부추겨서 움직이기 쉬운 해예요.",
  hardA: "승진까지 시간이 걸려 답답할 수 있어요.",
  hardB: "새 환경 적응에 에너지가 많이 들 수 있어요.",
  timing: "11월경부터 흐름이 부드러워져서 준비하기 좋아요.",
  questions: ["연봉 외에 내가 원하는 게 뭐지?", "1년 뒤에 후회가 덜할 쪽은?", "두 곳 모두 알아본 정보가 충분한가?"],
};

describe("선택지 정리", () => {
  it("공백을 정리하고 길이를 검사한다", () => {
    expect(cleanOption("  회사에   남는다 ")).toEqual({ ok: true, value: "회사에 남는다" });
    expect(cleanOption("a").ok).toBe(false);
    expect(cleanOption("가".repeat(41)).ok).toBe(false);
    expect(cleanOption(3).ok).toBe(false);
  });
  it("건강·법률·투자 같은 무거운 주제는 거절한다", () => {
    expect(cleanOption("수술을 받는다").ok).toBe(false);
    expect(cleanOption("코인에 몰빵한다").ok).toBe(false);
    expect(cleanOption("이혼한다").ok).toBe(false);
  });
});

describe("비교 결과 검사", () => {
  it("정상 값은 통과한다", () => {
    expect(parseCompare(good)?.lean).toBe("B");
  });
  it("질문이 3개가 아니거나 lean 이 이상하면 거른다", () => {
    expect(parseCompare({ ...good, questions: ["하나뿐인 질문이에요?"] })).toBeNull();
    expect(parseCompare({ ...good, lean: "C" })).toBeNull();
  });
  it("금지 표현이 있으면 거른다", () => {
    expect(parseCompare({ ...good, hardA: "자칫하면 파산 위험이 있어서 문제가 커질 수 있어요." })).toBeNull();
  });
});
