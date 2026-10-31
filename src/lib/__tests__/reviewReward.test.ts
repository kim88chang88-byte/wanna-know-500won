import { describe, expect, it } from "vitest";
import { isRewardableText, rewardRef, REWARD_MIN_CHARS } from "../reviewReward";

const GOOD = "친구가 추천해서 와 봤는데 풀이가 제 상황이랑 잘 맞아서 놀랐어요. 특히 이직 타이밍 이야기가 도움이 됐어요.";

describe("정성 후기 보상 기준", () => {
  it("충분히 길고 내용이 다양한 후기만 인정해요", () => {
    expect(GOOD.length).toBeGreaterThanOrEqual(REWARD_MIN_CHARS);
    expect(isRewardableText(GOOD)).toBe(true);
    expect(isRewardableText("좋아요")).toBe(false);
    expect(isRewardableText("가".repeat(60))).toBe(false);
  });

  it("같은 조각을 반복해서 길이만 채운 글은 거절해요", () => {
    expect(isRewardableText("좋아요".repeat(15))).toBe(false);
    expect(isRewardableText("ab cd ".repeat(14))).toBe(false);
  });

  it("공백이나 여러 줄로 늘려도 길이를 속일 수 없어요", () => {
    expect(isRewardableText("좋아요 ".repeat(5) + "   \n\n   ")).toBe(false);
  });

  it("같은 글(공백·대소문자만 다른 경우)은 같은 지문이 나와요", () => {
    const h = (s: string) => Array.from(s).reverse().join("");
    expect(rewardRef(GOOD, h)).toBe(rewardRef(`  ${GOOD}  `.replace(/ /g, "  "), h));
    expect(rewardRef(GOOD, h)).not.toBe(rewardRef(GOOD + "다른 글이에요 정말로 그래요", h));
    expect(rewardRef(GOOD, h).length).toBeLessThanOrEqual(20);
  });
});
