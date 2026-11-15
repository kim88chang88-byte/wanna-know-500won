import { describe, expect, it } from "vitest";
import { dailyLine, DAILY_GODS, tipIndexOf } from "../daily/line";
import { colorOfGanzhi, fillTip, TIP_POOL, TIPS_PER_GOD } from "../daily/tips";
import type { DailyFacts, TenGod } from "../ai/dailyFacts";

const facts = (god: TenGod, ganzhi = "丙午(병오)"): DailyFacts => ({ 오늘일진: ganzhi, 일간과의관계: { 십성: god, 분위기: "" }, 지지관계: [] });
const day = (i: number) => new Date(Date.UTC(2026, 10, 1) + i * 86_400_000).toISOString().slice(0, 10);

describe("오늘의 작은 실천 문장", () => {
  it("열 십성 모두 12개씩, 같은 문장이 겹치지 않는다", () => {
    for (const g of DAILY_GODS) {
      expect(TIP_POOL[g].length).toBe(TIPS_PER_GOD);
      expect(new Set(TIP_POOL[g].map(([, s]) => s)).size).toBe(TIPS_PER_GOD);
    }
  });
  it("빈칸은 {색}·{숫자}·{끝자리}만 쓰고, 채우면 중괄호가 남지 않는다", () => {
    for (const g of DAILY_GODS) for (const [, s] of TIP_POOL[g]) {
      expect(s.replace(/\{(색|숫자|끝자리)\}/g, "").includes("{")).toBe(false);
      expect(fillTip(s, 83, "파랑")).not.toMatch(/[{}]/);
    }
    expect(fillTip("{색} {숫자} {끝자리}", 80, "노랑")).toBe("노랑 80 5");
    expect(fillTip("{끝자리}", 83, "x")).toBe("3");
  });
  it("겁주는 말·위험한 조언·식상한 서랍 정리가 없고, 한 줄로 짧다", () => {
    for (const g of DAILY_GODS) for (const [, s] of TIP_POOL[g]) {
      expect(/조심|위험|불길|흉|파산|이별|사고|서랍|약국|약을|복용|병원|투자|주식|대출|단식|굶/.test(s)).toBe(false);
      expect(s.length).toBeLessThanOrEqual(40);
    }
  });
  it("같은 날엔 같은 문장, 같은 십성이 이어지는 날엔 어제와 다른 문장", () => {
    for (const g of DAILY_GODS) {
      expect(dailyLine(facts(g), day(3)).tip).toBe(dailyLine(facts(g), day(3)).tip);
      for (let i = 1; i < 90; i++) expect(tipIndexOf(day(i), g)).not.toBe(tipIndexOf(day(i - 1), g));
    }
  });
  it("두 달 동안 한 십성에서 12개 문장이 골고루 나온다", () => {
    const seen = new Set(Array.from({ length: 60 }, (_, i) => tipIndexOf(day(i), "정재")));
    expect(seen.size).toBeGreaterThanOrEqual(10);
  });
  it("오늘의 색은 일진 천간의 오행을 따른다", () => {
    expect(colorOfGanzhi("甲子(갑자)")).toBe("초록");
    expect(colorOfGanzhi("丙午(병오)")).toBe("코랄");
    expect(colorOfGanzhi("壬申(임신)")).toBe("파랑");
    expect(colorOfGanzhi("???")).toBe("하늘색");
  });
  it("카드의 행운 지수와 같은 숫자로 채워진다", () => {
    for (const g of DAILY_GODS) for (let i = 0; i < 20; i++) {
      const r = dailyLine(facts(g), day(i));
      expect(r.tip.startsWith("오늘의 작은 실천: ")).toBe(true);
      expect(r.tip).not.toMatch(/[{}]/);
      if (r.tip.includes("행운 ")) expect(r.tip).toContain(`행운 ${r.luck}초`);
    }
  });
});
