import { describe, expect, it } from "vitest";
import { originAllowed, takeLimit } from "../guard";

const URL_ = "https://wanna-know-500won.vercel.app/api/reading";
const h = (o: Record<string, string>) => new Headers(o);

describe("originAllowed", () => {
  it("같은 사이트에서 온 요청은 통과", () => {
    expect(originAllowed(h({ origin: "https://wanna-know-500won.vercel.app" }), URL_, {})).toBe(true);
  });
  it("Origin 이 없으면(서버끼리 호출 등) 통과", () => {
    expect(originAllowed(h({}), URL_, {})).toBe(true);
  });
  it("다른 사이트 Origin 은 거절", () => {
    expect(originAllowed(h({ origin: "https://evil.example" }), URL_, {})).toBe(false);
  });
  it("Sec-Fetch-Site 가 cross-site 면 거절", () => {
    expect(originAllowed(h({ "sec-fetch-site": "cross-site", origin: "https://wanna-know-500won.vercel.app" }), URL_, {})).toBe(false);
  });
  it("Origin: null 은 거절", () => {
    expect(originAllowed(h({ origin: "null" }), URL_, {})).toBe(false);
  });
  it("NEXT_PUBLIC_SITE_URL 의 도메인은 통과 (연결한 도메인)", () => {
    expect(originAllowed(h({ origin: "https://dori.example" }), URL_, { NEXT_PUBLIC_SITE_URL: "https://dori.example" })).toBe(true);
  });
});

describe("takeLimit (DB 없을 때 메모리 제한)", () => {
  it("한도까지는 통과, 넘으면 막고 대기 시간을 알려줘요", async () => {
    const name = `t-${Math.random()}`;
    expect((await takeLimit(name, "ip:1", 2, 60_000)).ok).toBe(true);
    expect((await takeLimit(name, "ip:1", 2, 60_000)).ok).toBe(true);
    const third = await takeLimit(name, "ip:1", 2, 60_000);
    expect(third.ok).toBe(false);
    expect(!third.ok && third.retryAfterSec >= 1).toBe(true);
  });
  it("다른 대상은 따로 세요", async () => {
    const name = `t-${Math.random()}`;
    await takeLimit(name, "ip:1", 1, 60_000);
    expect((await takeLimit(name, "u:abc", 1, 60_000)).ok).toBe(true);
  });
});
