import { describe, expect, it } from "vitest";
import { AI_IMAGE_NOTICE, ageOn, estimateCostUsd, generateImage, partnerAgeFor, spousePrompt, usageOf } from "../image";

const okBody = {
  candidates: [{ finishReason: "STOP", content: { parts: [{ inlineData: { mimeType: "image/png", data: "QUJD" } }] } }],
  usageMetadata: { promptTokenCount: 60, candidatesTokenCount: 1120, candidatesTokensDetails: [{ modality: "IMAGE", tokenCount: 1120 }], totalTokenCount: 1180 },
};
const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe("이미지 생성", () => {
  it("프롬프트에 성별·분위기가 들어가고 가상의 인물이라고 적는다", () => {
    const p = spousePrompt("female", "water");
    expect(p).toMatch(/woman/);
    expect(p).toMatch(/entirely fictional person/);
    expect(p).toMatch(/photorealistic/);
    expect(p).toMatch(/no watermark/);
    expect(spousePrompt("male", "fire")).toMatch(/man/);
  });
  it("토큰으로 어림 비용을 계산한다", () => {
    const u = usageOf(okBody);
    expect(u).toMatchObject({ promptTokens: 60, imageTokens: 1120 });
    expect(estimateCostUsd(u)).toBeCloseTo((1120 * 60 + 60 * 0.5) / 1_000_000, 6);
  });
  it("모델이 없으면(404) 다음 모델로 넘어가 성공한다", async () => {
    const seen: string[] = [];
    const f = (async (url: string) => {
      seen.push(String(url));
      return seen.length === 1 ? resp(404, { error: { message: "not found" } }) : resp(200, okBody);
    }) as unknown as typeof fetch;
    const r = await generateImage("x", "k", { fetchImpl: f });
    expect(r.ok).toBe(true);
    expect(seen.length).toBe(2);
  });
  it("계속 실패하면 오류 문구를 돌려준다", async () => {
    const f = (async () => resp(403, { error: { message: "denied" } })) as unknown as typeof fetch;
    const r = await generateImage("x", "k", { fetchImpl: f });
    expect(r.ok).toBe(false);
  });
});

describe("결과 이미지 연령 규칙", () => {
  it("남성 이용자: 20~40대 20대 중반, 50대 20대 후반, 60대 이상 30대 중반", () => {
    for (const a of [20, 29, 30, 39, 40, 49]) expect(partnerAgeFor("male", a)).toBe("mid 20s");
    for (const a of [50, 59]) expect(partnerAgeFor("male", a)).toBe("late 20s");
    for (const a of [60, 75]) expect(partnerAgeFor("male", a)).toBe("mid 30s");
  });
  it("여성 이용자: 20대 20대 중반, 30대 20대 후반, 40대 이상 30대 중반", () => {
    for (const a of [20, 29]) expect(partnerAgeFor("female", a)).toBe("mid 20s");
    for (const a of [30, 39]) expect(partnerAgeFor("female", a)).toBe("late 20s");
    for (const a of [40, 55, 70]) expect(partnerAgeFor("female", a)).toBe("mid 30s");
  });
  it("20세 미만이거나 나이를 모르면 이미지를 만들지 않는다", () => {
    for (const g of ["male", "female"] as const) {
      for (const a of [0, 9, 10, 15, 17, 19, NaN]) expect(partnerAgeFor(g, a)).toBeNull();
    }
  });
  it("프롬프트에 연령대가 들어가고 성인이라고 적는다", () => {
    expect(spousePrompt("female", "fire", "mid 30s")).toMatch(/her late 20s/);
    expect(spousePrompt("male", "water", "late 20s")).toMatch(/his mid 20s/);
    expect(spousePrompt("female", "fire")).toMatch(/clearly an adult/);
  });
  it("만 나이는 생일 전에는 한 살 적다", () => {
    expect(ageOn({ year: 1990, month: 12, day: 25 }, new Date(2026, 9, 30))).toBe(35);
    expect(ageOn({ year: 1990, month: 10, day: 30 }, new Date(2026, 9, 30))).toBe(36);
  });
});

describe("복장과 안내 문구", () => {
  it("같은 seed 는 같은 복장, seed 가 다르면 복장이 달라진다", () => {
    expect(spousePrompt("female", "water", "mid 20s", 2)).toBe(spousePrompt("female", "water", "mid 20s", 2));
    const set = new Set([0, 1, 2, 3, 4, 5].map((v) => spousePrompt("male", "fire", "mid 20s", v)));
    expect(set.size).toBe(6);
  });
  it("복장에 오행 색이 들어가고, 한복·정장 같은 복장이 목록에 있다", () => {
    const all = [0, 1, 2, 3, 4, 5].map((v) => spousePrompt("female", "water", "mid 20s", v)).join("\n");
    expect(all).toMatch(/navy/);
    expect(all).toMatch(/hanbok/);
    expect(all).toMatch(/jeans/);
    expect(["0", "1", "2", "3", "4", "5"].map((v) => spousePrompt("male", "earth", "late 20s", Number(v))).join("\n")).toMatch(/suit/);
  });
  it("음수·큰 seed 도 오류 없이 복장을 고른다", () => {
    expect(spousePrompt("male", "metal", "mid 30s", -3)).toMatch(/Korean man/);
    expect(spousePrompt("female", "wood", "mid 30s", 999)).toMatch(/Korean woman/);
  });
  it("안내 문구가 정해진 문장이다", () => {
    expect(AI_IMAGE_NOTICE).toBe("AI가 만든 가상의 인물, 참고용 상상도");
  });

  it("여성 인물은 어떤 seed 에서도 안경을 쓰지 않아요", () => {
    for (const el of ["wood", "fire", "earth", "metal", "water"] as const)
      for (let v = 0; v < 6; v++) {
        const p = spousePrompt("female", el, "mid 20s", v);
        expect(p).toMatch(/no eyeglasses/);
        expect(p).not.toMatch(/wearing stylish thin-frame glasses/);
      }
  });
  it("남성 인물은 일부 seed 에서만 얇은 안경을 쓰고, 같은 seed 면 같아요", () => {
    const withGlasses = [0, 1, 2, 3, 4, 5].filter((v) => /thin-frame glasses/.test(spousePrompt("male", "water", "mid 20s", v)));
    expect(withGlasses).toEqual([1, 4]);
    expect(spousePrompt("male", "fire", "late 20s", 1)).toBe(spousePrompt("male", "fire", "late 20s", 1));
  });
});

describe("변형(variant)", () => {
  it("변형 0번은 기본, 1·2번은 서로 다른 그림 설명이에요", () => {
    for (const partner of ["female", "male"] as const)
      for (let seed = 0; seed < 6; seed++) {
        const set = new Set([0, 1, 2].map((v) => spousePrompt(partner, "water", "mid 20s", seed, v)));
        expect(set.size).toBe(3);
        expect(spousePrompt(partner, "water", "mid 20s", seed)).toBe(spousePrompt(partner, "water", "mid 20s", seed, 0));
      }
  });
  it("여성은 어떤 변형에서도 안경이 없고, 변형마다 포인트 색이 달라요", () => {
    for (const el of ["wood", "fire", "earth", "metal", "water"] as const)
      for (let seed = 0; seed < 6; seed++)
        for (let v = 0; v < 3; v++) expect(spousePrompt("female", el, "mid 20s", seed, v)).toMatch(/no eyeglasses/);
    expect(spousePrompt("female", "water", "mid 20s", 0, 1)).toMatch(/teal/);
    expect(spousePrompt("female", "water", "mid 20s", 0, 2)).toMatch(/indigo/);
  });
});
