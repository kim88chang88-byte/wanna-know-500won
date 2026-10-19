import { describe, expect, it } from "vitest";
import { GROUPS } from "../topic";
import { buildLookBack, buildTraits, checkMessage, GROUP_HABIT, PAST_YEAR_PROMPT, STEM_INNER, STRENGTH_HABIT } from "../book/resonance";

describe("resonance 문장", () => {
  it("열 일간 모두, 다섯 십성 그룹 모두 문장이 있다", () => {
    expect(Object.keys(STEM_INNER)).toHaveLength(10);
    for (const g of GROUPS) {
      expect(GROUP_HABIT[g].length).toBeGreaterThan(10);
      expect(PAST_YEAR_PROMPT[g].length).toBeGreaterThan(10);
    }
    expect(Object.keys(STRENGTH_HABIT).sort()).toEqual(["신강", "신약", "중화"]);
  });
  it("단정·겁주는 표현이 없다", () => {
    const all = JSON.stringify([STEM_INNER, GROUP_HABIT, STRENGTH_HABIT, PAST_YEAR_PROMPT]);
    expect(all).not.toMatch(/사망|이혼|파산|반드시|틀림없이|무조건/);
  });
});

describe("buildTraits", () => {
  it("행동 습관 3가지와 근거 3줄을 만든다", () => {
    const t = buildTraits({ dayStem: "戊", dayImage: "큰 산", dominant: "식상", dominantCount: 3, gradeLabel: "신강" });
    expect(t.traits.checks).toHaveLength(3);
    expect(t.traits.checks?.[0]).toBe(STEM_INNER["戊"]);
    expect(t.traits.checks?.[1]).toBe(GROUP_HABIT["식상"]);
    expect(t.traits.checks?.[2]).toBe(STRENGTH_HABIT["신강"]);
    expect(t.traitBasis).toHaveLength(3);
    expect(t.traitBasis[1].value).toContain("식상 3개");
  });
  it("모르는 등급은 중화 문장으로", () => {
    const t = buildTraits({ dayStem: "甲", dayImage: "나무", dominant: "비겁", dominantCount: 2, gradeLabel: "기타" });
    expect(t.traits.checks?.[2]).toBe(STRENGTH_HABIT["중화"]);
  });
});

describe("buildLookBack", () => {
  it("지나간 해마다 한 줄씩, 해와 간지를 붙인다", () => {
    const s = buildLookBack([{ year: 2024, ganzhi: "甲辰", group: "식상" }, { year: 2025, ganzhi: "乙巳", group: "재성" }]);
    expect(s?.checks).toHaveLength(2);
    expect(s?.checks?.[0]).toContain("2024년(甲辰)");
    expect(s?.checks?.[1]).toContain(PAST_YEAR_PROMPT["재성"]);
  });
  it("그룹을 알 수 없으면 건너뛰고, 모두 없으면 null", () => {
    expect(buildLookBack([{ year: 2025, ganzhi: "乙巳", group: null }])).toBeNull();
    expect(buildLookBack([])).toBeNull();
  });
});

describe("checkMessage", () => {
  it("맞은 개수에 따라 다른 말을 한다", () => {
    expect(checkMessage(3, 3)).not.toBe(checkMessage(1, 3));
    expect(checkMessage(2, 3)).not.toBe(checkMessage(1, 3));
    expect(checkMessage(0, 0)).toBe("");
  });
});
