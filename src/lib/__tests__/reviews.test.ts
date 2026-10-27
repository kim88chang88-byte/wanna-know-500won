import { describe, expect, it } from "vitest";
import { MAX_REVIEW_TEXT, parseReview, reasonLabel } from "../reviews";
import { buildStats, reviewsToCsv } from "../admin/stats";

describe("후기 입력 검사", () => {
  it("별점은 1~5 정수만", () => {
    for (const bad of [0, 6, 2.5, "5", null, undefined, NaN]) expect(parseReview({ rating: bad })).toBeNull();
    expect(parseReview(null)).toBeNull();
    expect(parseReview({ rating: 5 })).toEqual({ rating: 5, text: "", reasons: [] });
  });
  it("높은 별점에서는 아쉬운 점을 버림, 낮은 별점에서는 허용 목록·최대 3개·중복 제거", () => {
    expect(parseReview({ rating: 5, reasons: ["wrong"] })?.reasons).toEqual([]);
    expect(parseReview({ rating: 2, reasons: ["wrong", "wrong", "hack", "long", "slow", "price"] })?.reasons).toEqual(["wrong", "long", "slow"]);
  });
  it("글은 줄바꿈·제어문자 정리 + 200자", () => {
    const r = parseReview({ rating: 4, text: `좋아요\n\n<b>x</b>\u0000 ${"가".repeat(400)}` });
    expect(r?.text.includes("\n")).toBe(false);
    expect(r?.text.includes("\u0000")).toBe(false);
    expect(r!.text.length).toBeLessThanOrEqual(MAX_REVIEW_TEXT);
  });
  it("칩 이름", () => {
    expect(reasonLabel("wrong")).toBe("풀이가 나랑 안 맞아요");
  });
});

describe("후기 집계", () => {
  const now = new Date("2026-10-18T03:00:00Z");
  const rows = [
    { id: 5, rating: 5, review_text: "최고", reasons: [], topic: "love", premium: true, hidden: false, created_at: "2026-10-18T01:00:00Z" },
    { id: 4, rating: 2, review_text: null, reasons: ["wrong", "long"], topic: "money", premium: false, hidden: false, created_at: "2026-10-17T15:30:00Z" },
    { id: 3, rating: 1, review_text: "숨길 글", reasons: ["wrong"], topic: "love", premium: false, hidden: true, created_at: "2026-10-17T01:00:00Z" },
  ];
  it("평균·분포·이유는 숨긴 후기를 빼고, 목록에는 숨김 표시와 함께 남김", () => {
    const s = buildStats({ days: 7, now, totals: { users: 0, profiles: 0, draws: 0, concernLogs: 0, reviews: 3 }, draws: [], signups: [], concerns: [], reviews: rows });
    expect(s.reviews.count).toBe(2);
    expect(s.reviews.average).toBe(3.5);
    expect(s.reviews.distribution).toEqual([0, 1, 0, 0, 1]);
    expect(s.reviews.reasons[0]).toEqual({ id: "wrong", label: "풀이가 나랑 안 맞아요", count: 1 });
    expect(s.reviews.list.map((r) => [r.id, r.hidden])).toEqual([[5, false], [4, false], [3, true]]);
    expect(s.reviews.list[1].day).toBe("2026-10-18"); // UTC 15:30 = KST 다음 날 00:30
    expect(JSON.stringify(s)).not.toMatch(/user_id/);
  });
  it("후기가 없으면 평균 null", () => {
    const s = buildStats({ days: 7, now, totals: { users: 0, profiles: 0, draws: 0, concernLogs: 0, reviews: 0 }, draws: [], signups: [], concerns: [] });
    expect(s.reviews.average).toBeNull();
    expect(s.reviews.list).toEqual([]);
  });
  it("CSV: 수식 주입 방지 + BOM", () => {
    const csv = reviewsToCsv([{ ...rows[0], review_text: "=1+1" }]);
    expect(csv.startsWith("﻿날짜,")).toBe(true);
    expect(csv).toContain("'=1+1");
    expect(csv.trim().split("\r\n")).toHaveLength(2);
  });

  it("공개 동의는 한 줄 후기가 있을 때만 true 로 남는다", () => {
    expect(parseReview({ rating: 5, text: "좋아요", publicOk: true })?.publicOk).toBe(true);
    expect(parseReview({ rating: 5, text: "", publicOk: true })?.publicOk).toBeUndefined();
    expect(parseReview({ rating: 5, text: "좋아요", publicOk: "yes" })?.publicOk).toBeUndefined();
  });
});
