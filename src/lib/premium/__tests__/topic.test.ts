import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { buildPremiumReport } from "../report";
import { resolveTopic, TOPIC_META } from "../topic";
import type { TopicKey } from "../types";

const NOW = new Date("2026-10-18T00:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };
const FORBIDDEN = ["사망", "죽음", "재앙", "저주", "액운", "파산", "이혼", "불행", "흉운", "큰일 난", "조심하세요"];

describe("resolveTopic", () => {
  it.each([
    ["연애운", "love"],
    ["연애 매력 리포트", "love"],
    ["결혼운", "marriage"],
    ["우리 둘의 궁합 리포트", "marriage"],
    ["재물운", "money"],
    ["올해 재물·직장 운 리포트", "money"],
    ["성공운", "success"],
    ["건강운", "health"],
    ["학업운", "study"],
    ["", "general"],
    ["아무거나", "general"],
  ])("%s → %s", (raw, key) => {
    expect(resolveTopic(raw)).toBe(key);
  });
  it("문자열이 아니면 general", () => {
    expect(resolveTopic(null)).toBe("general");
    expect(resolveTopic(3)).toBe("general");
  });
});

const TOPICS: TopicKey[] = ["love", "marriage", "money", "success", "health", "study", "general"];
const RAW: Record<TopicKey, string> = { love: "연애운", marriage: "결혼운", money: "재물운", success: "성공운", health: "건강운", study: "학업운", general: "" };

describe("주제별 맞춤 분석", () => {
  const inputs: BirthInput[] = [
    base,
    { ...base, gender: "male" },
    { ...base, year: 2001, month: 11, day: 3, hour: 14, minute: 20, gender: "male" },
    { ...base, year: 1985, month: 2, day: 4, hour: null, minute: null },
    { ...base, year: 1998, month: 12, day: 25, hour: 23, minute: 30 },
  ];
  for (const topic of TOPICS) {
    it(`${topic}: 모든 입력에서 내용이 채워지고, 겁주는 표현이 없다`, () => {
      for (const input of inputs) {
        for (const level of ["basic", "full"] as const) {
          const t = buildPremiumReport(input, NOW, level, RAW[topic]).topic;
          expect(t.key).toBe(topic);
          expect(t.label).toBe(TOPIC_META[topic].label);
          expect(t.headline.length).toBeGreaterThan(5);
          expect(t.points.length).toBeGreaterThanOrEqual(2);
          expect(t.tags).toHaveLength(3);
          expect(t.tags.every((x) => x.startsWith("#"))).toBe(true);
          expect(t.quote.length).toBeGreaterThan(5);
          expect(Array.from(t.quote).length).toBeLessThanOrEqual(40);
          expect(t.lucky.hex).toMatch(/^#[0-9A-F]{6}$/i);
          const all = JSON.stringify(t);
          for (const w of FORBIDDEN) expect(all.includes(w)).toBe(false);
          expect(all.includes("undefined")).toBe(false);
          expect(all.includes("NaN")).toBe(false);
        }
      }
    });
  }
  it("basic 은 흐름(timing)이 없고 full 은 올해·대운 흐름이 있다", () => {
    expect(buildPremiumReport(base, NOW, "basic", "연애운").topic.timing).toEqual([]);
    const full = buildPremiumReport(base, NOW, "full", "연애운").topic;
    expect(full.timing.length).toBeGreaterThanOrEqual(2);
    expect(full.timing[0].title).toContain("2026");
  });
  it("full 은 basic 보다 포인트가 같거나 많다", () => {
    for (const topic of TOPICS) {
      const b = buildPremiumReport(base, NOW, "basic", RAW[topic]).topic.points.length;
      const f = buildPremiumReport(base, NOW, "full", RAW[topic]).topic.points.length;
      expect(f).toBeGreaterThanOrEqual(b);
    }
  });
  it("같은 입력이면 같은 결과 (결정적)", () => {
    expect(JSON.stringify(buildPremiumReport(base, NOW, "full", "재물운").topic)).toBe(JSON.stringify(buildPremiumReport(base, NOW, "full", "재물운").topic));
  });
  it("주제에 따라 내용이 다르다", () => {
    const heads = TOPICS.map((t) => buildPremiumReport(base, NOW, "basic", RAW[t]).topic.headline);
    expect(new Set(heads).size).toBeGreaterThanOrEqual(5);
  });
  it("건강운은 의학적 진단이 아니라는 안내를 담는다", () => {
    const t = buildPremiumReport(base, NOW, "basic", "건강운").topic;
    expect(JSON.stringify(t)).toContain("의학적 진단이 아니에요");
  });
  it("성별에 따라 연애운의 '끌리는 사람' 문장이 달라질 수 있다", () => {
    const f = buildPremiumReport({ ...base, gender: "female" }, NOW, "basic", "연애운").topic.points[1].body;
    const m = buildPremiumReport({ ...base, gender: "male" }, NOW, "basic", "연애운").topic.points[1].body;
    expect(typeof f).toBe("string");
    expect(typeof m).toBe("string");
  });
});
