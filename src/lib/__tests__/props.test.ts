import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { PROPS, propSrc, propCatalog } from "../props";

describe("props", () => {
  it("모든 소품 그림 파일이 있다", () => {
    for (const [label, p] of Object.entries(PROPS)) expect(existsSync(`public/images/props/${p.key}.webp`), label).toBe(true);
  });
  it("목록 밖의 소품은 그림이 없다", () => {
    expect(propSrc("없는물건")).toBeNull();
    expect(propSrc("머그컵")).toBe("/images/props/mug.webp");
  });
  it("그림 키는 서로 다르고 모든 오행이 골고루 있다", () => {
    const keys = Object.values(PROPS).map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const el of ["목", "화", "토", "금", "수"]) expect(Object.values(PROPS).filter((p) => p.el === el).length, el).toBeGreaterThanOrEqual(5);
    expect(propCatalog()).toContain("머그컵(토)");
  });
});
