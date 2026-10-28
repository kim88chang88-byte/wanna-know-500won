import { describe, expect, it } from "vitest";
import { birthSummary, firstSentence, iyeyo, normalizeBold, splitBold, stripBold, stripSummaryLead, stripTitleEcho, tidyFold, toParagraphs, trimToLastSentence } from "@/lib/storyHelpers";

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

describe("제목 따라 쓰기·끊긴 문장 다듬기", () => {
  it("맨 앞 제목 반복을 뗀다", () => {
    expect(tidyFold("lack", "그렇지만 이건 조금 아쉬워요. 토 기운이 강하고 쇠와 물이 적다 보니 새 방식을 시도하기보다 익숙한 길만 가려는 마음이 생기기 쉬워.")).toBe("토 기운이 강하고 쇠와 물이 적다 보니 새 방식을 시도하기보다 익숙한 길만 가려는 마음이 생기기 쉬워.");
    expect(stripTitleEcho("이렇게 개선해 보아요. 첫째, 오늘 하루 안에 자료 하나를 골라 두자.", "이렇게 개선해 보아요")).toBe("첫째, 오늘 하루 안에 자료 하나를 골라 두자.");
    expect(stripTitleEcho("이렇게 개선해보아요. 첫째, 오늘 하루 안에 자료 하나를 골라 두자.", "이렇게 개선해 보아요")).toBe("첫째, 오늘 하루 안에 자료 하나를 골라 두자.");
  });
  it("제목이 본문 중간에 나오면 건드리지 않는다", () => {
    const t = "오늘은 쉬어도 좋아. 그렇지만 이건 조금 아쉬워요 라는 말은 아니야.";
    expect(tidyFold("lack", t)).toBe(t);
  });
  it("요약 말머리를 뗀다", () => {
    expect(stripSummaryLead("요약하자면, 너는 흙의 기운이 두툼하게 깔린 사람이야.")).toBe("너는 흙의 기운이 두툼하게 깔린 사람이야.");
  });
  it("끊긴 마지막 문장은 버린다", () => {
    expect(trimToLastSentence("묵직한 사람이야. 그래서 친구들 사이에서도")).toBe("묵직한 사람이야.");
    expect(trimToLastSentence("응원할게 ✨")).toBe("응원할게 ✨");
    expect(trimToLastSentence("응원해!")).toBe("응원해!");
  });
});

describe("굵은 글씨 강조", () => {
  it("**로 감싼 구절을 굵게 쪼갠다", () => {
    expect(splitBold("오늘은 **작은 약속**이 중요해.")).toEqual([
      { text: "오늘은 ", bold: false },
      { text: "작은 약속", bold: true },
      { text: "이 중요해.", bold: false },
    ]);
  });
  it("짝이 안 맞거나 문장 통째로 감싸면 강조를 뺀다", () => {
    expect(normalizeBold("앞 **뒤")).toBe("앞 뒤");
    expect(normalizeBold(`**${"가".repeat(50)}**`)).toBe("가".repeat(50));
  });
  it("강조가 없는 옛 글은 오행 기운 같은 핵심 말만 굵게 한다", () => {
    expect(splitBold("물 기운이 적어요.").filter((x) => x.bold).map((x) => x.text)).toEqual(["물 기운"]);
  });
  it("끝이 ** 로 닫혀도 마지막 문장으로 인정한다", () => {
    expect(trimToLastSentence("좋아. **꼭 기억해!**")).toBe("좋아. **꼭 기억해!**");
  });
  it("stripBold 는 표시만 걷어 낸다", () => {
    expect(stripBold("**핵심**이야")).toBe("핵심이야");
  });
});
