import { describe, expect, it } from "vitest";
import { EMPTY_FORM, buildBirthInput, validateStep, type IntakeForm } from "../intake";

const ok = (over: Partial<IntakeForm> = {}): IntakeForm => ({
  ...EMPTY_FORM,
  solarDate: "1990-05-17",
  time: "08:30",
  gender: "female",
  consent: true,
  ...over,
});

describe("validateStep", () => {
  it("양력 날짜: 비었거나 없는 날짜, 범위 밖은 안내 문구", () => {
    expect(validateStep("date", EMPTY_FORM)).not.toBeNull();
    expect(validateStep("date", ok({ solarDate: "2023-02-30" }))).toMatch(/없는 날짜/);
    expect(validateStep("date", ok({ solarDate: "1899-12-31" }))).toMatch(/1900/);
    expect(validateStep("date", ok({ solarDate: "2101-01-01" }))).toMatch(/2100/);
  });

  it("양력 날짜: 윤일(2024-02-29)은 통과, 평년(2023-02-29)은 거절", () => {
    expect(validateStep("date", ok({ solarDate: "2024-02-29" }))).toBeNull();
    expect(validateStep("date", ok({ solarDate: "2023-02-29" }))).not.toBeNull();
  });

  it("음력 날짜: 숫자·범위 검사", () => {
    const lunar = (y: string, m: string, d: string) => ok({ calendar: "lunar", lunarYear: y, lunarMonth: m, lunarDay: d });
    expect(validateStep("date", lunar("1990", "4", "23"))).toBeNull();
    expect(validateStep("date", lunar("", "4", "23"))).not.toBeNull();
    expect(validateStep("date", lunar("1990", "13", "1"))).toMatch(/1~12/);
    expect(validateStep("date", lunar("1990", "4", "31"))).toMatch(/1~30/);
    expect(validateStep("date", lunar("19a0", "4", "3"))).not.toBeNull();
  });

  it("시간: 모른다고 하면 통과, 안다고 했는데 비었으면 안내", () => {
    expect(validateStep("time", ok({ timeKnown: false, time: "" }))).toBeNull();
    expect(validateStep("time", ok({ timeKnown: true, time: "" }))).not.toBeNull();
    expect(validateStep("time", ok({ time: "24:00" }))).not.toBeNull();
    expect(validateStep("time", ok({ time: "23:59" }))).toBeNull();
  });

  it("성별·동의는 꼭 필요", () => {
    expect(validateStep("gender", ok({ gender: null }))).not.toBeNull();
    expect(validateStep("consent", ok({ consent: false }))).not.toBeNull();
    expect(validateStep("consent", ok())).toBeNull();
  });
});

describe("buildBirthInput", () => {
  it("양력 + 시간 있음", () => {
    expect(buildBirthInput(ok())).toEqual({
      year: 1990, month: 5, day: 17, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female",
    });
  });

  it("시간을 모르면 hour/minute 는 null (입력창에 값이 남아 있어도 무시)", () => {
    const r = buildBirthInput(ok({ timeKnown: false, time: "08:30" }));
    expect(r?.hour).toBeNull();
    expect(r?.minute).toBeNull();
  });

  it("음력 윤달은 음력일 때만 true", () => {
    const lunar = buildBirthInput(ok({ calendar: "lunar", lunarYear: "2020", lunarMonth: "4", lunarDay: "8", isLeapMonth: true }));
    expect([lunar?.year, lunar?.month, lunar?.day, lunar?.calendar, lunar?.isLeapMonth]).toEqual([2020, 4, 8, "lunar", true]);
    const solar = buildBirthInput(ok({ isLeapMonth: true }));
    expect(solar?.isLeapMonth).toBe(false);
  });

  it("한 단계라도 올바르지 않으면 null", () => {
    expect(buildBirthInput(ok({ consent: false }))).toBeNull();
    expect(buildBirthInput(ok({ solarDate: "" }))).toBeNull();
  });
});

