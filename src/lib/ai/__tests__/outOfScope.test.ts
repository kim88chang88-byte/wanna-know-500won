import { describe, expect, it } from "vitest";
import { apologyFirst, mapSearchUrl, unableReply } from "../outOfScope";
import { parseChatReply } from "../chat";

describe("답할 수 없는 질문 미리 거르기", () => {
  it("가게 이름을 물으면 사과와 지도 검색 링크", () => {
    const r = unableReply("춘천에서 가볼 만한 조용한 카페도 있어?");
    expect(r?.answer).toContain("미안");
    expect(r?.answer).toContain("횟수에서 빼지 않았어");
    expect(r?.links[0].label).toContain("춘천 조용한 카페");
    expect(r?.links[0].url).toBe(mapSearchUrl("춘천 조용한 카페"));
  });
  it("실시간 정보와 투자 종목", () => {
    expect(unableReply("강릉 안목해변 영업시간 알려줘")?.answer).toContain("실시간 정보");
    expect(unableReply("내일 날씨 어때?")?.answer).toContain("미안");
    expect(unableReply("비트코인 사도 될까?")?.answer).toContain("투자");
  });
  it("평소 질문은 거르지 않는다", () => {
    for (const q of ["카페 가서 책 읽는 게 좋을까?", "오늘 조심할 게 뭐야?", "주말에 혼자 조용히 머물기 좋은 다른 근교도 추천해 줘", "여행지 추천해줘", "속초 2박 3일 코스 짜 줘", "돈 걱정이 커"]) {
      expect(unableReply(q)).toBeNull();
    }
  });
});

describe("AI 가 못 답했다고 표시한 답", () => {
  it("unable 표시를 읽고, 사과가 앞에 오게 다듬는다", () => {
    const r = parseChatReply({ answer: "미안, 카페 이름은 정확하게 알려 줄 수가 없어. 대신 분위기는 같이 골라 줄 수 있어.", followups: ["a 질문이야", "b 질문이야", "c 질문이야"], choices: [], unable: true, visual: { kind: "none", title: "", items: [] } });
    expect(r?.unable).toBe(true);
    expect(parseChatReply({ answer: "오늘은 편안하게 걷는 날이야, 천천히 해 봐.", followups: [], choices: [], unable: false, visual: null })?.unable).toBe(false);
    expect(apologyFirst("가게 이름은 몰라. 대신 동네를 알려 줄게.")).toMatch(/^미안/);
    expect(apologyFirst("미안, 몰라.")).toBe("미안, 몰라.");
  });
});
