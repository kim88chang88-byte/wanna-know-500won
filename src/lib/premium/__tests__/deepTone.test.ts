import { describe, expect, it } from "vitest";
import { softToDeep } from "../deepTone";

describe("softToDeep", () => {
  it("살펴보는 뜻의 가볍게는 깊이 있게로 바꾼다", () => {
    expect(softToDeep("오늘은 내 안의 오행 균형을 가볍게 살펴보자.")).toBe("오늘은 내 안의 오행 균형을 깊이 있게 살펴보자.");
  });
  it("그 밖의 가볍게는 말만 뺀다", () => {
    expect(softToDeep("가볍게 챙겨 봐.")).toBe("챙겨 봐.");
  });
});
