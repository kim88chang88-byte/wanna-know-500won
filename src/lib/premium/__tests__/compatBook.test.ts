import { describe, expect, it } from "vitest";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import { buildCompat } from "../compat";
import { buildCompatBook, lockCompatBook, type BookSource } from "../book/compatBook";

const KO = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" } as const;

function source(year: string, month: string, day: string, hour: string, strength = "strong", yongsin = ["丙", "癸"]): BookSource {
  const detail = (p: string) => {
    const s = STEMS.find((x) => x.hanja === p[0])!;
    const b = BRANCHES.find((x) => x.hanja === p[1])!;
    return { stemKo: s.hangul, branchKo: b.hangul, element: { stem: KO[s.element], branch: KO[b.element] } };
  };
  return {
    pillars: { year, month, day, hour },
    pillarDetails: { year: detail(year), month: detail(month), day: detail(day), hour: detail(hour) },
    dayStem: day[0],
    currentYear: 2026,
    advanced: { dayStrength: { strength, score: 55 }, yongsin },
    daeun: { current: { ganzhi: "丙寅", startAge: 23, endAge: 32 } },
    seyun: [
      { year: 2026, ganzhi: "丙午", tenGodStem: "편재", tenGodBranch: "정재" },
      { year: 2027, ganzhi: "丁未", tenGodStem: "정인", tenGodBranch: "식신" },
    ],
  };
}

const me = source("庚午", "辛巳", "甲子", "丙寅");
const other = source("辛未", "癸未", "己丑", "壬申", "weak", ["庚", "壬"]);

function book(hourKnown = true) {
  const compat = buildCompat(me, other, hourKnown, hourKnown);
  return { compat, pages: buildCompatBook(me, other, { compat, meHourKnown: hourKnown, otherHourKnown: hourKnown }) };
}

describe("궁합 10페이지 리포트", () => {
  it("10쪽이고 번호·제목·부제가 채워져 있다", () => {
    const { pages } = book();
    expect(pages.length).toBe(10);
    pages.forEach((p, i) => {
      expect(p.no).toBe(i + 1);
      expect(p.title.length > 0).toBe(true);
      expect(p.lead.length > 0).toBe(true);
      expect(p.sections.length > 0).toBe(true);
      expect(p.subtitle).toBe(`PREMIUM REPORT · ${String(i + 1).padStart(2, "0")}`);
    });
  });

  it("1쪽은 '나의 사주 한눈에 보기'가 아니라 '둘의 궁합 한눈에 보기'다", () => {
    const { pages } = book();
    expect(pages[0].title).toBe("둘의 궁합 한눈에 보기");
    expect(pages[0].key).toBe("c-overview");
    expect(JSON.stringify(pages)).not.toContain("나의 사주 한눈에 보기");
  });

  it("쪽 key 가 서로 다르고 모두 궁합용(c-)이다", () => {
    const keys = book().pages.map((p) => p.key);
    expect(new Set(keys).size).toBe(10);
    expect(keys.every((k) => k.startsWith("c-"))).toBe(true);
  });

  it("두 사람의 일주가 본문에 나온다", () => {
    const text = JSON.stringify(book().pages);
    expect(text).toContain("甲子");
    expect(text).toContain("己丑");
  });

  it("무서운 단정 표현을 쓰지 않는다", () => {
    expect(JSON.stringify(book().pages)).not.toMatch(/이혼|헤어|파탄|불행|재앙|나쁜 궁합|안 맞|운명적으로 끝/);
  });

  it("태어난 시간을 모르면 시주를 비교하지 않았다고 알려 준다", () => {
    const { pages } = book(false);
    expect(pages[4].sections.some((s) => s.body.includes("시주는 비교하지 않았어요"))).toBe(true);
    expect(pages[0].sections.some((s) => s.body.includes("시간을 모르는 사람"))).toBe(true);
  });

  it("오행 비교 표는 5줄(목화토금수)이다", () => {
    const rows = book().pages[5].tables[0].rows;
    expect(rows.map((r) => r.label)).toEqual(["목", "화", "토", "금", "수"]);
  });
});

describe("궁합 리포트 잠금", () => {
  it("잠그면 '언제·어떻게' 풀이는 같은 길이의 의미 없는 글자로 바뀐다", () => {
    const { pages } = book();
    const locked = lockCompatBook(pages, 2026);
    const lockedSections = locked.flatMap((p) => p.sections.filter((s) => s.locked));
    expect(lockedSections.length).toBeGreaterThanOrEqual(5);
    const original = pages.flatMap((p) => p.sections).find((s) => s.heading === "데이트 처방")!;
    const masked = lockedSections.find((s) => s.heading === "데이트 처방")!;
    expect(masked.body.length).toBe(original.body.length);
    expect(masked.body).not.toBe(original.body);
    // 열려 있는 쪽(1쪽)은 그대로
    expect(locked[0].sections.every((s) => !s.locked)).toBe(true);
  });
});

describe("조사", () => {
  it("받침에 따라 을/를·이/가·과/와·으로/로 를 붙인다", async () => {
    const { josa } = await import("../josa");
    expect(josa("흙", "을/를")).toBe("흙을");
    expect(josa("나무", "을/를")).toBe("나무를");
    expect(josa("흙", "이/가")).toBe("흙이");
    expect(josa("나무", "이/가")).toBe("나무가");
    expect(josa("나무", "과/와")).toBe("나무와");
    expect(josa("정관", "으로/로")).toBe("정관으로");
    expect(josa("식신", "으로/로")).toBe("식신으로");
    expect(josa("편재", "으로/로")).toBe("편재로");
    expect(josa("겁재", "으로/로")).toBe("겁재로");
    expect(josa("불꽃", "으로/로")).toBe("불꽃으로");
    expect(josa("달", "으로/로")).toBe("달로");
  });
  it("본문에 어긋난 조사가 남지 않는다", () => {
    const text = JSON.stringify(book().pages);
    expect(text).not.toMatch(/흙가|흙를|정관로|정재으로|사주이에요/);
  });
});
