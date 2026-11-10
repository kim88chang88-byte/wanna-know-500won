import { describe, expect, it } from "vitest";
import { OUTFITS, colorFamilyOf, isOutfitQuestion, outfitByKey, pickOutfit } from "../outfits";
import { existsSync } from "node:fs";

describe("outfits", () => {
  it("모든 착장 이미지 파일이 있다", () => {
    for (const o of OUTFITS) expect(existsSync(`public/images/outfits/${o.key}.webp`), o.key).toBe(true);
  });
  it("옷 질문만 알아본다", () => {
    expect(isOutfitQuestion("크림 베이지 옷을 입어볼까?")).toBe(true);
    expect(isOutfitQuestion("올해 이직해도 될까요?")).toBe(false);
  });
  it("성별에 맞는 착장만 고른다", () => {
    const m = pickOutfit("male", "검정 옷 입어볼까?");
    const f = pickOutfit("female", "검정 옷 입어볼까?");
    expect(m?.keys.every((k) => k.startsWith("m-"))).toBe(true);
    expect(f?.keys.every((k) => k.startsWith("f-"))).toBe(true);
    expect(m?.exact).toBe(true);
  });
  it("정확한 색이 없으면 가까운 계열로 고른다", () => {
    const r = pickOutfit("female", "빨간 옷 입어볼까?");
    expect(r).not.toBeNull();
    expect(r!.keys.length).toBeGreaterThan(0);
    for (const k of r!.keys) expect(outfitByKey(k)).not.toBeNull();
  });
  it("성별을 모르거나 색을 모르면 null", () => {
    expect(pickOutfit(undefined, "검정 옷")).toBeNull();
    expect(pickOutfit("male", "무슨 옷 입을까?")).toBeNull();
  });
  it("글에서 먼저 나온 색을 쓴다", () => {
    expect(colorFamilyOf("검정 말고 크림")).toBe("블랙");
  });
});
