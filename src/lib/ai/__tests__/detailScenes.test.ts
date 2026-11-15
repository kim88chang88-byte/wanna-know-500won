import { describe, expect, it } from "vitest";
import { DETAIL_SYSTEM_PROMPT, TOPIC_SCENES } from "../detail";

describe("장면·신년 문구", () => {
  it("돈 장면은 재물운 후보에만 있다", () => {
    for (const [t, v] of Object.entries(TOPIC_SCENES)) {
      if (t !== "money") expect(v).not.toMatch(/통장|장바구니|결제/);
    }
    expect(TOPIC_SCENES.money).toMatch(/통장/);
  });
  it("프롬프트 본문에 돈 장면 예시를 직접 쓰지 않는다", () => {
    expect(DETAIL_SYSTEM_PROMPT).not.toMatch(/통장 앱 열어 볼 때, 장바구니/);
  });
});
