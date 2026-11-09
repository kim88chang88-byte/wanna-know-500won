import { describe, expect, it } from "vitest";
import { buildShareText } from "../shareText";

const report = {
  compat: null,
  concern: { text: "x", answers: [{ id: "a", emoji: "💌", title: "고민 답", body: "천천히 해 봐요." }] },
  book: [
    {
      no: 1, key: "overview", title: "한눈에 보기", subtitle: "", lead: "한 줄", sections: [{ heading: "열린 글", body: "보이는 풀이예요." }, { heading: "잠긴 글", body: "도리운세", locked: true }], tables: [],
    },
  ],
  viewerName: "은혁",
} as never;
const reading = { keyword: "배움과 공감", total: { summary: "좋은 해예요." }, kkotgeoji: "차분히 가요", story: "이야기", folds: { a: "접힌 글" }, heads: { a: "첫째" } };
const base = { name: "은혁", withName: true, topic: "2027 신년운", url: "https://x.app/?ref=AB12CD34" };

describe("buildShareText", () => {
  it("전체: 풀이 글과 링크가 들어가고 잠긴 글은 빠져요", () => {
    const t = buildShareText(report, reading, { ...base, mode: "full" });
    expect(t).toContain("은혁님의 2027 신년운 풀이");
    expect(t).toContain("접힌 글");
    expect(t).toContain("보이는 풀이예요.");
    expect(t).not.toContain("도리운세");
    expect(t).toContain("고민 답");
    expect(t.endsWith("https://x.app/?ref=AB12CD34")).toBe(true);
  });
  it("핵심만: 짧고 접힌 글·장 풀이는 없어요", () => {
    const t = buildShareText(report, reading, { ...base, mode: "short" });
    expect(t).toContain("좋은 해예요.");
    expect(t).not.toContain("접힌 글");
    expect(t).not.toContain("보이는 풀이예요.");
    expect(t).toContain("https://x.app/?ref=AB12CD34");
  });
  it("이름 끄기: 이름 자리가 '친구'로 바뀌어요", () => {
    const r2 = { ...(report as object), concern: { text: "x", answers: [{ id: "a", emoji: "💌", title: "t", body: "은혁님은 괜찮아요." }] } } as never;
    const t = buildShareText(r2, reading, { ...base, mode: "full", withName: false });
    expect(t).not.toContain("은혁");
    expect(t).toContain("친구는 괜찮아요");
  });
});
