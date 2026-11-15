import { describe, expect, it } from "vitest";
import type { SajuChart } from "@/lib/saju/types";
import { HOBBY, MENU, mealFor, mealsAll, recommendFacts, recommendKind, recommendVisual } from "../menuHobby";
import { FOOD_ART, HOBBY_ART } from "@/lib/foodArt";
import { EVAL_MENU } from "../evalSets";
import { unableReply } from "../outOfScope";

// 水가 하나도 없는 사주: 가장 얇은 기운이 물
const chart: SajuChart = {
  year: { stem: "甲", branch: "寅" },
  month: { stem: "丙", branch: "午" },
  day: { stem: "戊", branch: "戌" },
  hour: { stem: "庚", branch: "申" },
  solarDate: { year: 1990, month: 5, day: 17 },
  uncertainPillars: [],
  warnings: [],
};
const noon = new Date("2026-11-16T03:00:00Z"); // 한국 12시
const night = new Date("2026-11-16T14:30:00Z"); // 한국 23시30분

describe("메뉴·취미 추천", () => {
  it("질문에서 종류를 알아봐요", () => {
    expect(recommendKind("점심 뭐 먹지?")).toBe("meal");
    expect(recommendKind("저녁 메뉴 추천해줘")).toBe("meal");
    expect(recommendKind("내 사주에 맞는 취미 추천해 줘")).toBe("hobby");
    expect(recommendKind("올해 연애운 어때?")).toBeNull();
  });
  it("다른 거 추천은 직전 종류를 따라가요", () => {
    const h = [{ role: "user" as const, text: "점심 뭐 먹지?" }, { role: "dori" as const, text: "비빔밥 어때?" }];
    expect(recommendKind("다른 거 추천해줘", h)).toBe("meal");
  });
  it("끼니는 말이 우선, 없으면 한국 시각", () => {
    expect(mealFor("아침 뭐 먹지", noon)).toBe("아침");
    expect(mealFor("뭐 먹지", noon)).toBe("점심");
    expect(mealFor("뭐 먹지", night)).toBe("야식");
  });
  it("후보는 표 안에서만 나와요", () => {
    const f = recommendFacts("점심 뭐 먹지?", [], chart, null, noon);
    expect(f?.종류).toBe("메뉴");
    expect(f?.끼니).toBe("점심");
    const all = Object.values(MENU).flatMap((m) => m.점심);
    for (const c of f?.후보 ?? []) expect(all).toContain(c);
    expect(f?.규칙.join(" ")).toMatch(/병|다이어트|낫게|살이 빠진다/);
  });
  it("물이 부족하면 물 기운 후보", () => {
    const f = recommendFacts("저녁 뭐 먹지", [], chart, null, noon);
    expect(f?.기준기운).toContain("물 기운");
    expect(MENU.water.저녁).toContain(f?.후보[0]);
  });
  it("이미 추천한 건 가능하면 빼요", () => {
    const first = MENU.water.점심[0];
    const h = [{ role: "user" as const, text: "점심 뭐 먹지?" }, { role: "dori" as const, text: `${first} 어때?` }];
    const f = recommendFacts("다른 거 추천해줘", h, chart, null, noon);
    expect(f?.후보).not.toContain(first);
  });
  it("취미 후보도 표 안에서", () => {
    const f = recommendFacts("취미 추천해 줘", [], chart, null, noon);
    const all = Object.values(HOBBY).flatMap((h) => [...h.혼자, ...h.함께, ...h.밖]);
    expect(f?.종류).toBe("취미");
    for (const c of f?.후보 ?? []) expect(all).toContain(c);
  });
  it("표에 위험한 취미나 의학 말이 없어요", () => {
    const text = JSON.stringify([MENU, HOBBY]);
    expect(text).not.toMatch(/도박|주식|번지|스카이다이빙|술|치료|다이어트|병을/);
  });
  it("점검 질문 중 가게 질문만 미리 걸러져요", () => {
    for (const q of EVAL_MENU) {
      const un = unableReply(q.q);
      expect(Boolean(un)).toBe(q.expect === "prefilter");
    }
  });
  it("표의 모든 메뉴·취미에 그림 이름이 있어요", () => {
    for (const m of Object.values(MENU)) for (const k of ["아침", "점심", "저녁"] as const) for (const n of m[k]) expect(FOOD_ART[n], n).toBeTruthy();
    for (const h of Object.values(HOBBY)) for (const n of [...h.혼자, ...h.함께, ...h.밖]) expect(HOBBY_ART[n], n).toBeTruthy();
  });
  it("답에 나온 후보만 그림 카드로 만들어요", () => {
    const f = recommendFacts("점심 뭐 먹지?", [], chart, null, noon);
    expect(f).not.toBeNull();
    const first = f!.후보[0];
    const v = recommendVisual(f!, `오늘은 ${first} 어때?`);
    expect(v?.kind).toBe("food");
    expect(v?.items.map((i) => i.label)).toEqual([first]);
    expect(recommendVisual(f!, "오늘은 그냥 쉬어 가자")).toBeNull();
  });
  it("아침점심저녁을 함께 물으면 세 끼 모두 돌려줘요", () => {
    expect(mealsAll("오늘 아침점심저녁 메뉴 추천해줘")).toEqual(["아침", "점심", "저녁"]);
    expect(mealsAll("하루 식단 짜줘")).toEqual(["아침", "점심", "저녁"]);
    expect(mealsAll("점심 뭐 먹지")).toBeNull();
    expect(mealsAll("점심이랑 저녁 추천")).toEqual(["점심", "저녁"]);
  });
});
