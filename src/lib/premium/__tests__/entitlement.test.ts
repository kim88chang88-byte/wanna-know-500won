import { describe, expect, it } from "vitest";
import { hasEntitlement, issueEntitlement } from "../entitlement";

const SECRET = "x".repeat(40);
const NOW = 1_800_000_000;

describe("프리미엄 이용권", () => {
  const tok = issueEntitlement({ sub: "u1", ref: "order-1", exp: NOW + 3600 }, SECRET);
  it("주인과 시간이 맞으면 통과", () => {
    expect(hasEntitlement(tok, SECRET, "u1", NOW)).toBe(true);
  });
  it("다른 회원이거나 로그인 안 했으면 거절", () => {
    expect(hasEntitlement(tok, SECRET, "u2", NOW)).toBe(false);
    expect(hasEntitlement(tok, SECRET, null, NOW)).toBe(false);
  });
  it("만료되면 거절", () => {
    expect(hasEntitlement(tok, SECRET, "u1", NOW + 3601)).toBe(false);
  });
  it("서명이 다르거나 위조하면 거절", () => {
    expect(hasEntitlement(tok, "y".repeat(40), "u1", NOW)).toBe(false);
    const [p] = tok.split(".");
    expect(hasEntitlement(`${p}.abc`, SECRET, "u1", NOW)).toBe(false);
    expect(hasEntitlement(null, SECRET, "u1", NOW)).toBe(false);
    expect(hasEntitlement(tok, "short", "u1", NOW)).toBe(false);
  });
  it("로그인 없이 산 이용권(*)은 누구에게나 통과", () => {
    const anon = issueEntitlement({ sub: "*", ref: "o2", exp: NOW + 60 }, SECRET);
    expect(hasEntitlement(anon, SECRET, null, NOW)).toBe(true);
  });
  it("로그인 쿠키 서명으로는 이용권을 만들 수 없어요", async () => {
    const { createSessionToken } = await import("@/lib/auth/session");
    const login = createSessionToken({ sub: "u1", exp: NOW + 3600 }, SECRET, NOW);
    expect(hasEntitlement(login, SECRET, "u1", NOW)).toBe(false);
  });
});
