import { describe, expect, it } from "vitest";
import { BODY_GROUPS, BODY_IMG, bodyStates, bodyWhy, dailyRoutine, monthIndexNow, monthlyCondition, monthlySummary, topBodyPicks, yearFocus } from "../bodyMap";
import type { ElementView } from "../types";

const el = (name: string, count: number): ElementView => ({ name, count, kind: "unknown" });

describe("건강운 오행 장부 지도", () => {
  it("많은 기운은 쉬어 가기, 적거나 없는 기운은 채우기로 나눠요", () => {
    const s = bodyStates([el("목", 4), el("화", 0), el("토", 1), el("금", 1), el("수", 2)]);
    expect(s.목).toBe("rest");
    expect(s.화).toBe("fill");
    expect(s.수).toBe("ok");
    expect(bodyStates([])).toEqual({});
  });

  it("올해 세운 천간의 오행으로 살펴볼 곳을 짚어요", () => {
    expect(yearFocus("丁未")).toBe("화");
    expect(yearFocus("甲子")).toBe("목");
    expect(yearFocus(null)).toBeNull();
  });

  it("500원 요약은 채울 곳부터 3가지를 골라요", () => {
    const picks = topBodyPicks(bodyStates([el("목", 4), el("화", 0), el("토", 1), el("금", 1), el("수", 0)]));
    expect(picks).toHaveLength(3);
    expect(picks.slice(0, 2).every((p) => p.state === "fill")).toBe(true);
  });

  it("표시 위치는 그림 안에 있어요", () => {
    for (const g of BODY_GROUPS) for (const [x, y] of g.marks) expect(x >= 0 && x <= BODY_IMG.w && y >= 0 && y <= BODY_IMG.h).toBe(true);
  });

  const EL = [el("목", 4), el("화", 0), el("토", 1), el("금", 1), el("수", 2)];
  it("부위마다 오행 개수로 근거 한 줄을 만들어요", () => {
    expect(bodyWhy("목", "rest", EL)).toContain("4개로 평균(1.6개)보다 많아요");
    expect(bodyWhy("화", "fill", EL)).toContain("0개로 적어요");
    expect(bodyWhy("수", "ok", EL)).toContain("평균과 비슷해요");
  });

  it("월운 천간 오행으로 12칸 달력을 만들고 이번 달을 표시해요", () => {
    const stems = "庚辛壬癸甲乙丙丁戊己庚辛";
    const wolun = Array.from(stems).map((c, i) => ({ month: i + 1, ganzhi: c + "子" }));
    const cal = monthlyCondition(wolun, bodyStates(EL), 9);
    expect(cal).toHaveLength(12);
    expect(cal[0].label).toBe("2월경");
    expect(cal[4].state).toBe("rest"); // 甲 = 목(많음)
    expect(cal[6].state).toBe("fill"); // 丙 = 화(없음)
    expect(cal.filter((c) => c.current)).toHaveLength(1);
    const sum = monthlySummary(cal);
    expect(sum.rest).toContain("눈 · 간 · 근육");
    expect(sum.fill).toContain("심장");
    expect(monthlyCondition(undefined, bodyStates(EL))).toEqual([]);
  });

  it("이번 달 칸은 절기(매달 7일 무렵) 기준이에요", () => {
    expect(monthIndexNow(new Date("2026-11-10T00:00:00+09:00"))).toBe(9); // 11월 → 9
    expect(monthIndexNow(new Date("2026-11-03T00:00:00+09:00"))).toBe(8); // 7일 전이면 10월
    expect(monthIndexNow(new Date("2026-01-03T00:00:00+09:00"))).toBe(10); // 12월
  });

  it("하루 루틴은 시간대별로 최대 2가지, 병·약 얘기 없이 만들어요", () => {
    const slots = dailyRoutine(bodyStates(EL));
    expect(slots.length).toBeGreaterThan(0);
    for (const sl of slots) expect(sl.items.length).toBeLessThanOrEqual(2);
    const all = slots.flatMap((s) => s.items.map((i) => i.text)).join(" ");
    expect(all).not.toMatch(/약|병원|영양제|치료/);
  });
});
