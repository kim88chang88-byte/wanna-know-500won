import { describe, expect, it } from "vitest";
import { ELEMENT_SOFT, elementOfKo } from "../elementColor";

describe("오행 이름 → 종류", () => {
  it("목화토금수를 오행 종류로 바꾼다", () => {
    expect(["목", "화", "토", "금", "수"].map((n) => elementOfKo(n))).toEqual(["wood", "fire", "earth", "metal", "water"]);
    expect(elementOfKo("쇠")).toBeNull();
    expect(Object.keys(ELEMENT_SOFT).length).toBe(5);
  });
});
