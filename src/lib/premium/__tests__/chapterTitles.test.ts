import { describe, expect, it } from "vitest";
import { CHAPTER_TITLES, healthMiniTitle } from "../book/chapterTitles";

describe("장 제목", () => {
  it("분야 이름을 앞에 둔 익살 제목이고, 작은 글씨·큰 제목·부제로 나뉜다", () => {
    for (const t of Object.values(CHAPTER_TITLES)) {
      const [pre, rest] = t.split(" · ");
      expect(pre).toMatch(/^제\d+장$/);
      const [sub, main] = rest.split(" - ");
      expect(sub.length).toBeGreaterThan(5);
      expect(main).toMatch(/^\[.+\] /);
    }
    expect(CHAPTER_TITLES.health).toContain("[건강운] 삐걱삐걱, 내 몸 사용 설명서");
  });
  it("건강운은 가장 약한 오행에 따라 한 줄 제목이 달라지고, 고르면 없다", () => {
    const mk = (m: number[]) => ["목", "화", "토", "금", "수"].map((name, i) => ({ name, count: m[i], kind: "wood" }) as never);
    expect(healthMiniTitle(mk([0, 0, 3, 3, 2]))).toContain("뻣뻣한 나무토막");
    expect(healthMiniTitle(mk([2, 0, 3, 3, 2]))).toContain("얼음 모드");
    expect(healthMiniTitle(mk([2, 2, 2, 1, 1]))).toBeNull();
  });
});
