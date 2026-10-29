import { describe, expect, it } from "vitest";
import { ageOn, estimateCostUsd, generateImage, partnerAgeFor, spousePrompt, usageOf } from "../image";

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
  it("남성 이용자: 20~40대 20대 후반, 50대 30대 중반, 60대 이상 40대 초반", () => {
    for (const a of [20, 29, 30, 39, 40, 49]) expect(partnerAgeFor("male", a)).toBe("late 20s");
    for (const a of [50, 59]) expect(partnerAgeFor("male", a)).toBe("mid 30s");
    for (const a of [60, 75]) expect(partnerAgeFor("male", a)).toBe("early 40s");
  });
  it("여성 이용자: 20대 20대 후반, 30대 30대 중반, 40대 이상 40대 초반", () => {
    for (const a of [20, 29]) expect(partnerAgeFor("female", a)).toBe("late 20s");
    for (const a of [30, 39]) expect(partnerAgeFor("female", a)).toBe("mid 30s");
    for (const a of [40, 55, 70]) expect(partnerAgeFor("female", a)).toBe("early 40s");
  });
  it("20세 미만이거나 나이를 모르면 이미지를 만들지 않는다", () => {
    for (const g of ["male", "female"] as const) {
      for (const a of [0, 9, 10, 15, 17, 19, NaN]) expect(partnerAgeFor(g, a)).toBeNull();
    }
  });
  it("프롬프트에 연령대가 들어가고 성인이라고 적는다", () => {
    expect(spousePrompt("female", "fire", "early 40s")).toMatch(/her early 40s/);
    expect(spousePrompt("male", "water", "mid 30s")).toMatch(/his mid 30s/);
    expect(spousePrompt("female", "fire")).toMatch(/clearly an adult/);
  });
  it("만 나이는 생일 전에는 한 살 적다", () => {
    expect(ageOn({ year: 1990, month: 12, day: 25 }, new Date(2026, 9, 30))).toBe(35);
    expect(ageOn({ year: 1990, month: 10, day: 30 }, new Date(2026, 9, 30))).toBe(36);
  });
});
