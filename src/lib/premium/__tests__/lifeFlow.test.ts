import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { buildPremiumReport } from "../report";
import { applyLocks } from "../book/lock";
import { chainLine, ganzhiLabel, stageOf } from "../book/lifeFlow";

const NOW = new Date("2026-10-18T00:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };
const FORBIDDEN = ["사망", "죽음", "재앙", "저주", "액운", "파산", "이혼", "불행", "흉운", "큰일 난", "조심하세요", "고생문"];

describe("십이운성 계산(음양순역)", () => {
  it("대표 값이 맞다", () => {
    expect(stageOf("癸", "亥")).toBe("제왕");
    expect(stageOf("癸", "卯")).toBe("장생");
    expect(stageOf("甲", "亥")).toBe("장생");
    expect(stageOf("甲", "卯")).toBe("제왕");
    expect(stageOf("丙", "寅")).toBe("장생");
    expect(stageOf("乙", "午")).toBe("장생");
    expect(stageOf("庚", "巳")).toBe("장생");
    expect(stageOf("辛", "子")).toBe("장생");
    expect(stageOf("壬", "子")).toBe("제왕");
  });
  it("상생 고리 문장", () => {
    expect(chainLine("수", "목")).toContain("수생목");
    expect(chainLine("목", "화")).toContain("목생화");
    expect(chainLine("목", "목")).toContain("같은");
    expect(ganzhiLabel("甲子")).toBe("갑자(甲子)");
  });
  it("대운의 십이운성(ssaju)과 같은 기준이다", () => {
    for (const input of [base, { ...base, gender: "male" as const }, { ...base, year: 1985, month: 2, day: 4 }]) {
      const r = buildPremiumReport(input, NOW, "full", "연애운", false);
      const dayStem = Array.from(r.pillars.find((p) => p.key === "day")!.full ?? "")[0];
      const rows = r.book.find((x) => x.key === "stage12")!.tables[0].rows;
      expect(rows.length).toBeGreaterThanOrEqual(8);
      for (const row of rows) {
        const [gz, st] = row.value.split(" · ");
        expect(stageOf(dayStem, gz[1])).toBe(st);
      }
    }
  });
});

describe("제4장 십이운성 쪽 보강", () => {
  for (const gender of ["female", "male"] as const) {
    it(`${gender}: 그래프·번호 카드·지금 위치·행동·마무리가 있고 20쪽을 지킨다`, () => {
      const r = buildPremiumReport({ ...base, gender }, NOW, "full", "연애운", false);
      expect(r.book.length).toBe(20);
      const p = r.book.find((x) => x.key === "stage12")!;
      expect(p.chart?.axis).toBeDefined();
      expect(p.chart!.points.length).toBeGreaterThanOrEqual(8);
      expect(p.chart!.points.every((q) => q.tag)).toBe(true);
      expect(p.chart!.points.filter((q) => q.current).length).toBe(1);
      const cards = p.sections.filter((s) => /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫] /.test(s.heading));
      expect(cards.length).toBe(p.chart!.points.length);
      expect(cards.filter((s) => s.heading.includes("(지금)")).length).toBe(1);
      const heads = p.sections.map((s) => s.heading).join("|");
      for (const w of ["도리의 용어 사전", "지금 네 위치는?", "지금 시기에 해 볼 행동 두 가지", "도리의 한마디", "지금에서 다음으로 이어지는 결"]) expect(heads).toContain(w);
      expect(p.sections.some((s) => /^연주 /.test(s.heading))).toBe(true);
      const all = JSON.stringify(p);
      for (const w of FORBIDDEN) expect(all.includes(w)).toBe(false);
      expect(all.includes("undefined")).toBe(false);
      expect(all.includes("NaN")).toBe(false);
    });

    it(`${gender}: 잠금 미리보기는 지금 카드까지 열고 이후 카드와 행동 지침은 가린다`, () => {
      const r = buildPremiumReport({ ...base, gender }, NOW, "full", "연애운", false);
      const locked = applyLocks(r.book, 2026).find((x) => x.key === "stage12")!;
      const idx = locked.sections.findIndex((s) => s.heading.includes("(지금)"));
      expect(idx).toBeGreaterThan(0);
      expect(locked.sections[idx].locked).toBeFalsy();
      expect(locked.sections.slice(idx + 1).every((s) => s.locked)).toBe(true);
      expect(locked.sections.slice(0, idx).every((s) => !s.locked)).toBe(true);
    });
  }

  it("10년 카드는 지난·지금·앞으로가 다른 마무리를 가진다", () => {
    const r = buildPremiumReport(base, NOW, "full", "연애운", false);
    const cards = r.book.find((x) => x.key === "stage12")!.sections.filter((s) => /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫] /.test(s.heading));
    const idx = cards.findIndex((s) => s.heading.includes("(지금)"));
    expect(idx).toBeGreaterThan(0);
    expect(cards.slice(0, idx).every((s) => s.mbti?.tense === "past" && s.body.includes("괜찮아") && /의지로|노력으로|스스로/.test(s.body))).toBe(true);
    expect(cards[idx].mbti?.tense).toBe("now");
    expect(cards[idx].body).toContain("너라면 충분히 해낼 수 있어");
    expect(cards.slice(idx + 1).every((s) => s.mbti?.tense === "future" && s.body.includes("너라면 할 수 있어"))).toBe(true);
    for (const c of cards) {
      expect(c.body).toContain("**“");
      expect(c.body.split("\n\n").length).toBeGreaterThanOrEqual(3);
    }
  });

  it("잠긴 카드에는 MBTI 열쇠가 내려가지 않는다", () => {
    const r = buildPremiumReport(base, NOW, "full", "연애운", false);
    const locked = applyLocks(r.book, 2026).find((x) => x.key === "stage12")!;
    expect(locked.sections.filter((s) => s.locked).every((s) => s.mbti === undefined)).toBe(true);
  });

  it("시간을 몰라도 원국 자리별 읽기는 세 기둥으로 나온다", () => {
    const r = buildPremiumReport({ ...base, hour: null, minute: null }, NOW, "full", "재물운", false);
    const p = r.book.find((x) => x.key === "stage12")!;
    expect(p.sections.filter((s) => /^(연주|월주|일주|시주) /.test(s.heading)).length).toBe(3);
  });
});
