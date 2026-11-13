import { describe, expect, it } from "vitest";
import { DAY_MASTER, dayMasterOf } from "../dayMaster";

describe("첫 장 일간 장면 데이터", () => {
  it("천간 열 글자가 모두 있어", () => {
    expect(Object.keys(DAY_MASTER).join("")).toBe("甲乙丙丁戊己庚辛壬癸");
  });
  it("글자마다 풍경·말·키워드가 채워져 있어", () => {
    for (const d of Object.values(DAY_MASTER)) {
      expect(d.nature && d.emoji && d.say).toBeTruthy();
      expect(d.tags).toHaveLength(3);
    }
  });
  it("모르는 글자는 null", () => {
    expect(dayMasterOf("子")).toBeNull();
    expect(dayMasterOf(null)).toBeNull();
    expect(dayMasterOf("癸")?.nature).toBe("이슬비");
  });
});
