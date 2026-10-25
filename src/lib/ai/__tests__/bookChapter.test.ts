import { describe, expect, it } from "vitest";
import { chapterName, isMoneyChapter, parseChapter } from "../bookChapter";
import type { BookPage } from "@/lib/premium/types";

const H = ["돈을 대하는 기본 자세", "돈이 들어오는 길", "새기 쉬운 곳"];
const long = (t: string) => (t + " ").repeat(14).trim();
const ok = (b: string) => ({ sections: H.map((heading) => ({ heading, body: b })) });

describe("parseChapter", () => {
  it("정상 응답은 지정한 제목 순서대로 돌려줘요", () => {
    const r = parseChapter(ok(long("꾸준히 쌓이는 수입과 **기준이 분명한 편**이에요.")), H);
    expect(r?.map((s) => s.heading)).toEqual(H);
  });
  it("굵은 표시가 짝이 안 맞으면 버려요", () => {
    expect(parseChapter(ok(long("**기준이 분명한 편이에요.")), H)).toBeNull();
  });
  it("금지 표현이나 자리표시가 있으면 버려요", () => {
    expect(parseChapter(ok(long("이혼 이야기가 나올 수 있어요.")), H)).toBeNull();
    expect(parseChapter(ok(long("○○님은 꾸준한 편이에요.")), H)).toBeNull();
  });
  it("너무 짧거나 소제목이 모자라면 버려요", () => {
    expect(parseChapter(ok("짧아요."), H)).toBeNull();
    expect(parseChapter({ sections: [] }, H)).toBeNull();
  });
  it("문장 전체가 굵으면 버려요", () => {
    expect(parseChapter(ok("**" + long("꾸준히 쌓이는 수입과 기준이 분명한 편이에요.") + "**"), H)).toBeNull();
  });
});

describe("helpers", () => {
  it("이름은 글자·숫자·공백만 10자까지", () => {
    expect(chapterName("장은혁<script>")).toBe("장은혁script");
    expect(chapterName(null)).toBeNull();
  });
  it("재물운 심층 분석 쪽만 다시 써요", () => {
    const base = { no: 7, key: "topic", title: "재물운 심층 분석", subtitle: "", lead: "", sections: [], tables: [] } as BookPage;
    expect(isMoneyChapter(base)).toBe(true);
    expect(isMoneyChapter({ ...base, title: "연애운 심층 분석" })).toBe(false);
  });
});
