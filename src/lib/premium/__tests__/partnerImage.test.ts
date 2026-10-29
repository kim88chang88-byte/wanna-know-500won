import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPartnerImage } from "../mergeChapters";

afterEach(() => vi.unstubAllGlobals());

const mock = (body: unknown, ok = true) => vi.stubGlobal("fetch", vi.fn(async () => ({ ok, json: async () => body })));

describe("fetchPartnerImage", () => {
  it("이미지가 오면 화면에 쓸 값만 돌려줘요", async () => {
    mock({ image: { src: "data:image/png;base64,AAA", notice: "AI가 만든 가상의 인물, 참고용 상상도", alt: "인연", usd: 0.07 }, title: "철수 님의 미래 운명의 짝", profile: [{ label: "직업", tags: ["심리·상담"] }] });
    const r = await fetchPartnerImage({});
    expect(r).toEqual({ src: "data:image/png;base64,AAA", notice: "AI가 만든 가상의 인물, 참고용 상상도", alt: "철수 님의 미래 운명의 짝", title: "철수 님의 미래 운명의 짝", profile: [{ label: "직업", tags: ["심리·상담"] }] });
  });
  it("미성년자·실패(image: null)면 null", async () => {
    mock({ image: null, reason: "minor" });
    expect(await fetchPartnerImage({})).toBeNull();
  });
  it("이미지만 실패하면 프로필만 보여요", async () => {
    mock({ image: null, title: "님의 짝", profile: [{ label: "성격", tags: ["침착함"] }], reason: "failed" });
    const r = await fetchPartnerImage({});
    expect(r?.src).toBeNull();
    expect(r?.profile).toHaveLength(1);
  });
  it("이미지가 아닌 주소는 받지 않아요", async () => {
    mock({ image: { src: "https://evil.example/x.png", notice: "n", alt: "a" }, title: "t", profile: [{ label: "직업", tags: ["a"] }] });
    expect((await fetchPartnerImage({}))?.src).toBeNull();
  });
  it("네트워크 오류·HTTP 오류도 null", async () => {
    mock({}, false);
    expect(await fetchPartnerImage({})).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("x"); }));
    expect(await fetchPartnerImage({})).toBeNull();
  });
});
