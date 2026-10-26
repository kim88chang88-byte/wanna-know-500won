import { describe, expect, it } from "vitest";
import { upsellFor } from "../upsell";

describe("500원 풀이 끝 안내", () => {
  it("성공·재물은 성공 재물 리포트, 연애·결혼은 연애 결혼 리포트로 이어진다", () => {
    expect(upsellFor("성공운")?.title).toContain("성공 재물");
    expect(upsellFor("재물운")?.title).toContain("성공 재물");
    expect(upsellFor("연애운")?.title).toContain("연애 결혼");
    expect(upsellFor("결혼운")?.title).toContain("연애 결혼");
  });
  it("맞는 상품이 없는 주제는 안내하지 않는다", () => {
    expect(upsellFor("건강운")).toBeNull();
    expect(upsellFor("2027 신년운")).toBeNull();
  });
  it("압박하거나 근거 없이 약속하는 말을 쓰지 않는다", () => {
    for (const f of ["성공운", "연애운"]) {
      const u = upsellFor(f)!;
      const all = [u.title, ...u.hooks].join(" ");
      expect(/(지금 안|놓치|후회|마지막|딱 오늘|100%|반드시|무조건)/.test(all)).toBe(false);
      expect(u.hooks.length).toBe(3);
    }
  });
});
