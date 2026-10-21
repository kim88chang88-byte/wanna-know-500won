import { describe, expect, it } from "vitest";
import type { SajuChart } from "@/lib/saju/types";
import { askDori, buildAskMessage, parseAnswer } from "../ask";
import { ASK_QUESTIONS, findQuestion } from "../askQuestions";

const chart: SajuChart = {
  year: { stem: "戊", branch: "辰" },
  month: { stem: "壬", branch: "戌" },
  day: { stem: "癸", branch: "亥" },
  hour: { stem: "庚", branch: "申" },
  solarDate: { year: 1988, month: 11, day: 4 },
  uncertainPillars: [],
  warnings: [],
};
const good = "올해는 마음은 앞서가는데 몸이 못 따라와서 괜히 피곤해지기 쉬워(병임충). 그래도 하반기로 갈수록 숨통이 트이는 흐름이야. 이번 주엔 퇴근 후 부업 시간을 딱 한 시간만 줄여서 쉬는 틈을 만들어 봐.";

describe("질문 칩", () => {
  it("미리 정한 질문만 받는다", () => {
    expect(ASK_QUESTIONS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(ASK_QUESTIONS.map((q) => q.id)).size).toBe(ASK_QUESTIONS.length);
    expect(findQuestion("half")?.id).toBe("half");
    expect(findQuestion("아무말")).toBeNull();
    expect(findQuestion(5)).toBeNull();
  });
  it("답변 검사: 너무 짧거나 금지 표현이면 거른다", () => {
    expect(parseAnswer({ answer: good })).toBe(good);
    expect(parseAnswer({ answer: "짧아" })).toBeNull();
    expect(parseAnswer({ answer: good + " 이혼 이야기가 나올 수 있어." })).toBeNull();
    expect(parseAnswer(null)).toBeNull();
    expect(parseAnswer({ answer: 3 })).toBeNull();
  });
  it("프롬프트에 질문과 근거 안내가 들어간다", () => {
    const q = findQuestion("money")!;
    const msg = buildAskMessage(chart, "male", q, { 신강신약: "신강" });
    expect(msg).toContain(q.label);
    expect(msg).toContain("신강");
    expect(msg).toContain("癸");
  });
  it("정상 응답을 돌려주고, 실패하면 던진다", async () => {
    const ok = (async () => new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify({ answer: good }) }] }), { status: 200 })) as unknown as typeof fetch;
    expect(await askDori({ chart, gender: "male", question: findQuestion("half")!, core: null, apiKey: "k", fetchImpl: ok })).toBe(good);
    const bad = (async () => new Response("{}", { status: 400 })) as unknown as typeof fetch;
    let threw = false;
    try { await askDori({ chart, gender: "male", question: findQuestion("half")!, core: null, apiKey: "k", fetchImpl: bad }); } catch { threw = true; }
    expect(threw).toBe(true);
  });
});
