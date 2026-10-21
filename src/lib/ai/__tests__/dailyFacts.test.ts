import { describe, expect, it } from "vitest";
import type { SajuChart } from "@/lib/saju/types";
import { addDays, dayPillar } from "@/lib/saju/ganzhi";
import { buildDailyFacts, branchRelation, kstToday, tenGodOf } from "../dailyFacts";
import { buildUserMessage } from "../prompt";
import { extractCoreFacts } from "../coreFacts";

const chart: SajuChart = {
  year: { stem: "庚", branch: "午" },
  month: { stem: "辛", branch: "巳" },
  day: { stem: "甲", branch: "子" },
  hour: { stem: "戊", branch: "辰" },
  solarDate: { year: 1990, month: 5, day: 17 },
  uncertainPillars: [],
  warnings: [],
};

describe("tenGodOf (일간 甲 기준)", () => {
  it("열 가지 십성을 정확히 구한다", () => {
    const expected: Record<string, string> = {
      甲: "비견", 乙: "겁재", 丙: "식신", 丁: "상관", 戊: "편재",
      己: "정재", 庚: "편관", 辛: "정관", 壬: "편인", 癸: "정인",
    };
    for (const [stem, god] of Object.entries(expected)) expect(tenGodOf("甲", stem)).toBe(god);
  });
  it("음간도 맞다 (일간 癸 기준 丁은 편재, 己는 편관)", () => {
    expect(tenGodOf("癸", "丁")).toBe("편재");
    expect(tenGodOf("癸", "己")).toBe("편관");
  });
});

describe("branchRelation", () => {
  it("합·충·해를 구분한다", () => {
    expect(branchRelation("子", "丑")).toBe("합");
    expect(branchRelation("子", "午")).toBe("충");
    expect(branchRelation("辰", "戌")).toBe("충");
    expect(branchRelation("子", "未")).toBe("해");
    expect(branchRelation("子", "寅")).toBeNull();
  });
});

describe("buildDailyFacts", () => {
  it("2000-01-01(戊午)을 일간 甲 기준으로 풀어 준다", () => {
    expect(dayPillar({ year: 2000, month: 1, day: 1 })).toEqual({ stem: "戊", branch: "午" });
    const f = buildDailyFacts(chart, { year: 2000, month: 1, day: 1 });
    expect(f.오늘일진).toBe("戊午(무오)");
    expect(f.일간과의관계.십성).toBe("편재");
    // 오늘 午 와 내 일지 子 는 충, 월지 巳 와는 관계 없음
    expect(f.지지관계.length).toBe(1);
    expect(f.지지관계[0]).toContain("일지 子");
    expect(f.지지관계[0]).toContain("충");
  });

  it("일간합(甲-己)과 일간충(甲-庚)을 알려 준다", () => {
    let combine = false;
    let clash = false;
    for (let d = 0; d < 60; d++) {
      const f = buildDailyFacts(chart, addDays({ year: 2026, month: 1, day: 1 }, d));
      if (f.일간합충?.includes("합")) combine = true;
      if (f.일간합충?.includes("충")) clash = true;
    }
    expect(combine && clash).toBe(true);
  });

  it("한국 날짜(KST)로 바꾼다", () => {
    expect(kstToday(new Date("2026-10-19T16:00:00Z"))).toEqual({ year: 2026, month: 10, day: 20 });
    expect(kstToday(new Date("2026-10-19T14:59:00Z"))).toEqual({ year: 2026, month: 10, day: 19 });
  });
});

describe("프롬프트에 재료 담기", () => {
  it("today/core 가 있으면 담고, 없으면 기존과 같다", () => {
    const base = buildUserMessage(chart, "general", "male");
    expect(base).not.toContain("오늘의일진");
    expect(base).not.toContain("사주핵심");
    const rich = buildUserMessage(chart, "general", "male", null, {
      today: { year: 2000, month: 1, day: 1 },
      core: { 신강신약: "신약", 용신: ["丙(병)"] },
    });
    expect(rich).toContain("오늘의일진");
    expect(rich).toContain("戊午(무오)");
    expect(rich).toContain("사주핵심");
    expect(rich).toContain("丙(병)");
    expect(rich).not.toContain("1990");
  });
});

describe("extractCoreFacts", () => {
  const sample = {
    advanced: { dayStrength: { strength: "weak" }, geukguk: "정관격", yongsin: ["丙", "甲"], sinsal: { gilsin: ["천을귀인"] } },
    daeun: { current: { startAge: 28, ganzhi: "癸酉" } },
    seyun: [{ year: 2026, ganzhi: "丙午", tenGodStem: "식신", tenGodBranch: "상관" }],
    currentYear: 2026,
  };
  it("필요한 값만 추려 쉬운 말로 담는다", () => {
    const f = extractCoreFacts(sample, true)!;
    expect(f.신강신약).toContain("신약");
    expect(f.격국).toBe("정관격");
    expect(f.용신).toEqual(["丙(병)", "甲(갑)"]);
    expect(f.지금대운).toBe("癸酉");
    expect(f.올해세운).toEqual({ 간지: "丙午", 천간십성: "식신", 지지십성: "상관" });
    expect(f.참고).toBeUndefined();
  });
  it("시간을 모르면 참고 문구를 붙이고, 강약이 없으면 null", () => {
    expect(extractCoreFacts(sample, false)!.참고).toContain("참고용");
    expect(extractCoreFacts({}, true)).toBeNull();
  });
});

describe("extractCoreFacts 합충 근거", () => {
  const r = {
    advanced: { dayStrength: { strength: "strong" } },
    pillars: { year: "戊辰", month: "壬戌", day: "丙午", hour: "乙未" },
    currentYear: 2026,
    seyun: [{ year: 2026, ganzhi: "丙午" }],
    daeun: { current: { startAge: 31, ganzhi: "丙寅" } },
    wolun: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, ganzhi: "戊戌", stemTenGod: "식신", branchTenGod: "식신" })),
  };
  it("원국 반합·세운 천간충·이번 달 월운을 담는다", () => {
    const f = extractCoreFacts(r, true, new Date("2026-10-21T02:00:00Z"));
    expect(f?.원국관계?.some((x) => x.includes("戌午반합"))).toBe(true);
    expect(f?.세운과원국?.some((x) => x.includes("丙壬충"))).toBe(true);
    expect(f?.이번달월운?.간지).toBe("戊戌");
    expect(Array.isArray(f?.숨은십성)).toBe(true);
  });
  it("기둥이 없어도 던지지 않는다", () => {
    const f = extractCoreFacts({ advanced: { dayStrength: { strength: "weak" } } }, false);
    expect(f?.원국관계).toBeUndefined();
  });
});
