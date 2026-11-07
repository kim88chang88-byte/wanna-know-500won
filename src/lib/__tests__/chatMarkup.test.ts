import { describe, expect, it } from "vitest";
import { plainAnswer, splitElements, splitMood, tidyMarkup } from "../chatMarkup";

describe("chatMarkup", () => {
  it("맨 앞 이모지를 떼어 내요", () => {
    expect(splitMood("📝 좋은 질문이야!")).toEqual({ emoji: "📝", rest: "좋은 질문이야!" });
    expect(splitMood("좋은 질문이야 📝")).toEqual({ emoji: null, rest: "좋은 질문이야 📝" });
    expect(splitMood("📝 ")).toEqual({ emoji: null, rest: "📝 " });
  });
  it("오행 표시를 알약 조각으로 나눠요", () => {
    expect(splitElements("은혁님은 [[물]] 기운이 깊어")).toEqual([{ text: "은혁님은 " }, { el: "water", name: "물" }, { text: " 기운이 깊어" }]);
  });
  it("덜 써진 표시는 숨겨요", () => {
    expect(splitElements("물 기운은 [[물")).toEqual([{ text: "물 기운은 " }]);
    expect(splitElements("끝에 [")).toEqual([{ text: "끝에 " }]);
  });
  it("복사용 글은 알약 표시를 풀어요", () => {
    expect(plainAnswer("[[불]]과 [[땅]]")).toBe("불과 땅");
  });
  it("서버 정리: 알 수 없는 표시는 풀고 알약은 3개까지", () => {
    expect(tidyMarkup("[[하늘]]이 맑아")).toBe("하늘이 맑아");
    expect(tidyMarkup("[[물]] [[불]] [[땅]] [[쇠]]")).toBe("[[물]] [[불]] [[땅]] 쇠");
  });
});
