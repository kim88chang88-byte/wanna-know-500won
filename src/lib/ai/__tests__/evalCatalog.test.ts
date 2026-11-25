import { describe, expect, it } from "vitest";
import { EVAL_CATALOG, evalCategory } from "../evalSets";
import { isCrisis } from "../chat";

describe("관리자 상담 점검 카테고리", () => {
  it("500원 사주 6개 주제와 궁합이 모두 있고 프리미엄은 없어요", () => {
    const ids = EVAL_CATALOG.map((c) => c.id);
    for (const id of ["love", "money", "success", "marriage", "health", "newyear", "compat"]) expect(ids).toContain(id);
    expect(ids.some((id) => /premium/.test(id))).toBe(false);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("신년운은 2027 기준(study)이고 궁합은 compat 종류예요", () => {
    expect(evalCategory("newyear").topic).toBe("study");
    expect(evalCategory("compat").kind).toBe("compat");
    expect(evalCategory("compat").group).toBe("p1000");
  });

  it("모르는 id 는 첫 카테고리로, 모든 카테고리에 질문이 있어요", () => {
    expect(evalCategory("nope").id).toBe(EVAL_CATALOG[0].id);
    for (const c of EVAL_CATALOG) expect(c.qs.length).toBeGreaterThan(5);
  });

  it("새 주제는 경계 질문(장소 추천·위기)을 함께 점검해요", () => {
    for (const id of ["money", "success", "marriage", "health", "newyear", "compat"]) {
      const qs = evalCategory(id).qs;
      expect(qs.some((q) => q.expect === "prefilter")).toBe(true);
      expect(qs.some((q) => q.expect === "crisis")).toBe(true);
    }
  });

  it("위기 오탐 점검 세트: 평범한 질문은 위기로 잡히지 않고, 진짜 위기는 잡혀요", () => {
    const qs = evalCategory("crisisfp").qs;
    expect(qs.some((q) => q.expect === "normal")).toBe(true);
    expect(qs.some((q) => q.expect === "crisis")).toBe(true);
    for (const q of qs) expect(isCrisis(q.q), q.q).toBe(q.expect === "crisis");
  });
});
