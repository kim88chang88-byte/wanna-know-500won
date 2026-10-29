import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { buildPremiumReport } from "../report";
import type { TopicKey } from "../types";

const NOW = new Date("2026-10-18T00:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };
const FORBIDDEN = ["사망", "죽음", "재앙", "저주", "액운", "파산", "이혼", "불행", "흉운", "큰일 난", "조심하세요"];
const RAW: Record<TopicKey, string> = { love: "연애운", marriage: "우리 둘의 궁합 리포트", money: "재물운", success: "성공운", health: "건강운", study: "2027 신년운", general: "" };
const KEYS = ["concernTop", "preface", "overview", "pillars", "nature", "elements", "tengods", "stage12", "sinsal", "gui", "topic:money", "topic:love", "topic:career", "topic:health", "geukguk", "daeun", "years", "years:2", "concern", "lucky"];

describe("프리미엄 20페이지 리포트", () => {
  const inputs: BirthInput[] = [
    base,
    { ...base, gender: "male" },
    { ...base, year: 2001, month: 11, day: 3, hour: 14, minute: 20, gender: "male" },
    { ...base, year: 1985, month: 2, day: 4, hour: null, minute: null },
    { ...base, year: 1998, month: 12, day: 25, hour: 23, minute: 30 },
    { ...base, year: 1976, month: 3, day: 9, hour: 5, minute: 10, gender: "male" },
  ];

  it("full 은 정확히 20페이지, 순서와 번호가 맞다", () => {
    const r = buildPremiumReport(base, NOW, "full", RAW.love);
    expect(r.book.map((p) => p.key)).toEqual(KEYS);
    expect(r.book.map((p) => p.no)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it("basic 은 리포트 본문이 비어 있다 (서버에서 비움)", () => {
    expect(buildPremiumReport(base, NOW, "basic", RAW.love).book).toEqual([]);
  });

  for (const topic of Object.keys(RAW) as TopicKey[]) {
    it(`${topic}: 모든 입력에서 20페이지가 채워지고 겁주는 표현·빈 값이 없다`, () => {
      for (const input of inputs) {
        const r = buildPremiumReport(input, NOW, "full", RAW[topic]);
        expect(r.book.length).toBe(20);
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
        expect(chars).toBeGreaterThan(9000);
      }
    });
  }

  it("대운 표는 10칸이고 현재 대운 한 칸만 강조된다", () => {
    const r = buildPremiumReport(base, NOW, "full", RAW.love);
    const daeun = r.book[15].tables[0];
    expect(daeun.rows.length).toBe(10);
    expect(daeun.rows.filter((x) => x.highlight).length).toBe(1);
  });

  it("월별 표는 12칸이다", () => {
    const r = buildPremiumReport(base, NOW, "full", RAW.money);
    expect(r.book[17].tables[0].rows.length).toBe(12);
  });

  it("시간을 모르면 시주를 풀이하지 않고 안내한다", () => {
    const r = buildPremiumReport({ ...base, hour: null, minute: null }, NOW, "full", RAW.love);
    const all = JSON.stringify(r.book[3]);
    expect(all.includes("시주는 비워 두었어요")).toBe(true);
    expect(r.book[3].tables[0].rows[3].value).toBe("시간 미상");
  });

  it("주제에 따라 19쪽 고민 맞춤 풀이가 달라지고, 같은 입력이면 같은 결과다", () => {
    const a = buildPremiumReport(base, NOW, "full", RAW.love);
    const b = buildPremiumReport(base, NOW, "full", RAW.money);
    expect(a.book[18].lead).not.toBe(b.book[18].lead);
    expect(JSON.stringify(a.book)).toBe(JSON.stringify(buildPremiumReport(base, NOW, "full", RAW.love).book));
  });

  describe("잠금(블러) 처리", () => {
    const open = buildPremiumReport(base, NOW, "full", RAW.love, false);
    const locked = buildPremiumReport(base, NOW, "full", RAW.love, true);
    const secs = locked.book.flatMap((p) => p.sections);
    const lockedSecs = secs.filter((x) => x.locked);

    it("잠금을 끄면 locked=false, 모든 풀이가 열려 있고 용신·요약도 내려온다", () => {
      expect(open.locked).toBe(false);
      expect(open.book.flatMap((p) => p.sections).some((x) => x.locked)).toBe(false);
      expect(open.yongsin.length).toBeGreaterThan(0);
      expect(open.summary.length).toBeGreaterThan(0);
    });

    it("잠그면 일부(25~55%)만 잠기고, 모든 페이지에 열린 풀이가 남아 있다", () => {
      const ratio = lockedSecs.length / secs.length;
      expect(ratio).toBeGreaterThan(0.25);
      expect(ratio).toBeLessThan(0.5);
      for (const p of locked.book) expect(p.sections.some((x) => !x.locked)).toBe(true);
      expect(locked.locked).toBe(true);
    });

    it("잠긴 풀이는 서버에서 같은 길이의 의미 없는 글자로 바뀌어 진짜 문장이 없다", () => {
      const original = open.book.flatMap((p) => p.sections);
      const lockedJson = JSON.stringify(locked);
      locked.book.forEach((p, pi) =>
        p.sections.forEach((sec, si) => {
          if (!sec.locked) return;
          const real = open.book[pi].sections[si].body;
          expect(sec.body.length).toBe(real.length);
          expect(sec.body).not.toBe(real);
          // 같은 문장이 다른 열린 풀이에 일부러 들어 있는 경우(공통 문장)는 제외하고 확인해요.
          const sharedWithFree = original.some((o, k) => !secs[k].locked && o.body.includes(real));
          if (!sharedWithFree) expect(lockedJson.includes(real)).toBe(false);
        }),
      );
      expect(original.length).toBe(secs.length);
    });

    it("잠금 상태에서는 용신·길신·요약·올해 흐름(timing)도 비어서 내려온다", () => {
      expect(locked.yongsin).toEqual([]);
      expect(locked.gilsin).toEqual([]);
      expect(locked.hyungsin).toEqual([]);
      expect(locked.summary).toBe("");
      expect(locked.topic.timing).toEqual([]);
      // 본문(book)에는 열린 풀이가 '丙(병)이' 같은 말로 용신 글자를 자연스럽게 언급할 수 있어서, 용신 칸 자체가 새지 않는지를 봐요.
      const j = JSON.stringify({ ...locked, book: [] });
      for (const y of open.yongsin) expect(j.includes(y)).toBe(false);
    });

    it("잠긴 표 칸은 가려지고, 현재 대운 이전 칸은 그대로 보인다", () => {
      const rows = locked.book[15].tables[0].rows;
      const cur = rows.findIndex((x) => x.highlight);
      rows.forEach((r, i) => expect(Boolean(r.locked)).toBe(i > cur));
      expect(locked.book[17].tables[0].rows.filter((r) => r.locked).length).toBe(10);
    });

    it("시간 모름·여러 주제에서도 잠금이 오류 없이 동작한다", () => {
      for (const t of Object.keys(RAW) as TopicKey[]) {
        const r = buildPremiumReport({ ...base, hour: null, minute: null, gender: "male" }, NOW, "full", RAW[t], true);
        expect(r.book.length).toBe(20);
        expect(JSON.stringify(r.book).includes("undefined")).toBe(false);
      }
    });

    it("basic 은 잠금 값이 있어도 본문 자체가 없다", () => {
      const r = buildPremiumReport(base, NOW, "basic", RAW.love, true);
      expect(r.book).toEqual([]);
      expect(r.locked).toBe(false);
    });
  });
});
