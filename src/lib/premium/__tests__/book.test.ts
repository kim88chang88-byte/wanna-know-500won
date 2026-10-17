import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { buildPremiumReport } from "../report";
import type { TopicKey } from "../types";

const NOW = new Date("2026-10-18T00:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };
const FORBIDDEN = ["사망", "죽음", "재앙", "저주", "액운", "파산", "이혼", "불행", "흉운", "큰일 난", "조심하세요"];
const RAW: Record<TopicKey, string> = { love: "연애 매력 리포트", marriage: "우리 둘의 궁합 리포트", money: "올해 재물·직장 운 리포트", success: "성공운", health: "건강운", study: "학업운", general: "" };
const KEYS = ["overview", "pillars", "nature", "elements", "tengods", "geukguk", "topic", "daeun", "years", "lucky"];

describe("프리미엄 10페이지 리포트", () => {
  const inputs: BirthInput[] = [
    base,
    { ...base, gender: "male" },
    { ...base, year: 2001, month: 11, day: 3, hour: 14, minute: 20, gender: "male" },
    { ...base, year: 1985, month: 2, day: 4, hour: null, minute: null },
    { ...base, year: 1998, month: 12, day: 25, hour: 23, minute: 30 },
    { ...base, year: 1976, month: 3, day: 9, hour: 5, minute: 10, gender: "male" },
  ];

  it("full 은 정확히 10페이지, 순서와 번호가 맞다", () => {
    const r = buildPremiumReport(base, NOW, "full", RAW.love);
    expect(r.book.map((p) => p.key)).toEqual(KEYS);
    expect(r.book.map((p) => p.no)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("basic 은 리포트 본문이 비어 있다 (서버에서 비움)", () => {
    expect(buildPremiumReport(base, NOW, "basic", RAW.love).book).toEqual([]);
  });

  for (const topic of Object.keys(RAW) as TopicKey[]) {
    it(`${topic}: 모든 입력에서 10페이지가 채워지고 겁주는 표현·빈 값이 없다`, () => {
      for (const input of inputs) {
        const r = buildPremiumReport(input, NOW, "full", RAW[topic]);
        expect(r.book.length).toBe(10);
        for (const p of r.book) {
          expect(p.title.length).toBeGreaterThan(2);
          expect(p.lead.length).toBeGreaterThan(5);
          expect(p.sections.length).toBeGreaterThanOrEqual(3);
          for (const s of p.sections) {
            expect(s.heading.length).toBeGreaterThan(1);
            expect(s.body.length).toBeGreaterThan(8);
          }
        }
        const all = JSON.stringify(r.book);
        for (const w of FORBIDDEN) expect(all.includes(w)).toBe(false);
        expect(all.includes("undefined")).toBe(false);
        expect(all.includes("NaN")).toBe(false);
        expect(all.includes("[object")).toBe(false);
        // 충분히 상세한 분량
        const chars = r.book.reduce((a, p) => a + p.sections.reduce((b, s) => b + s.body.length, 0), 0);
        expect(chars).toBeGreaterThan(5000);
      }
    });
  }

  it("대운 표는 10칸이고 현재 대운 한 칸만 강조된다", () => {
    const r = buildPremiumReport(base, NOW, "full", RAW.love);
    const daeun = r.book[7].tables[0];
    expect(daeun.rows.length).toBe(10);
    expect(daeun.rows.filter((x) => x.highlight).length).toBe(1);
  });

  it("월별 표는 12칸이다", () => {
    const r = buildPremiumReport(base, NOW, "full", RAW.money);
    expect(r.book[8].tables[1].rows.length).toBe(12);
  });

  it("시간을 모르면 시주를 풀이하지 않고 안내한다", () => {
    const r = buildPremiumReport({ ...base, hour: null, minute: null }, NOW, "full", RAW.love);
    const all = JSON.stringify(r.book[1]);
    expect(all.includes("시주는 비워 두었어요")).toBe(true);
    expect(r.book[1].tables[0].rows[3].value).toBe("시간 미상");
  });

  it("주제에 따라 7쪽 제목이 달라지고, 같은 입력이면 같은 결과다", () => {
    const a = buildPremiumReport(base, NOW, "full", RAW.love);
    const b = buildPremiumReport(base, NOW, "full", RAW.money);
    expect(a.book[6].title).not.toBe(b.book[6].title);
    expect(JSON.stringify(a.book)).toBe(JSON.stringify(buildPremiumReport(base, NOW, "full", RAW.love).book));
  });
});
