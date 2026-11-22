import { describe, expect, it } from "vitest";
import { BRIDGES, sectionLink } from "../flow";

const KEYS = ["preface", "overview", "concernTop", "pillars", "nature", "elements", "tengods", "stage12", "sinsal", "gui", "topic:money", "topic:love", "topic:career", "topic:health", "geukguk", "daeun", "years", "years:2", "concern", "lucky"];

describe("이음 문장", () => {
  it("마지막 쪽을 뺀 모든 쪽에 다음 쪽으로 건네는 말이 있다", () => {
    for (const k of KEYS.slice(0, -1)) expect(BRIDGES[k], k).toBeTruthy();
  });
  it("쪽 사이 연결 문장이 돌아가며 달라진다", () => {
    const a = sectionLink("월운", 1), b = sectionLink("월운", 2);
    expect(a).not.toBe(b);
    expect(sectionLink("재물 · 부제", 1)).toContain("‘재물’");
  });
});

import { chapterOpening, type OpeningFacts } from "../flow";

describe("chapterOpening", () => {
  const f: OpeningFacts = {
    dayFull: "癸亥", dayReading: "계해",
    elements: [{ name: "수", count: 4 }, { name: "화", count: 0 }, { name: "목", count: 2 }],
    grade: "신강", geukguk: "인수격", yongsin: ["丙(병)"], daeunNow: "辛卯", year: 2026, yearGanzhi: "丙午",
  };
  it("내 사주 값으로 한 줄을 만들어요", () => {
    expect(chapterOpening("elements", f)).toContain("물 기운이 4개");
    expect(chapterOpening("elements", f)).toContain("불 기운은 0개");
    expect(chapterOpening("nature", f)).toContain("癸亥");
    expect(chapterOpening("topic:money", f)).toContain("丙");
    expect(chapterOpening("years", f)).toContain("辛卯 대운");
  });
  it("값이 없거나 모르는 장이면 null", () => {
    expect(chapterOpening("nature", { ...f, dayFull: null })).toBeNull();
    expect(chapterOpening("preface", f)).toBeNull();
  });
});
