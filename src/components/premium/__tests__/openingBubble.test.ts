import { describe, expect, it } from "vitest";
import { openingBubble } from "../PremiumBook";

describe("openingBubble", () => {
  it("닉네임이 있으면 인사에 이름과 '님'이 들어가요", () => {
    const t = openingBubble("철수");
    expect(t.startsWith("안녕하세요, 철수님, 너무 반가워요! ")).toBe(true);
    expect(t).toContain("핵심 결론부터 먼저 말씀드리는 차별점이 있어요");
    expect(t.endsWith("그 해답을 알아볼까요?")).toBe(true);
  });
  it("닉네임이 없으면 이름 없이 인사해요", () => {
    expect(openingBubble(null).startsWith("안녕하세요, 너무 반가워요! ")).toBe(true);
  });
});
