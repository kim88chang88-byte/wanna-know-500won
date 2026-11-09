import { describe, expect, it } from "vitest";
import { buildMonthTimeline, currentSajuMonth, daeunCompareRows, monthEvidence, monthGanzhi, planMonth, timelineRows } from "../book/timeline";

const kst = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 3, 0, 0)); // KST 낮 12시

describe("월운 간지 (오호둔)", () => {
  it("알려진 달과 맞는다", () => {
    expect(monthGanzhi(2026, 11)).toBe("己亥");
    expect(monthGanzhi(2026, 12)).toBe("庚子");
    expect(monthGanzhi(2027, 1)).toBe("辛丑"); // 1월경 丑월은 전해(2026) 소속
    expect(monthGanzhi(2027, 2)).toBe("壬寅"); // 정미년 첫 달
    expect(monthGanzhi(2024, 2)).toBe("丙寅");
  });
});

describe("지금 달 기준", () => {
  it("매달 7일 전이면 지난 절기 달로 본다", () => {
    expect(currentSajuMonth(kst(2026, 11, 10))).toEqual({ year: 2026, month: 11 });
    expect(currentSajuMonth(kst(2026, 11, 3))).toEqual({ year: 2026, month: 10 });
    expect(currentSajuMonth(kst(2027, 1, 3))).toEqual({ year: 2026, month: 12 });
  });
});

const natal = { year: "戊辰", month: "辛酉", day: "丙午", hour: "庚申" };

describe("시기표", () => {
  it("지금부터 12개월을 연도 경계를 넘어 이어 만든다", () => {
    const plans = buildMonthTimeline({ natal, dayStem: "丙", yongsinEls: ["수"], now: kst(2026, 11, 10) });
    expect(plans).toHaveLength(12);
    expect(plans.map((p) => p.month)).toEqual([11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(plans[0].ganzhi).toBe("己亥");
    expect(plans[2].ganzhi).toBe("辛丑");
    expect(plans[2].year).toBe(2027);
  });

  it("원국과의 합충·용신·채워지는 기운을 근거로 점수를 낸다", () => {
    const p = planMonth({ natal, dayStem: "丙", yongsinEls: ["수"] }, 2026, 12, 1);
    expect(p.ganzhi).toBe("庚子");
    expect(p.relations.some((r) => r.kind === "충" && r.day)).toBe(true);
    expect(p.yongsinIn).toEqual([{ el: "수", where: "지지" }]);
    expect(p.fills).toEqual(["수"]);
    expect(p.score).toBeGreaterThanOrEqual(20);
    expect(p.score).toBeLessThanOrEqual(95);
    expect(monthEvidence(p)).toContain("용신 수(지지)");
    expect(monthEvidence(p)).toContain("충");
  });

  it("표의 행은 12개이고 첫 달이 지금이다", () => {
    const plans = buildMonthTimeline({ natal, dayStem: "丙", yongsinEls: ["수"], now: kst(2026, 11, 10) });
    const rows = timelineRows(plans, { hit: (p) => p.index === 3, label: "재물운" });
    expect(rows).toHaveLength(12);
    expect(rows[0].current).toBe(true);
    expect(rows.filter((r) => r.current)).toHaveLength(1);
    expect(rows[3].note).toContain("재물운 포인트");
    expect(rows[3].highlight).toBe(true);
    for (const r of rows) {
      expect(r.bar).toBeGreaterThanOrEqual(20);
      expect(r.bar).toBeLessThanOrEqual(95);
      expect(r.label).toMatch(/^\d{1,2}월경 · [甲-癸][子-亥]$/);
    }
  });

  it("같은 입력이면 항상 같은 결과다", () => {
    const a = buildMonthTimeline({ natal, dayStem: "丙", yongsinEls: ["수"], now: kst(2026, 11, 10) });
    const b = buildMonthTimeline({ natal, dayStem: "丙", yongsinEls: ["수"], now: kst(2026, 11, 10) });
    expect(a).toEqual(b);
  });
});

describe("대운 비교", () => {
  const list = [
    { startAge: 9, endAge: 18, ganzhi: "丁卯", stemTenGod: "겁재", branchTenGod: "정인" },
    { startAge: 19, endAge: 28, ganzhi: "戊辰", stemTenGod: "식신", branchTenGod: "식신" },
    { startAge: 29, endAge: 38, ganzhi: "己巳", stemTenGod: "상관", branchTenGod: "비견" },
  ];
  it("지난·지금·다음을 만든다", () => {
    const rows = daeunCompareRows({ natal, dayStem: "丙", yongsinEls: ["수"], list, currentIdx: 1 });
    expect(rows.map((r) => r.label)).toEqual(["지난 대운 · 9~18세", "지금 대운 · 19~28세", "다음 대운 · 29~38세"]);
    expect(rows[1].highlight).toBe(true);
    expect(rows[1].value).toBe("戊辰");
    expect(rows[1].note).toContain("앞 대운");
  });
  it("처음 대운이면 지난 칸이 없고, 지금 대운을 모르면 비어 있다", () => {
    expect(daeunCompareRows({ natal, dayStem: "丙", yongsinEls: [], list, currentIdx: 0 }).map((r) => r.label[0])).toEqual(["지", "다"]);
    expect(daeunCompareRows({ natal, dayStem: "丙", yongsinEls: [], list, currentIdx: -1 })).toEqual([]);
  });
});
