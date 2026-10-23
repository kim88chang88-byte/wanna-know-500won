import { describe, expect, it } from "vitest";
import { asSnapshot, MAX_VAULT_BYTES, parseVaultBody } from "../vault";

const report = {
  level: "full",
  pillars: [{}, {}, {}, {}],
  elements: [],
  strength: { grade: "신강" },
  topic: { title: "재물" },
  summary: "요약 문장",
  book: [],
};
const NOW = new Date("2026-10-23T01:00:00Z");

describe("내 보관함 입력 검사", () => {
  it("정상 입력은 제목·요약·해시를 만들어요", () => {
    const p = parseVaultBody({ topic: "재물운 자판기", premium: true, report, kkotgeoji: "  한마디  ", reason: null }, NOW);
    expect(p?.snapshot.topic).toBe("money");
    expect(p?.title).toBe("재물운 · 프리미엄 · 10월 23일");
    expect(p?.summary).toBe("한마디");
    expect(p?.payloadHash.length).toBe(64);
  });
  it("같은 내용·같은 날은 같은 해시, 다른 날은 다른 해시", () => {
    const a = parseVaultBody({ topic: "재물운", report }, NOW);
    const b = parseVaultBody({ topic: "재물운", report }, NOW);
    const c = parseVaultBody({ topic: "재물운", report }, new Date("2026-10-25T01:00:00Z"));
    expect(a?.payloadHash).toBe(b?.payloadHash);
    expect(a?.payloadHash === c?.payloadHash).toBe(false);
  });
  it("kkotgeoji 가 없으면 요약은 리포트 summary", () => {
    expect(parseVaultBody({ topic: "x", report }, NOW)?.summary).toBe("요약 문장");
  });
  it("모양이 이상하거나 너무 크면 거절", () => {
    expect(parseVaultBody(null, NOW)).toBeNull();
    expect(parseVaultBody({ report: { pillars: [] } }, NOW)).toBeNull();
    expect(parseVaultBody({ report: { ...report, book: ["x".repeat(MAX_VAULT_BYTES)] } }, NOW)).toBeNull();
  });
  it("보관함에서 꺼낸 값 확인", () => {
    expect(asSnapshot({ v: 1, report })).toBeTruthy();
    expect(asSnapshot({ v: 2, report })).toBeNull();
    expect(asSnapshot("x")).toBeNull();
  });
});
