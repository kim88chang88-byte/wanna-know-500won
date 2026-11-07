import { describe, expect, it } from "vitest";
import { buildIntro, pickLine } from "../chatIntro";

const birth = { year: 1988, month: 12, day: 29, hour: 10, minute: 0, calendar: "solar" as const, gender: "male" as const };

describe("chatIntro", () => {
  it("풀이: 기둥 4개와 오행이 나와요", () => {
    const b = buildIntro({ kind: "reading", summary: "고민: 이직\n한 줄 결론: 꾸준함이 무기", birth, name: "은혁" });
    const p = b.find((x) => x.kind === "pillars");
    expect(p && p.kind === "pillars" && p.pillars.length).toBe(4);
    expect(b.some((x) => x.kind === "elements")).toBe(true);
    expect(b.some((x) => x.kind === "text" && x.text.includes("이직"))).toBe(true);
  });
  it("시각을 모르면 기둥 3개", () => {
    const b = buildIntro({ kind: "reading", summary: "", birth: { ...birth, hour: null } });
    const p = b.find((x) => x.kind === "pillars");
    expect(p && p.kind === "pillars" && p.pillars.length).toBe(3);
  });
  it("오늘의 한마디: 요약글에서만 만들어요", () => {
    const b = buildIntro({ kind: "daily", summary: "오늘의 한마디: 천천히\n오늘의 팁: 물 마시기\n오늘 일진: 병오" });
    expect(b.length).toBe(3);
  });
  it("오늘의 한마디: 내 정보가 있으면 사주 기둥이 먼저 나와요", () => {
    const b = buildIntro({ kind: "daily", summary: "오늘의 한마디: 천천히\n오늘 일진: 병오", birth });
    expect(b.findIndex((x) => x.kind === "pillars")).toBeGreaterThan(-1);
    expect(b.findIndex((x) => x.kind === "pillars")).toBeLessThan(b.findIndex((x) => x.kind === "text" && x.text.includes("일진")));
  });
  it("궁합: 두 사람 일간과 점수", () => {
    const b = buildIntro({ kind: "compat", summary: "궁합 점수: 82점\n궁합 한 줄: 속도를 맞춰요", birth, partnerBirth: { ...birth, year: 1990 }, name: "은혁", partnerName: "원석" });
    expect(b[0].kind).toBe("pair");
    expect(b.length).toBe(3);
  });
  it("정보가 없으면 빈 배열", () => {
    expect(buildIntro({ kind: "reading", summary: "" })).toEqual([]);
    expect(pickLine("a: b", "c")).toBeNull();
  });
});
