import { describe, expect, it } from "vitest";
import { cleanHistory, CRISIS_ANSWER, isCrisis, parseChatAnswer } from "../chat";
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
});
