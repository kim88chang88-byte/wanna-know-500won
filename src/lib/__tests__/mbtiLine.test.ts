import { describe, expect, it } from "vitest";
import { mbtiDecadeLine } from "../mbtiLine";

describe("10년 카드 MBTI 한 줄", () => {
  it("MBTI 가 없거나 이상하면 비어 있다", () => {
    expect(mbtiDecadeLine("", "식상", "past")).toBe("");
    expect(mbtiDecadeLine("XXXX", "식상", "now")).toBe("");
    expect(mbtiDecadeLine("enfp", "없는묶음", "now")).toBe("");
  });
  it("지난·지금·다가오는 시기마다 다른 문장이 나온다", () => {
    const a = mbtiDecadeLine("ENFP", "식상", "past");
    const b = mbtiDecadeLine("enfp", "식상", "now");
    const c = mbtiDecadeLine("ENFP", "식상", "future");
    expect(a).toContain("ENFP답게");
    expect(a).toContain("사람 속에서 에너지를 얻는");
    expect(a).toContain("가능성을 먼저 보는");
    expect(new Set([a, b, c]).size).toBe(3);
    for (const t of [a, b, c]) expect(t).not.toMatch(/undefined|NaN/);
  });
  it("열여섯 유형 모두 문장이 만들어진다", () => {
    for (const e of "EI") for (const n of "NS") for (const f of "FT") for (const p of "PJ") {
      for (const g of ["비겁", "식상", "재성", "관성", "인성"]) expect(mbtiDecadeLine(`${e}${n}${f}${p}`, g, "future").length).toBeGreaterThan(10);
    }
  });
});
