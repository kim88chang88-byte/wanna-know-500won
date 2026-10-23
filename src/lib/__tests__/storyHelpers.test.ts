import { describe, expect, it } from "vitest";
import { birthSummary, firstSentence, iyeyo, toParagraphs } from "@/lib/storyHelpers";

describe("StoryReport helpers", () => {
  it("firstSentence: 첫 문장만 돌려줘요", () => {
    expect(firstSentence("차분히 가면 돼요. 서두르지 않아도 괜찮아요.")).toBe("차분히 가면 돼요.");
    expect(firstSentence("마침표 없는 글")).toBe("마침표 없는 글");
  });
  it("birthSummary: 시간 모름/음력 표기", () => {
    expect(birthSummary({ year: 1988, month: 12, day: 29, calendar: "solar", gender: "male" } as never)).toBe("1988.12.29 (양력) 시간 모름 · 남성");
    expect(birthSummary({ year: 1990, month: 1, day: 5, hour: 7, minute: 5, calendar: "lunar", isLeapMonth: true, gender: "female" } as never)).toBe("1990.01.05 (음력 윤달) 07:05 · 여성");
  });
});

describe("toParagraphs / iyeyo", () => {
  it("빈 줄로 온 글은 그대로 문단이 된다", () => {
    expect(toParagraphs("첫째 문단이에요.\n\n둘째 문단이에요.").length).toBe(2);
  });
  it("한 덩어리로 긴 글은 문장 묶음으로 끊는다", () => {
    const one = "오늘은 포근한 날이야. ".repeat(12).trim();
    const ps = toParagraphs(one);
    expect(ps.length > 1).toBe(true);
    expect(ps.join(" ")).toBe(one);
  });
  it("짧은 글은 한 문단", () => {
    expect(toParagraphs("짧은 글이야.").length).toBe(1);
  });
  it("받침에 따라 이에요/예요", () => {
    expect(iyeyo("서쪽")).toBe("이에요");
    expect(iyeyo("화이트")).toBe("예요");
  });
});
