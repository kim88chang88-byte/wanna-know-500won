import { describe, expect, it } from "vitest";
import { chunkAnswer } from "../chatMarkup";
import { buildChatMemo, toneOfScore } from "../ai/chatMemo";
import { cleanChoices } from "../ai/chat";

describe("chunkAnswer", () => {
  it("빈 줄로 문단을 나눠요", () => {
    expect(chunkAnswer("첫째.\n\n둘째.\n\n셋째.")).toEqual(["첫째.", "둘째.", "셋째."]);
  });
  it("긴 문단은 문장 끝에서 나눠요", () => {
    const s = "가".repeat(60) + ". " + "나".repeat(60) + ". " + "다".repeat(30) + ".";
    const out = chunkAnswer(s);
    expect(out.length).toBe(2);
    expect(out.join(" ")).toContain("나".repeat(60));
  });
  it("소수점은 문장 끝으로 보지 않아요", () => {
    const out = chunkAnswer("점수는 3.5점이야. " + "가".repeat(120));
    expect(out[0]).toContain("3.5점");
  });
  it("굵게 표시가 두 조각에 걸치면 합쳐요", () => {
    const s = "가".repeat(100) + ". **" + "나".repeat(20) + ". " + "다".repeat(20) + "** 끝.";
    for (const c of chunkAnswer(s)) expect((c.match(/\*\*/g)?.length ?? 0) % 2).toBe(0);
  });
});

describe("도리 메모", () => {
  const daily = (god: string, extra: string[] = [], harmony?: string) =>
    ({ 오늘일진: "戊子(무자)", 일간과의관계: { 십성: god, 분위기: "" }, ...(harmony ? { 일간합충: harmony } : {}), 지지관계: extra }) as never;
  const today = { year: 2026, month: 11, day: 10 };
  it("날짜·요일·일진을 보여 줘요", () => {
    const m = buildChatMemo(daily("편재"), today);
    const row = (k: string) => m.rows.find((r) => r[0] === k)?.[1] ?? "";
    expect(row("보는 날")).toBe("2026-11-10 (화)");
    expect(row("오늘 일진")).toBe("戊子(무자)");
    expect(row("나와의 관계").startsWith("편재 · ")).toBe(true);
    expect(row("내 글자와 만나면")).toBe("눈에 띄는 합충은 없어요");
  });
  it("충이 있으면 지수가 내려가고 글에 드러나요", () => {
    const a = buildChatMemo(daily("정재"), today).score;
    const b = buildChatMemo(daily("정재", ["오늘 子와 내 일지 午: 충 — 자극"]), today);
    expect(b.score).toBe(a - 8);
    expect(b.rows.find((r) => r[0] === "내 글자와 만나면")?.[1]).toContain("일지 午와 충");
  });
  it("지수는 20~95 안이고 분위기 이름이 맞아요", () => {
    expect(buildChatMemo(daily("겁재", ["오늘 子와 내 일지 午: 충 — x", "오늘 子와 내 월지 午: 충 — x", "오늘 子와 내 월지 午: 해 — x"], "오늘 글자가 내 일간과 충"), today).score).toBeGreaterThanOrEqual(20);
    expect(toneOfScore(80)).toBe("힘이 붙는 날");
    expect(toneOfScore(60)).toBe("순항하는 날");
    expect(toneOfScore(45)).toBe("차분히 점검하는 날");
    expect(toneOfScore(30)).toBe("쉬어 가는 날");
  });
});

describe("cleanChoices", () => {
  it("딱 2개일 때만 써요", () => {
    expect(cleanChoices(["편한 사이야", "아직 어려워"])).toEqual(["편한 사이야", "아직 어려워"]);
    expect(cleanChoices(["하나"])).toEqual([]);
    expect(cleanChoices(["a".repeat(30), "아직 어려워"])).toEqual([]);
    expect(cleanChoices(undefined)).toEqual([]);
  });
});

import { buildCompatMemo, buildReadingMemo } from "../ai/chatMemo";
describe("풀이·궁합 메모", () => {
  const ch = (y: string, m: string, d: string, h: string | null) => {
    const p = (g: string) => ({ stem: g[0], branch: g[1] });
    return { year: p(y), month: p(m), day: p(d), hour: h ? p(h) : null, solarDate: { year: 1990, month: 1, day: 1 }, uncertainPillars: [] } as never;
  };
  it("풀이 메모: 12개월에서 힘이 붙는 달·천천히 가는 달을 골라요", () => {
    const m = buildReadingMemo(ch("戊辰", "甲子", "戊午", "丁巳"), { 신강신약: "x", 용신: ["丙(병)"], 올해세운: { 간지: "丁未", 천간십성: "정인" } } as never, new Date("2027-02-15T12:00:00+09:00"));
    expect(m.title).toBe("2027년의 흐름");
    expect(m.rows[0][1]).toContain("2027년");
    const good = m.rows.find((r) => r[0] === "힘이 붙는 달")?.[1] ?? "";
    expect(good.split(" · ")).toHaveLength(3);
    expect(m.score).toBeGreaterThanOrEqual(20);
    expect(m.score).toBeLessThanOrEqual(95);
    expect(m.tone.endsWith("해")).toBe(true);
  });
  it("궁합 메모: 일지가 합이면 점수가 오르고 이름이 비어도 만들어져요", () => {
    const a = buildCompatMemo(ch("戊辰", "甲子", "戊午", null), ch("己巳", "乙丑", "己未", null), {});
    const b = buildCompatMemo(ch("戊辰", "甲子", "戊午", null), ch("己巳", "乙丑", "己卯", null), {});
    expect(a.score).toBeGreaterThan(b.score);
    expect(a.rows.find((r) => r[0] === "일지끼리 만나면")?.[1]).toContain("합");
    expect(a.rows[0][1]).toContain("나");
  });
});
