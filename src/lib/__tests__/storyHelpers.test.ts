import { describe, expect, it } from "vitest";
import { birthSummary, firstSentence } from "@/lib/storyHelpers";

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
