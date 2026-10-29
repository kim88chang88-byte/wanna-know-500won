import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPartnerImage } from "../mergeChapters";

afterEach(() => vi.unstubAllGlobals());

const mock = (body: unknown, ok = true) => vi.stubGlobal("fetch", vi.fn(async () => ({ ok, json: async () => body })));

describe("fetchPartnerImage", () => {
  it("이미지가 오면 화면에 쓸 값만 돌려줘요", async () => {
    mock({ image: { src: "data:image/png;base64,AAA", notice: "AI가 만든 가상의 인물, 참고용 상상도", alt: "인연", usd: 0.07 } });
    const r = await fetchPartnerImage({});
    expect(r).toEqual({ src: "data:image/png;base64,AAA", notice: "AI가 만든 가상의 인물, 참고용 상상도", alt: "인연" });
  });
  it("미성년자·실패(image: null)면 null", async () => {
    mock({ image: null, reason: "minor" });
    expect(await fetchPartnerImage({})).toBeNull();
  });
  it("이미지가 아닌 주소는 받지 않아요", async () => {
    mock({ image: { src: "https://evil.example/x.png", notice: "n", alt: "a" } });
    expect(await fetchPartnerImage({})).toBeNull();
  });
  it("네트워크 오류·HTTP 오류도 null", async () => {
    mock({}, false);
    expect(await fetchPartnerImage({})).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("x"); }));
    expect(await fetchPartnerImage({})).toBeNull();
  });
});
