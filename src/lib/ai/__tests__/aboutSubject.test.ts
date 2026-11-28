import { describe, expect, it } from "vitest";
import { parseSubject, SUBJECT_GATE } from "../chat";

describe("다른 사람 알아채기", () => {
  it("관계 낱말이 있을 때만 분류를 불러요", () => {
    expect(SUBJECT_GATE.test("내 친한 형님 아들이 이번에 수능을 봤는데 이 친구는 운명이 어떻게 될까?")).toBe(true);
    expect(SUBJECT_GATE.test("엄마 올해 운이 궁금해")).toBe(true);
    expect(SUBJECT_GATE.test("올해 이직운이 어때?")).toBe(false);
  });
  it("분류 결과를 안전하게 읽어요", () => {
    expect(parseSubject({ other: true, who: "형님 아들" })).toEqual({ other: true, who: "형님 아들" });
    expect(parseSubject({ other: false, who: 3 })).toEqual({ other: false, who: "" });
    expect(parseSubject({ other: "yes" })).toBeNull();
    expect(parseSubject(null)).toBeNull();
    expect(parseSubject({ other: true, who: "<b>".padEnd(30, "가") })?.who.length).toBeLessThanOrEqual(12);
  });
});
