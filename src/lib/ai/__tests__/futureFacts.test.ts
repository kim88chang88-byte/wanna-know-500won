import { describe, expect, it } from "vitest";
import { futureDate, futureFacts } from "../futureFacts";
import { CHAT_SYSTEM_PROMPT } from "../chat";

const now = new Date("2026-11-28T01:00:00+09:00");

describe("미래 시점 재료", () => {
  it("내년 2월을 2027년 2월로 읽어요", () => {
    expect(futureDate("내년 2월달에 이사 가", now)?.label).toBe("2027년 2월경");
  });
  it("시점이 없거나 곧바로 다가온 때는 건너뛰어요", () => {
    expect(futureDate("요즘 감기가 잦아", now)).toBeNull();
    expect(futureDate("이번 11월에 이사", now)).toBeNull();
  });
  it("그 시점의 세운과 월운을 계산해요", () => {
    const f = futureFacts({ year: 1990, month: 5, day: 10, hour: 14, minute: 0, calendar: "solar", gender: "male" } as never, "내년 2월에 이사 갈까", now);
    expect(f?.시점).toBe("2027년 2월경");
    expect(JSON.stringify(f?.그해세운)).toContain("丁未");
  });
  it("프롬프트에 미래 시점 규칙이 있어요", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("미래시점사주");
    expect(CHAT_SYSTEM_PROMPT).toContain("타고난자리");
  });
});
