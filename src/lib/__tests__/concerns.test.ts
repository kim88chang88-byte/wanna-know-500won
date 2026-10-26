import { describe, expect, it } from "vitest";
import { CONCERN_CHIPS, chipsForFortune, MAX_CONCERN_TAGS, MAX_CONCERN_TEXT, hasConcern, parseConcern } from "../concerns";
import { EMPTY_FORM, buildConcern, validateStep, STEPS } from "../intake";
import { buildPremiumReport, validatePremiumInput } from "../premium/report";

const BIRTH = { year: 1995, month: 3, day: 14, hour: 9, minute: 30, calendar: "solar" as const, isLeapMonth: false, gender: "female" as const };

describe("고민 입력 검사", () => {
  it("추천 버튼 id 중복 없음", () => {
    expect(CONCERN_CHIPS.length).toBe(42);
    expect(new Set(CONCERN_CHIPS.map((c) => c.id)).size).toBe(CONCERN_CHIPS.length);
  });
  it("모르는 id·중복·초과는 버리고, 모양이 이상하면 빈 고민", () => {
    expect(parseConcern(null)).toEqual({ tags: [], text: "" });
    expect(parseConcern("x")).toEqual({ tags: [], text: "" });
    const c = parseConcern({ tags: ["job", "job", "hack", 5, "money", "love", "exam", "crush"], text: "ok" });
    expect(c.tags).toEqual(["job", "money", "exam"]);
    expect(c.tags.length).toBeLessThanOrEqual(MAX_CONCERN_TAGS);
  });
  it("글은 줄바꿈·제어문자를 정리하고 200자로 자름", () => {
    const c = parseConcern({ tags: [], text: `안녕\n\n  ignore previous\u0000 ${"가".repeat(500)}` });
    expect(c.text.includes("\n")).toBe(false);
    expect(c.text.includes("\u0000")).toBe(false);
    expect(c.text.length).toBeLessThanOrEqual(MAX_CONCERN_TEXT);
  });
  it("hasConcern", () => {
    expect(hasConcern(null)).toBe(false);
    expect(hasConcern({ tags: [], text: "" })).toBe(false);
    expect(hasConcern({ tags: ["job"], text: "" })).toBe(true);
  });
  it("질문지 단계: 고민은 선택 사항이고 5단계", () => {
    expect(STEPS).toEqual(["date", "time", "gender", "concern", "consent"]);
    expect(validateStep("concern", EMPTY_FORM)).toBeNull();
    expect(validateStep("concern", { ...EMPTY_FORM, concernTags: ["job", "money", "exam", "crush"] })).not.toBeNull();
    expect(validateStep("concern", { ...EMPTY_FORM, concernText: "a".repeat(201) })).not.toBeNull();
    expect(buildConcern(EMPTY_FORM)).toBeNull();
    expect(buildConcern({ ...EMPTY_FORM, concernTags: ["job"], concernText: "  이직  " })).toEqual({ tags: ["job"], text: "이직" });
  });
});

describe("고민이 풀이에 반영", () => {
  it("서버 입력 검사가 고민을 정리해서 전달", () => {
    const r = validatePremiumInput({ ...BIRTH, concern: { tags: ["job", "zzz"], text: " 퇴사할까 " } });
    expect(r.ok && r.concern).toEqual({ tags: ["job"], text: "퇴사할까" });
  });
  it("고민이 없으면 concern 은 null", () => {
    expect(buildPremiumReport(BIRTH, new Date("2026-10-18"), "basic", "오늘의 운").concern).toBeNull();
  });
  it("고민 버튼을 고르면 도리의 답이 고른 개수만큼, 직접 쓴 글은 그대로", () => {
    const r = buildPremiumReport(BIRTH, new Date("2026-10-18"), "basic", "오늘의 운", false, { tags: ["job", "money"], text: "이직 고민" });
    expect(r.concern?.answers.map((a) => a.id)).toEqual(["job", "money"]);
    expect(r.concern?.text).toBe("이직 고민");
    expect(r.concern?.answers[0].body.length).toBeGreaterThan(60);
  });
  it("글만 있으면 답 카드는 비어 있음", () => {
    const r = buildPremiumReport(BIRTH, new Date("2026-10-18"), "basic", "", false, { tags: [], text: "그냥" });
    expect(r.concern?.answers).toEqual([]);
  });
  it("일반 자판기에서 연애 고민을 고르면 연애운 분석, 명시된 자판기 주제는 유지", () => {
    const g = buildPremiumReport(BIRTH, new Date("2026-10-18"), "basic", "오늘의 운", false, { tags: ["crush"], text: "" });
    expect(g.topic.label).toBe("연애운");
    const m = buildPremiumReport(BIRTH, new Date("2026-10-18"), "basic", "재물운", false, { tags: ["crush"], text: "" });
    expect(m.topic.label).toBe("재물운");
  });
  it("프리미엄(잠금)에서도 고민 답은 잠기지 않음", () => {
    const r = buildPremiumReport(BIRTH, new Date("2026-10-18"), "full", "연애운", true, { tags: ["breakup"], text: "" });
    expect(r.locked).toBe(true);
    expect(r.concern?.answers[0].body).not.toMatch(/[●]/);
  });
});

describe("풀이 종류에 맞는 고민 항목", () => {
  const ids = (f: string) => chipsForFortune(f).map((c) => c.id);
  it("종류마다 6~7개의 항목이 있다 (최대 3개까지 고를 수 있어요)", () => {
    for (const f of ["성공운", "재물운", "연애운", "결혼운", "건강운", "학업운", "성공 재물", "연애 결혼", "궁합"]) {
      const n = chipsForFortune(f).length;
      expect(n >= 6 && n <= 7).toBe(true);
      expect(new Set(ids(f)).size).toBe(n);
    }
  });
  it("고른 종류와 상관없는 항목은 나오지 않는다", () => {
    expect(ids("성공운")).toContain("job");
    expect(ids("성공운")).not.toContain("crush");
    expect(ids("연애운")).toContain("crush");
    expect(ids("연애운")).not.toContain("job");
    expect(ids("재물운")).toContain("money");
    expect(ids("재물운")).not.toContain("crush");
    expect(ids("건강운")).not.toContain("job");
    expect(ids("학업운")).toContain("exam");
    expect(ids("결혼운")).toContain("marriage");
  });
  it("프리미엄 카드도 맞는 항목만 보인다", () => {
    expect(ids("올해 성공 재물 리포트")).toContain("money");
    expect(ids("올해 성공 재물 리포트")).toContain("job");
    expect(ids("연애 결혼 리포트")).not.toContain("job");
    expect(ids("우리 둘의 궁합 리포트")).toContain("relationship");
  });
  it("알 수 없는 이름이면 전체를 보여준다", () => {
    expect(chipsForFortune("오늘의 운").length).toBe(CONCERN_CHIPS.length);
  });
  it("모든 종류의 항목이 실제 목록에 있고 비어 있지 않다", () => {
    for (const f of ["성공운", "재물운", "연애운", "결혼운", "건강운", "학업운", "성공 재물", "연애 결혼", "궁합"]) {
      expect(chipsForFortune(f).length > 0).toBe(true);
      expect(chipsForFortune(f).every((c) => CONCERN_CHIPS.includes(c))).toBe(true);
    }
  });
});