describe("상대방(궁합) 입력", () => {
  it("상대방 단계는 내 단계와 같은 규칙으로 검사한다", async () => {
    const { validatePartnerStep, EMPTY_BIRTH, buildBirthFields, COMPAT_STEPS } = await import("../intake");
    expect(validatePartnerStep("pdate", EMPTY_BIRTH)).not.toBeNull();
    expect(validatePartnerStep("pgender", EMPTY_BIRTH)).not.toBeNull();
    const ok = { ...EMPTY_BIRTH, solarDate: "1992-03-04", time: "09:30", gender: "male" as const };
    expect(validatePartnerStep("pdate", ok)).toBeNull();
    expect(validatePartnerStep("ptime", ok)).toBeNull();
    expect(validatePartnerStep("pgender", ok)).toBeNull();
    expect(buildBirthFields(ok)).toMatchObject({ year: 1992, month: 3, day: 4, hour: 9, minute: 30, gender: "male", calendar: "solar" });
    expect(buildBirthFields({ ...ok, timeKnown: false })).toMatchObject({ hour: null, minute: null });
    expect(buildBirthFields(EMPTY_BIRTH)).toBeNull();
    // 내 질문 뒤, 고민 앞에 상대방 질문 3개가 들어간다
    expect(COMPAT_STEPS.slice(3, 6)).toEqual(["pdate", "ptime", "pgender"]);
  });
});

describe("한 화면 입력(생년월일·성별·시간)", () => {
  const base = { ...EMPTY_FORM, consent: true };
  it("날짜·시간 글자를 숫자만으로도 모양에 맞춰 줘요", async () => {
    const { formatDateInput, formatTimeInput } = await import("../intake");
    expect(formatDateInput("19881229")).toBe("1988-12-29");
    expect(formatDateInput("1988-1")).toBe("1988-1");
    expect(formatDateInput("198812")).toBe("1988-12");
    expect(formatDateInput("1988-12-29-99")).toBe("1988-12-29");
    expect(formatTimeInput("0930")).toBe("09:30");
    expect(formatTimeInput("9")).toBe("9");
    expect(formatTimeInput("09:30")).toBe("09:30");
  });
  it("음력은 연·월·일로 나눠 담고, 덜 적었으면 비워요", async () => {
    const { dateTextToFields } = await import("../intake");
    expect(dateTextToFields("1990-04-23", "lunar")).toMatchObject({ lunarYear: "1990", lunarMonth: "4", lunarDay: "23", solarDate: "" });
    expect(dateTextToFields("1990-04", "lunar")).toMatchObject({ lunarYear: "", lunarMonth: "", lunarDay: "" });
    expect(dateTextToFields("1988-12-29", "solar")).toMatchObject({ solarDate: "1988-12-29" });
  });
  it("birth 단계: 날짜 → 성별 → 시간 순서로 안내해요", () => {
    expect(validateStep("birth", base)).toMatch(/생년월일/);
    expect(validateStep("birth", { ...base, solarDate: "1988-12-29" })).toMatch(/성별/);
    const ok = { ...base, solarDate: "1988-12-29", gender: "female" as const };
    expect(validateStep("birth", ok)).toMatch(/시간/);
    expect(validateStep("birth", { ...ok, time: "09:30" })).toBeNull();
    expect(validateStep("birth", { ...ok, timeKnown: false })).toBeNull();
  });
  it("정확한 시간을 모르면 시간대를 골라야 하고, 고르면 그 시간대 가운데 시각으로 계산해요", async () => {
    const { TIME_BLOCKS } = await import("../intake");
    const f = { ...base, solarDate: "1988-12-29", gender: "female" as const, timeApprox: true };
    expect(validateStep("birth", f)).toMatch(/시간대/);
    const oh = TIME_BLOCKS.find((b) => b.label === "오시")!;
    const done = { ...f, time: oh.time };
    expect(validateStep("birth", done)).toBeNull();
    expect(buildBirthInput(done)).toMatchObject({ year: 1988, month: 12, day: 29, hour: 12, minute: 0, gender: "female" });
  });
  it("시간대 12개는 자시부터 해시까지 두 시간씩 이어져요", async () => {
    const { TIME_BLOCKS } = await import("../intake");
    expect(TIME_BLOCKS).toHaveLength(12);
    expect(TIME_BLOCKS.map((b) => b.time)).toEqual(["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"]);
  });
  it("저장된 정보가 없을 때의 단계는 생년월일 한 화면 + 고민 + 동의", async () => {
    const { COMBINED_STEPS } = await import("../intake");
    expect(COMBINED_STEPS).toEqual(["birth", "concern", "consent"]);
  });
});
