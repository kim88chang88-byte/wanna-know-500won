import { describe, expect, it } from "vitest";
import { CAREER_Q, MONEY_WORDS, careerFacts } from "../careerFacts";
import { CHAT_SYSTEM_PROMPT } from "../chat";
import { LOVE_Q } from "../loveFacts";

const chart = {
  year: { stem: "庚", branch: "午" },
  month: { stem: "戊", branch: "戌" },
  day: { stem: "丙", branch: "寅" },
  hour: { stem: "甲", branch: "午" },
} as never;

describe("일 재료", () => {
  it("일·성공 질문을 잡는다", () => {
    for (const q of ["나 올해 승진할 수 있을까?", "이직하면 더 잘 풀릴까?", "창업하면 성공할 수 있을까", "발표나 면접이 있는데", "시험 합격할 수 있을까?"]) expect(CAREER_Q.test(q)).toBe(true);
    expect(LOVE_Q.test("나 올해 승진할 수 있을까?")).toBe(false);
    expect(MONEY_WORDS.test("창업하면 성공할 수 있을까")).toBe(false);
  });

  it("관성·식상·인성과 세운 십성을 계산해 준다", () => {
    const f = careerFacts(chart, new Date("2026-11-20T12:00:00+09:00")) as Record<string, string>;
    // 병화(火) 일간: 관성=水, 식상=土, 인성=木
    expect(f.인정받는결).toContain("물 기운");
    expect(f.재주를쓰는결).toContain("땅 기운");
    expect(f.배우고받치는힘).toContain("나무 기운");
    expect(f.직장자리월주).toContain("식신");
    expect(f.올해세운).toContain("2026년");
    expect(f.올해세운).not.toContain("올해 분위기");
    expect(f.어울리는분야).toContain("→");
    expect(f.내년세운).toContain("2027년");
  });

  it("프롬프트가 일재료를 쓰고 메모장·땅불 근거를 기본으로 두지 않는다", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("일재료");
    expect(CHAT_SYSTEM_PROMPT).toContain("폰 메모장에 적기");
    expect(CHAT_SYSTEM_PROMPT).toContain("연애 곡을 일 고민에 권하지 마");
  });
});

import { parseChatReply } from "../chat";
describe("선택지와 칩", () => {
  it("선택지가 있으면 후속 질문 칩은 비운다", () => {
    const r = parseChatReply({ answer: "📝 시험을 앞두고 있구나! 어느 정도 준비했어? 솔직하게 말해 줄래? 그래야 맞춰서 짚어 줄 수 있어.", followups: ["공부 기간은 어느 정도야?", "남은 기간 어떻게 정리할까?"], choices: ["열심히 했어", "솔직히 설렁했어"] });
    expect(r?.choices).toHaveLength(2);
    expect(r?.followups).toEqual([]);
  });
});
