import { describe, expect, it } from "vitest";
import { cleanFollowups, cleanVisual, cleanHistory, CRISIS_ANSWER, earlierQuestions, isCrisis, parseChatAnswer, parseChatReply, polishChatAnswer } from "../chat";
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

  it("그림 카드: 종류·개수가 맞으면 쓰고, 어긋나면 카드만 빼요", () => {
    const it = (label: string, icon = "", sub = "", best = false) => ({ icon, label, sub, best });
    const note = cleanVisual({ kind: "note", title: "오늘의 노트", items: [it("마음에 남은 말 하나"), it("그때 내 기분 한 줄")] });
    expect(note?.kind).toBe("note");
    expect(note?.items[0].icon).toBe("");
    expect(cleanVisual({ kind: "none", title: "", items: [] })).toBeNull();
    expect(cleanVisual({ kind: "note", title: "노트", items: [it("한 줄")] })).toBeNull();
    expect(cleanVisual({ kind: "lucky", title: "소품", items: [it("물 한 잔", "🫧", "맑은 물"), it("흰색 소품", "⚪", "쇠 기운"), it("작은 화분", "🪴", "")] })).toBeNull();
    expect(cleanVisual({ kind: "lucky", title: "소품", items: [it("물 한 잔", "🫧", "맑은 물"), it("흰색 소품", "⚪", "쇠 기운"), it("작은 화분", "🪴", "나무 기운")] })?.items.length).toBe(3);
    expect(cleanVisual({ kind: "checklist", title: "약속", items: [it("이혼 준비하기"), it("물 마시기")] })).toBeNull();
  });

  it("시간표는 추천 한 곳만 남겨요", () => {
    const t = cleanVisual({ kind: "timeline", title: "시간표", items: [{ icon: "☀️", label: "아침", sub: "한 줄", best: true }, { icon: "🌤️", label: "오후", sub: "집중", best: true }, { icon: "🌙", label: "저녁 9시", sub: "노트", best: false }] });
    expect(t?.items.filter((i) => i.best).length).toBe(1);
  });

  it("답과 함께 카드가 와도 통과해요", () => {
    const r = parseChatReply({ answer: long("연락이 뜸해지면 괜히 마음이 쓰이지. "), visual: { kind: "checklist", title: "약속", items: [{ icon: "", label: "물 마시기", sub: "", best: false }, { icon: "", label: "한 줄 쓰기", sub: "", best: false }] } });
    expect(r?.visual?.kind).toBe("checklist");
    expect(parseChatReply({ answer: long("연락이 뜸해지면 괜히 마음이 쓰이지. ") })?.visual).toBeNull();
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

describe("polishChatAnswer", () => {
  const body = "오늘은 무리하지 말고 천천히 걸어 보는 게 좋아. 아까 말한 것처럼 물 기운을 채워 주면 한결 편해질 거야.";
  it("앞선 답에서 이미 이름을 불렀으면 맨 앞 호칭을 뗀다", () => {
    const h = [
      { role: "user" as const, text: "요즘 어때?" },
      { role: "dori" as const, text: "은혁님, 요즘 흐름이 좋아." },
      { role: "user" as const, text: "또 물어볼게" },
    ];
    expect(polishChatAnswer(`은혁님, ${body}`, h, "은혁")).toBe(body);
  });
  it("첫 답에서는 이름을 그대로 둔다", () => {
    const h = [{ role: "user" as const, text: "처음 질문" }];
    expect(polishChatAnswer(`은혁님, ${body}`, h, "은혁")).toBe(`은혁님, ${body}`);
  });
  it("몸 증상 질문에는 전문가 안내 한 줄을 붙인다", () => {
    const h = [{ role: "user" as const, text: "다리가 자주 저려요" }];
    expect(polishChatAnswer(body, h, null)).toContain("전문가");
  });
  it("이미 전문가 안내가 있으면 중복해서 붙이지 않는다", () => {
    const h = [{ role: "user" as const, text: "다리가 자주 저려요" }];
    const a = `${body} 계속되면 전문가와 이야기해 봐.`;
    expect(polishChatAnswer(a, h, null)).toBe(a);
  });
  it("증상이 아닌 질문엔 아무것도 붙이지 않는다", () => {
    const h = [{ role: "user" as const, text: "이직 흐름이 궁금해" }];
    expect(polishChatAnswer(body, h, null)).toBe(body);
  });
});
