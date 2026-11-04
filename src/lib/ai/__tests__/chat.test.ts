import { describe, expect, it } from "vitest";
import { cleanFollowups, cleanHistory, CRISIS_ANSWER, earlierQuestions, isCrisis, parseChatAnswer, parseChatReply } from "../chat";
import { parseCtx } from "@/lib/chatServer";
import { summarizeReport } from "@/lib/chatContext";

const long = (s: string) => s.repeat(12);

describe("도리 상담방", () => {
  it("대화 기록은 마지막이 사용자의 말이어야 해요", () => {
    expect(cleanHistory([{ role: "user", text: "안녕" }])).toHaveLength(1);
    expect(cleanHistory([{ role: "user", text: "안녕" }, { role: "dori", text: "응" }])).toBeNull();
    expect(cleanHistory([{ role: "admin", text: "x" }])).toBeNull();
    expect(cleanHistory("x")).toBeNull();
  });

  it("긴 말은 잘라요", () => {
    const h = cleanHistory([{ role: "user", text: "가".repeat(900) }]);
    expect(h![0].text.length).toBe(400);
  });

  it("마음이 힘든 말은 AI 없이 안내해요", () => {
    expect(isCrisis("요즘 죽고 싶어요")).toBe(true);
    expect(isCrisis("이직 시기가 궁금해")).toBe(false);
    expect(CRISIS_ANSWER).toContain("109");
  });

  it("답은 길이와 금지어를 검사해요", () => {
    expect(parseChatAnswer({ answer: "짧아" })).toBeNull();
    expect(parseChatAnswer({ answer: long("이혼 이야기는 하지 않아. ") })).toBeNull();
    expect(parseChatAnswer({ answer: long("연락이 뜸해지면 괜히 마음이 쓰이지. ") })).toBeTruthy();
  });

  it("결과 요약은 길이를 제한해요", () => {
    const s = summarizeReport({ topic: { label: "연애운", headline: "h", points: [{ title: "t", body: "b".repeat(500) }] }, concern: { text: "이직" } });
    expect(s).toContain("고민: 이직");
    expect(s.length).toBeLessThanOrEqual(1500);
  });

  it("후속 질문 칩은 걸러서 3개까지만 써요", () => {
    expect(cleanFollowups(["물 기운을 채우는 습관이 있어?", "물 기운을 채우는 습관이 있어?", "좋", 3, "이혼하면 어떻게 돼?", "다음 달엔 뭘 조심해?", "이번 주에 해 볼 일은?", "하나 더 물어봐도 돼?"])).toEqual(["물 기운을 채우는 습관이 있어?", "다음 달엔 뭘 조심해?", "이번 주에 해 볼 일은?"]);
    expect(cleanFollowups(undefined)).toEqual([]);
  });

  it("답이 괜찮으면 후속 질문이 없어도 통과해요", () => {
    const r = parseChatReply({ answer: long("연락이 뜸해지면 괜히 마음이 쓰이지. ") });
    expect(r?.followups).toEqual([]);
    expect(parseChatReply({ answer: "짧아", followups: ["물 기운은 어떻게 채워?"] })).toBeNull();
  });

  it("오래된 질문은 한 줄 요약으로 이어 붙여요", () => {
    const h = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 === 0 ? ("user" as const) : ("dori" as const), text: `말${i}` }));
    expect(earlierQuestions(h)).toBe("말0 / 말2");
    expect(earlierQuestions(h.slice(0, 5))).toBe("");
  });

  it("신년운 주제는 reading 에서만 받아요", () => {
    expect(parseCtx({ kind: "reading", summary: "", topic: "study" })?.topic).toBe("study");
    expect(parseCtx({ kind: "daily", summary: "", topic: "study" })?.topic).toBeNull();
    expect(parseCtx({ kind: "reading", summary: "", topic: "love" })?.topic).toBeNull();
  });
});
