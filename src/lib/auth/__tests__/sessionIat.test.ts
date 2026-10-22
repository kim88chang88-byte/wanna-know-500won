import { describe, expect, it } from "vitest";
import { createSessionToken, parseSessionMinIat, verifySessionToken } from "../session";

const SECRET = "s".repeat(40);
const NOW = 1_800_000_000;

describe("세션 발급 시각(iat)과 비상 무효화", () => {
  it("발급할 때 iat 가 들어가요", () => {
    const t = createSessionToken({ sub: "u1", exp: NOW + 100 }, SECRET, NOW - 50);
    expect(verifySessionToken(t, SECRET, NOW, 0)?.iat).toBe(NOW - 50);
  });
  it("최소 발급 시각보다 옛 쿠키는 거절", () => {
    const t = createSessionToken({ sub: "u1", exp: NOW + 100 }, SECRET, NOW - 50);
    expect(verifySessionToken(t, SECRET, NOW, NOW - 10)).toBeNull();
    expect(verifySessionToken(t, SECRET, NOW, NOW - 50)?.sub).toBe("u1");
  });
  it("iat 없는 옛 쿠키는 비상 값이 켜지면 거절, 꺼져 있으면 통과", () => {
    const legacy = (() => {
      const payload = Buffer.from(JSON.stringify({ sub: "u1", exp: NOW + 100 }), "utf8").toString("base64url");
      const sig = require("node:crypto").createHmac("sha256", SECRET).update(payload).digest("base64url");
      return `${payload}.${sig}`;
    })();
    expect(verifySessionToken(legacy, SECRET, NOW, 0)?.sub).toBe("u1");
    expect(verifySessionToken(legacy, SECRET, NOW, NOW - 100)).toBeNull();
  });
  it("환경변수 값 해석: 숫자만 받고 나머지는 0", () => {
    expect(parseSessionMinIat("1800000000")).toBe(1_800_000_000);
    expect(parseSessionMinIat(" 12 ")).toBe(12);
    expect(parseSessionMinIat("abc")).toBe(0);
    expect(parseSessionMinIat(undefined)).toBe(0);
  });
});
