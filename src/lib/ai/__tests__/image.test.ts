import { describe, expect, it } from "vitest";
import { estimateCostUsd, generateImage, spousePrompt, usageOf } from "../image";

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
