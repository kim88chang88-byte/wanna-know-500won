import { describe, expect, it } from "vitest";
import type { DailyFacts } from "../ai/dailyFacts";
import { DAILY_GODS, dailyLine, variantOf } from "../daily/line";
import { pickVaultFollowup, followupPrompt, markAnswered, readAnswered } from "../vaultFollowup";
import { summarizeVault } from "../vaultStats";

const facts = (god: DailyFacts["일간과의관계"]["십성"], 합충?: string): DailyFacts => ({ 오늘일진: "丙午(병오)", 일간과의관계: { 십성: god, 분위기: "" }, ...(합충 ? { 일간합충: 합충 } : {}), 지지관계: [] });

describe("오늘의 도리 한마디", () => {
  it("같은 날엔 같은 문장, 열 가지 십성 모두 문장이 있다", () => {
    for (const g of DAILY_GODS) {
      const a = dailyLine(facts(g), "2026-10-23");
      expect(a.line.length > 10).toBe(true);
      expect(a.tip.startsWith("오늘의 작은 실천")).toBe(true);
      expect(dailyLine(facts(g), "2026-10-23").line).toBe(a.line);
    }
    expect(DAILY_GODS.length).toBe(10);
  });
  it("날짜가 바뀌면 세 문장 안에서 달라질 수 있다", () => {
    const set = new Set(Array.from({ length: 30 }, (_, i) => variantOf(`2026-10-${String(i + 1).padStart(2, "0")}`)));
    expect(set.size).toBe(3);
  });
  it("합/충이면 부드러운 한 줄이 이어진다", () => {
    expect(dailyLine(facts("비견", "오늘 글자가 내 일간과 합(끌림·어울림)"), "2026-10-23").line).toContain("끌리는");
    expect(dailyLine(facts("비견", "오늘 글자가 내 일간과 충(부딪힘·자극)"), "2026-10-23").line).toContain("활력");
  });
  it("겁주는 표현이 없다", () => {
    for (const g of DAILY_GODS) for (const d of ["2026-10-21", "2026-10-22", "2026-10-23"]) {
      const l = dailyLine(facts(g, "오늘 글자가 내 일간과 충(부딪힘·자극)"), d).line;
      expect(/조심|위험|불길|흉|파산|이별|사고/.test(l)).toBe(false);
    }
  });
});

describe("지난 풀이 후속 질문", () => {
  const now = new Date("2026-10-23T03:00:00Z");
  const rows = [
    { id: "a", topic: "success", created_at: "2026-10-22T03:00:00Z" },
    { id: "b", topic: "money", created_at: "2026-10-18T03:00:00Z" },
    { id: "c", topic: "love", created_at: "2026-10-15T03:00:00Z" },
    { id: "d", topic: "study", created_at: "2026-07-01T03:00:00Z" },
  ];
  it("3일~60일 사이 중 가장 최근 것을 고른다", () => {
    expect(pickVaultFollowup(rows, now, [])?.id).toBe("b");
  });
  it("이미 대답한 건 건너뛴다", () => {
    expect(pickVaultFollowup(rows, now, ["b"])?.id).toBe("c");
    expect(pickVaultFollowup(rows, now, ["b", "c"])).toBeNull();
  });
  it("질문 문구와 세 갈래가 나온다", () => {
    const p = pickVaultFollowup(rows, now, [])!;
    const q = followupPrompt(p);
    expect(q.title).toContain("5일 전");
    expect(q.title).toContain("재물운");
    expect(q.check.options.length).toBe(3);
  });
  it("대답한 풀이 번호를 기억한다", () => {
    const m = new Map<string, string>();
    const st = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    markAnswered(st, "x");
    markAnswered(st, "x");
    expect(readAnswered(st)).toEqual(["x"]);
  });
});

describe("보관함 모으기 요약", () => {
  it("이번 달(한국 시간) 개수와 주제별 개수를 센다", () => {
    const now = new Date("2026-10-23T03:00:00Z");
    const s = summarizeVault(
      [
        { topic: "success", created_at: "2026-10-01T00:00:00Z" },
        { topic: "success", created_at: "2026-10-22T03:00:00Z" },
        { topic: "money", created_at: "2026-10-05T03:00:00Z" },
        { topic: "love", created_at: "2026-09-30T14:59:00Z" }, // KST 9월 30일
        { topic: "love", created_at: "2026-09-30T15:00:00Z" }, // KST 10월 1일
      ],
      now,
    );
    expect(s.total).toBe(5);
    expect(s.month).toBe(4);
    expect(s.byTopic[0]).toEqual({ name: "성공운", n: 2 });
  });
});
