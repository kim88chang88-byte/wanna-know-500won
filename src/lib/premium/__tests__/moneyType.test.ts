import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { buildPremiumReport } from "../report";
import { applyLocks } from "../book/lock";
import { tierOf } from "../book/moneyType";

const NOW = new Date("2026-11-14T11:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };
const FORBIDDEN = ["횡재", "파산", "사세요", "비트코인", "코인", "부동산", "주식을 사"];

describe("재물운 돈 팔자 유형·돈그릇", () => {
  const inputs: BirthInput[] = [base, { ...base, gender: "male" }, { ...base, year: 2001, month: 11, day: 3, hour: 14, minute: 20 }, { ...base, year: 1985, month: 2, day: 4, hour: null, minute: null }, { ...base, year: 1976, month: 3, day: 9, hour: 5, minute: 10, gender: "male" }];
  it("모든 입력에서 유형·그릇·글이 채워지고 겁주거나 상품을 권하지 않는다", () => {
    for (const input of inputs) {
      const r = buildPremiumReport(input, NOW, "full", "재물운", false);
      expect(r.book.length).toBe(20);
      const p = r.book.find((x) => x.key === "topic:money")!;
      expect(p.wealth).toBeDefined();
      const w = p.wealth!;
      expect(w.code).toMatch(/^[SA][RI][LG][PF]$/);
      expect(w.axes.length).toBe(4);
      expect(w.name.length).toBeGreaterThan(4);
      expect(w.bowl.size).toBeGreaterThanOrEqual(8);
      expect(w.bowl.size).toBeLessThanOrEqual(95);
      expect(w.bowl.fill).toBeGreaterThanOrEqual(8);
      const heads = p.sections.map((s) => s.heading).join("|");
      for (const h of ["나의 돈 팔자", "돈그릇 크기", "재물 시기 한눈에", "투자 스타일", "지갑 열기 전 세 가지 질문"]) expect(heads).toContain(h);
      const all = JSON.stringify(p.sections);
      for (const wd of FORBIDDEN) expect(all.includes(wd)).toBe(false);
      expect(all.includes("undefined")).toBe(false);
      expect(all.includes("NaN")).toBe(false);
    }
  });

  it("앞의 두 풀이는 열려 있고 시기·투자·습관은 미리보기에서 잠긴다", () => {
    const r = buildPremiumReport(base, NOW, "full", "재물운", false);
    const p = applyLocks(r.book, 2026).find((x) => x.key === "topic:money")!;
    const by = (h: string) => p.sections.find((s) => s.heading.startsWith(h))!;
    expect(by("나의 돈 팔자").locked).toBeFalsy();
    expect(by("돈그릇 크기").locked).toBeFalsy();
    expect(by("재물 시기 한눈에").locked).toBe(true);
    expect(by("투자 스타일").locked).toBe(true);
    expect(by("지갑 열기 전").locked).toBe(true);
  });

  it("그릇 크기에 따라 이름이 정해진다", () => {
    expect(tierOf(70).tier).toBe("큰 무쇠솥");
    expect(tierOf(55).tier).toBe("든든한 뚝배기");
    expect(tierOf(45).tier).toBe("알찬 도자기 그릇");
    expect(tierOf(30).tier).toBe("작지만 단단한 옹기");
  });
});
