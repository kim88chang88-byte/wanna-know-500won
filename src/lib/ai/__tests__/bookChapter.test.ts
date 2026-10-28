import { describe, expect, it } from "vitest";
import { CHAPTER_BATCHES, CHAPTER_SPECS, chapterName, isMoneyChapter, parseChapter } from "../bookChapter";
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

describe("장 구성", () => {
  it("모든 AI 장은 네 묶음 중 정확히 한 곳에만 들어 있어요", () => {
    const all = CHAPTER_BATCHES.flat();
    expect(new Set(all).size).toBe(all.length);
    expect(all.sort()).toEqual(Object.keys(CHAPTER_SPECS).sort());
  });
  it("묶음 하나는 호출이 너무 많아지지 않게 소제목 40개 이내예요", () => {
    for (const b of CHAPTER_BATCHES) {
      const heads = b.reduce((n, k) => n + CHAPTER_SPECS[k].parts.flatMap((p) => p.headings).length, 0);
      expect(heads).toBeLessThanOrEqual(40);
    }
  });
  it("모든 장은 '이렇게 해보세요', '한 줄 마무리'로 끝나고 소제목마다 역할이 있어요", () => {
    for (const [k, spec] of Object.entries(CHAPTER_SPECS)) {
      const heads = spec.parts.flatMap((p) => p.headings);
      expect(heads.slice(-2), k).toEqual(["이렇게 해보세요", "한 줄 마무리"]);
      expect(spec.roles.map(([h]) => h), k).toEqual(heads);
    }
  });
  it("주제 장(재물·연애·직업·건강)은 8개 소제목이에요", () => {
    for (const k of ["topic:money", "topic:love", "topic:career", "topic:health"]) {
      expect(CHAPTER_SPECS[k].parts.flatMap((p) => p.headings)).toHaveLength(8);
    }
  });
  it("문장이 길어진 본문(1000자 안팎)도 받아요", () => {
    const body = ("꾸준히 쌓이는 수입과 **기준이 분명한 편**이에요. ").repeat(30).trim();
    expect(body.length).toBeLessThanOrEqual(1100);
    expect(parseChapter({ sections: [{ heading: "a", body }] }, ["a"])).not.toBeNull();
  });
});
