import { describe, expect, it } from "vitest";
import { readingKind } from "../storyHelpers";

describe("결과 제목의 풀이 이름", () => {
  it("~운으로 끝나면 그대로 쓴다", () => {
    expect(readingKind("2027 신년운")).toBe("2027 신년운");
    expect(readingKind("성공운")).toBe("성공운");
    expect(readingKind("연애·결혼운")).toBe("연애·결혼운");
  });
  it("그 밖의 이름은 '사주'로 쓴다", () => {
    expect(readingKind("프리미엄 종합 사주")).toBe("사주");
  });
});
