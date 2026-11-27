import { describe, expect, it } from "vitest";
import { HEALTH_Q, healthFacts } from "../healthFacts";
import { CHAT_SYSTEM_PROMPT } from "../chat";

const chart = { year: { stem: "戊", branch: "戌" }, month: { stem: "甲", branch: "子" }, day: { stem: "戊", branch: "午" }, hour: { stem: "丁", branch: "巳" }, solarDate: { year: 1994, month: 12, day: 10 }, uncertainPillars: [] } as never;

describe("건강 재료", () => {
  it("몸·컨디션 질문만 잡아요", () => {
    for (const q of ["나 지금 목감기 걸렸는데 올해만 다섯번째야", "요즘 피곤한데 왜 그래?", "잠을 못 자는데 어떻게 해야 해?", "올해 건강 조심할 게 있어?"]) expect(HEALTH_Q.test(q), q).toBe(true);
    for (const q of ["새 아파트로 이사가", "오늘 점심 뭐 먹지", "전남친이 연락 왔어"]) expect(HEALTH_Q.test(q), q).toBe(false);
  });
  it("오행 개수·없는 오행이 맡는 몸·태어난 계절·올해 세운과의 관계를 줘요", () => {
    const f = healthFacts(chart, new Date("2026-11-28T12:00:00+09:00"));
    expect(String(f.오행개수)).toContain("땅");
    expect(String(f.부족한기운과몸)).toContain("쇠");
    expect(String(f.부족한기운과몸)).toContain("호흡기");
    expect(String(f.태어난계절)).toContain("겨울");
    expect(String(f.올해세운과일지)).toContain("午 ↔ 일지 午");
    expect(String(f.부족할때생활)).toContain("습도");
    expect(String(f.말하는법)).toContain("진단");
  });
  it("지시문에 건강 답변 순서와 예외가 들어 있어요", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("건강재료");
    expect(CHAT_SYSTEM_PROMPT).toContain("자책 풀기");
    expect(CHAT_SYSTEM_PROMPT).toContain("증상과 이어지는 행동은 예외");
  });
});
