import { describe, expect, it } from "vitest";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import { buildCompat, countElements, isCompatFortune, type SsajuForCompat } from "../compat";

const KO = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" } as const;

/** 네 기둥 간지 문자열로 ssaju 결과 모양의 가짜 값을 만들어요 (계산 엔진 없이 궁합 규칙만 시험해요) */
function chart(year: string, month: string, day: string, hour: string): SsajuForCompat {
  const detail = (p: string) => {
    const s = STEMS.find((x) => x.hanja === p[0])!;
    const b = BRANCHES.find((x) => x.hanja === p[1])!;
    return { stemKo: s.hangul, branchKo: b.hangul, element: { stem: KO[s.element], branch: KO[b.element] } };
  };
  return {
    pillars: { year, month, day, hour },
    pillarDetails: { year: detail(year), month: detail(month), day: detail(day), hour: detail(hour) },
  };
}

describe("궁합 계산", () => {
  const me = chart("庚午", "辛巳", "甲子", "丙寅");
  const other = chart("辛未", "癸未", "己丑", "壬申"); // 갑-기 합, 자-축 합

  it("일간 합과 일지 합이 있으면 점수가 높고 '잘 맞는 점'이 먼저 나온다", () => {
    const c = buildCompat(me, other, true, true);
    expect(c.score).toBeGreaterThanOrEqual(85);
    expect(c.points.some((p) => p.title.startsWith("일간의 합"))).toBe(true);
    expect(c.points.some((p) => p.title.startsWith("일지") && p.title.endsWith("합"))).toBe(true);
    expect(c.points[0].tone).toBe("good");
    expect(c.me.dayPillar).toBe("甲子");
    expect(c.partner.dayPillar).toBe("己丑");
  });

  it("일간 충·일지 충이면 점수가 낮아지고 '맞춰 가면 좋은 점'이 들어간다", () => {
    const c = buildCompat(chart("庚午", "辛巳", "甲子", "丙寅"), chart("甲午", "丁卯", "庚午", "壬申"), true, true);
    expect(c.points.some((p) => p.title.startsWith("일간의 충"))).toBe(true);
    expect(c.points.some((p) => p.tone === "tip")).toBe(true);
    expect(c.score).toBeLessThan(75);
  });

  it("점수는 55~96 안이다", () => {
    const combos = [me, other, chart("甲子", "甲子", "甲子", "甲子"), chart("庚午", "庚午", "庚午", "庚午")];
    for (const a of combos) for (const b of combos) {
      const s = buildCompat(a, b, true, true).score;
      expect(s).toBeGreaterThanOrEqual(55);
      expect(s).toBeLessThanOrEqual(96);
    }
  });

  it("무서운 단정 표현을 쓰지 않는다", () => {
    const text = JSON.stringify([buildCompat(me, other, true, true), buildCompat(me, chart("甲午", "丁卯", "庚午", "壬申"), true, true)]);
    expect(text).not.toMatch(/이혼|헤어|파탄|불행|재앙|나쁜 궁합|안 맞/);
  });

  it("태어난 시간을 모르면 시주를 빼고 오행을 센다", () => {
    const withHour = countElements(me, true).reduce((n, e) => n + e.count, 0);
    const noHour = countElements(me, false).reduce((n, e) => n + e.count, 0);
    expect(withHour).toBe(8);
    expect(noHour).toBe(6);
    expect(buildCompat(me, other, false, true).me.hourUnknown).toBe(true);
  });

  it("한 사람에게 없는 오행을 상대가 2개 이상 갖고 있으면 오행 보완 항목이 생긴다", () => {
    const c = buildCompat(chart("甲寅", "乙卯", "甲寅", "乙卯"), chart("庚申", "辛酉", "庚申", "辛酉"), true, true);
    expect(c.points.some((p) => p.title.startsWith("오행 보완"))).toBe(true);
  });
});

describe("궁합 화면 문구 판별", () => {
  it("'궁합'이 들어간 문구만 궁합으로 본다", () => {
    expect(isCompatFortune("우리 둘의 궁합 리포트")).toBe(true);
    expect(isCompatFortune("연애 결혼 리포트")).toBe(false);
  });
});
