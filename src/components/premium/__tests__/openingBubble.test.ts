import { describe, expect, it } from "vitest";
import { openingBubble, prefaceBubble } from "../PremiumBook";

describe("openingBubble", () => {
  it("서문 뒤에 이어지는 말로, 이름을 반말로 부르며 시작해요", () => {
    const t = openingBubble("철수");
    expect(t.startsWith("철수야, 여기까지 사주가 뭔지")).toBe(true);
    expect(t).toContain("먼저 결론부터 말하고");
    expect(t).toContain("렛츠 시작");
    expect(t).not.toContain("차별점");
  });
  it("세 글자 이름은 성을 떼고 받침에 맞춰 불러요", () => {
    expect(openingBubble("장은혁").startsWith("은혁아, ")).toBe(true);
    expect(openingBubble("김하나").startsWith("하나야, ")).toBe(true);
  });
  it("닉네임이 없으면 이름 없이 시작해요", () => {
    expect(openingBubble(null).startsWith("여기까지 사주가 뭔지")).toBe(true);
  });
});

describe("prefaceBubble", () => {
  it("이름을 부르며 시작하고, 이름이 없으면 안녕! 으로 시작해요", () => {
    expect(prefaceBubble("장은혁").startsWith("안녕 은혁아! 내가 너의 사주팔자에 대해서")).toBe(true);
    expect(prefaceBubble("김하나").startsWith("안녕 하나야! ")).toBe(true);
    expect(prefaceBubble(null).startsWith("안녕! 내가")).toBe(true);
    expect(prefaceBubble("철수")).toContain("사주팔자가 뭔지만 간단히 설명해 줄게.");
  });
});
