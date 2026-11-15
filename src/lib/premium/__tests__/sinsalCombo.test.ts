import { describe, expect, it } from "vitest";
import { COMBOS, SINGLES, SAL_NAME, buildSinsalCard, findSals, pickCard } from "../book/sinsalCombo";

const mk = (y: string, m: string, d: string, h: string) =>
  ({ pillars: { year: y, month: m, day: d, hour: h }, dayStem: d[0], seyun: [], daeun: { current: undefined }, currentYear: 2026 }) as never;

describe("신살 조합 카드", () => {
  it("12쌍과 모든 신살 이름이 있어요", () => {
    expect(COMBOS.length).toBe(12);
    for (const c of COMBOS) {
      expect(SAL_NAME[c.a]).toBeTruthy();
      for (const b of Array.isArray(c.b) ? c.b : [c.b]) expect(SAL_NAME[b]).toBeTruthy();
    }
    for (const s of SINGLES) expect(SAL_NAME[s.s]).toBeTruthy();
  });
  it("금지 표현이 없어요", () => {
    const all = JSON.stringify([COMBOS, SINGLES]);
    for (const w of ["치트키", "거상", "무식한", "발작", "불면증", "바람기", "집안 망칠"]) expect(all).not.toContain(w);
  });
  it("백호 + 괴강을 찾아요", () => {
    const f = findSals(mk("甲子", "戊辰", "壬辰", "丙午"), false);
    expect(f.has("백호")).toBe(true);
    expect(f.has("괴강")).toBe(true);
    expect(pickCard(f).pair).toEqual(["백호", "괴강"]);
  });
  it("아무것도 없으면 담백한 구조", () => {
    expect(pickCard(new Map()).kind).toBe("none");
  });
  it("카드는 sinsalCard 메타와 MBTI 자리를 가져요", () => {
    const s = buildSinsalCard(mk("甲子", "戊辰", "壬辰", "丙午"), false);
    expect(s.sinsalCard?.title).toBeTruthy();
    expect(s.body).toContain("⟦MBTI⟧");
    expect(s.body).toContain("이번 주 미션");
  });
  it("시간을 모르면 시주는 보지 않아요", () => {
    const f = findSals(mk("甲子", "乙丑", "丙寅", "庚辰"), true);
    for (const v of f.values()) expect(v).not.toContain("hour");
  });
});
