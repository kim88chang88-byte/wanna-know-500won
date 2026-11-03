import { describe, expect, it } from "vitest";
import { allPartnerKeys, isPartnerKey, partnerImageKey, partnerPublicUrl, savePartnerImage, variantFor, variantOrder } from "../partnerStore";

describe("partnerStore", () => {
  it("키는 540가지고 서로 다르다", () => {
    const keys = allPartnerKeys();
    expect(keys).toHaveLength(540);
    expect(new Set(keys).size).toBe(540);
  });
  it("키 모양과 검증", () => {
    expect(partnerImageKey("female", "mid 20s", "water", 3)).toBe("female/mid-20s/water/3.webp");
    expect(partnerImageKey("male", "late 20s", "fire", -1)).toBe("male/late-20s/fire/5.webp");
    expect(isPartnerKey("male/mid-30s/earth/0.webp")).toBe(true);
    expect(partnerImageKey("female", "mid 20s", "water", 3, 2)).toBe("female/mid-20s/water/3-2.webp");
    expect(isPartnerKey("male/mid-30s/earth/0-1.webp")).toBe(true);
    expect(isPartnerKey("../../x.webp")).toBe(false);
  });
  it("변형은 사람마다 고르게, 같은 사람은 같게 정해진다", () => {
    const b = { year: 1990, month: 5, day: 3, hour: 8 };
    expect(variantFor(b)).toBe(variantFor({ ...b }));
    const count = [0, 0, 0];
    for (let y = 1960; y < 2005; y++) for (let m = 1; m <= 12; m++) count[variantFor({ year: y, month: m, day: 15, hour: null })]++;
    for (const c of count) expect(c).toBeGreaterThan(100);
    expect(variantOrder(2)).toEqual([2, 0, 1]);
  });
  it("공개 주소", () => {
    expect(partnerPublicUrl("https://x.supabase.co/", "a/b.webp")).toBe("https://x.supabase.co/storage/v1/object/public/partner-images/a/b.webp");
  });
  it("버킷이 없으면 만들고 다시 저장한다", async () => {
    const calls: string[] = [];
    const f = async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method} ${url.split("/storage/v1/")[1]}`);
      if (url.includes("/object/") && calls.filter((c) => c.includes("object/")).length === 1) return new Response("{}", { status: 404 });
      return new Response("{}", { status: 200 });
    };
    const r = await savePartnerImage({ url: "https://x.supabase.co", serviceKey: "k" }, "male/mid-20s/fire/0.webp", new Uint8Array([1]), f);
    expect(r.ok).toBe(true);
    expect(calls).toEqual(["POST object/partner-images/male/mid-20s/fire/0.webp", "POST bucket", "POST object/partner-images/male/mid-20s/fire/0.webp"]);
  });
});
