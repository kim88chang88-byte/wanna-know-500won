import { describe, expect, it } from "vitest";
import { toPublicReading, type Reading } from "@/lib/ai/reading";
import { buildCardData, cardAltText, cardFileName, formatDate } from "../data";
import { fitText, wrapText } from "../text";

/** 글자 하나를 폭 10 으로 치는 가짜 측정기 (공백은 4) */
const m10 = (t: string) => Array.from(t).reduce((w, ch) => w + (ch === " " ? 4 : 10), 0);

describe("wrapText", () => {
  it("짧으면 한 줄", () => {
    expect(wrapText(m10, "안녕", 100)).toEqual(["안녕"]);
  });
  it("공백에서 먼저 끊는다", () => {
    expect(wrapText(m10, "오늘 이 마음 맞지", 60)).toEqual(["오늘 이 마음", "맞지"]);
  });
  it("공백이 없으면 글자 단위로 끊는다", () => {
    expect(wrapText(m10, "가나다라마바사아", 30)).toEqual(["가나다", "라마바", "사아"]);
  });
  it("줄바꿈 문자를 지킨다", () => {
    expect(wrapText(m10, "가\n나", 100)).toEqual(["가", "나"]);
  });
  it("줄 끝 공백은 폭에 포함하지 않는다", () => {
    expect(wrapText(m10, "가나 다라", 20)).toEqual(["가나", "다라"]);
  });
});

describe("fitText", () => {
  const measureAt = (size: number) => (t: string) => m10(t) * (size / 10);
  it("들어가면 가장 큰 글자로", () => {
    const r = fitText(measureAt, "안녕하세요", 200, 2, 12, 8);
    expect(r.fontSize).toBe(12);
    expect(r.truncated).toBe(false);
  });
  it("넘치면 글자를 줄여서 줄 수를 맞춘다", () => {
    const r = fitText(measureAt, "가".repeat(30), 100, 2, 10, 5);
    expect(r.lines.length <= 2).toBe(true);
    expect(r.fontSize < 10).toBe(true);
    expect(r.truncated).toBe(false);
  });
  it("그래도 넘치면 말줄임표로 자른다", () => {
    const r = fitText(measureAt, "가".repeat(200), 100, 2, 10, 8);
    expect(r.truncated).toBe(true);
    expect(r.lines.length).toBe(2);
    expect(r.lines[1].endsWith("…")).toBe(true);
    expect(measureAt(8)(r.lines[1]) <= 100).toBe(true);
  });
});

const reading: Reading = {
  keyword: "설렘 충전",
  total: { score: 4, summary: "마음이 한결 가벼워지는 하루야." },
  love: { score: 5, comment: "SECRET-LOVE" },
  money: { score: 3, comment: "SECRET-MONEY" },
  mind: { score: 4, comment: "SECRET-MIND" },
  kkotgeoji: "오늘 이 마음, 맞지?",
};

describe("buildCardData", () => {
  const data = buildCardData(toPublicReading(reading), "연애운", new Date(2026, 9, 16));
  it("카드에 필요한 값만 담는다", () => {
    expect(data.keyword).toBe("설렘 충전");
    expect(data.dateLabel).toBe("2026.10.16");
    expect(data.indicators).toEqual([
      { label: "연애운", score: 5 },
      { label: "금전운", score: 3 },
      { label: "마음운", score: 4 },
    ]);
  });
  it("잠긴 풀이 문장은 어디에도 들어가지 않는다", () => {
    const all = JSON.stringify(data) + cardAltText(data);
    expect(/SECRET/.test(all)).toBe(false);
  });
  it("읽기용 설명에 핵심 내용이 모두 있다", () => {
    const alt = cardAltText(data);
    for (const s of ["연애운 캡슐", "설렘 충전", "4점", "금전운 3점", "오늘 이 마음, 맞지?"]) expect(alt.includes(s)).toBe(true);
  });
});

describe("파일 이름/날짜", () => {
  it("월·일을 두 자리로 맞춘다", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("2026.01.05");
    expect(cardFileName(new Date(2026, 9, 16))).toBe("kkotgeoji-capsule-20261016.png");
  });
});
