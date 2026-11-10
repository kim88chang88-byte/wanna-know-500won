import { describe, expect, it } from "vitest";
import { openingBubble } from "../PremiumBook";

describe("openingBubble", () => {
  it("닉네임이 있으면 반말로 이름을 불러 인사해요", () => {
    const t = openingBubble("철수");
    expect(t.startsWith("안녕, 철수야, 너무 반가워! ")).toBe(true);
    expect(t).toContain("핵심 결론부터 먼저 말해 주는 차별점이 있어");
    expect(t.endsWith("그 해답을 알아볼까?")).toBe(true);
  });
  it("세 글자 이름은 성을 떼고 받침에 맞춰 불러요", () => {
    expect(openingBubble("장은혁").startsWith("안녕, 은혁아, ")).toBe(true);
    expect(openingBubble("김하나").startsWith("안녕, 하나야, ")).toBe(true);
  });
  it("닉네임이 없으면 이름 없이 인사해요", () => {
    expect(openingBubble(null).startsWith("안녕, 너무 반가워! ")).toBe(true);
  });
});
