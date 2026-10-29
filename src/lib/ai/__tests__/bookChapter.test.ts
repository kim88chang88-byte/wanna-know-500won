import { describe, expect, it } from "vitest";
import { CHAPTER_BATCHES, CHAPTER_SPECS, chapterName, isMoneyChapter, parseChapter, parseChapterWhy, chapterFacts } from "../bookChapter";
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
  it("모든 장은 마무리 소제목 두 개로 끝나고 소제목마다 역할이 있어요", () => {
    for (const [k, spec] of Object.entries(CHAPTER_SPECS)) {
      const heads = spec.parts.flatMap((p) => p.headings);
      expect(heads.slice(-2), k).toEqual(k === "concernTop" ? ["가장 먼저 해볼 일", "이제 차근차근 풀어 드릴게요"] : ["이렇게 해보세요", "한 줄 마무리"]);
      expect(spec.roles.map(([h]) => h), k).toEqual(heads);
    }
  });
  it("주제 장(재물·연애·직업·건강)은 10개 소제목이에요", () => {
    for (const k of ["topic:money", "topic:love", "topic:career", "topic:health"]) {
      expect(CHAPTER_SPECS[k].parts.flatMap((p) => p.headings)).toHaveLength(10);
    }
  });
  it("문장이 길어진 본문(1000자 안팎)도 받아요", () => {
    const body = ("꾸준히 쌓이는 수입과 **기준이 분명한 편**이에요. ").repeat(30).trim();
    expect(body.length).toBeLessThanOrEqual(1100);
    expect(parseChapter({ sections: [{ heading: "a", body }] }, ["a"])).not.toBeNull();
  });
});

describe("고민 결론 쪽과 합친 십성 장", () => {
  it("맨 앞 쪽은 첫 묶음의 첫 장이고, 십성은 한 장으로 합쳐졌어요", () => {
    expect(CHAPTER_BATCHES[0][0]).toBe("concernTop");
    expect(CHAPTER_SPECS["tengods:2"]).toBeUndefined();
    expect(CHAPTER_SPECS.tengods.parts.flatMap((p) => p.headings)).toHaveLength(8);
  });
  it("고민 자세한 답은 10개 소제목으로 길게 써요", () => {
    expect(CHAPTER_SPECS.concern.parts.flatMap((p) => p.headings)).toHaveLength(10);
  });
  it("'먼저 결론부터'는 조금 짧아도 받아요", () => {
    const body = "결론부터 말씀드리면 **지금은 서두르지 않는 쪽**이 맞아요. 일간이 단단해서 한번 정하면 오래 가는 구조라서요. 이번 달에는 후보를 두 개로 줄여 보세요. 그러면 선택이 훨씬 쉬워져요. 다음 달 초에는 두 후보를 직접 만나 보고, 마음이 더 편한 쪽을 고르면 후회가 적어요.";
    expect(body.length).toBeGreaterThan(120);
    expect(parseChapter({ sections: [{ heading: "먼저 결론부터", body }] }, ["먼저 결론부터"])).not.toBeNull();
  });
});

describe("형식 검사 이유와 부드러운 말 바꾸기", () => {
  const H1 = ["돈을 대하는 기본 자세"];
  const body = (t: string) => ({ sections: [{ heading: H1[0], body: (t + " ").repeat(14).trim() }] });
  it("'조심하세요'는 버리지 않고 '신경 써 보세요'로 바꿔 받아요", () => {
    const r = parseChapterWhy(body("지출을 조심하세요. **기준이 분명한 편**이에요."), H1);
    expect(r.sections?.[0].body).toContain("신경 써 보세요");
    expect(r.sections?.[0].body).not.toContain("조심하세요");
  });
  it("금지어는 이유와 함께 버려요", () => {
    const r = parseChapterWhy(body("이혼 이야기가 나올 수 있어요."), H1);
    expect(r.sections).toBeNull();
    expect(r.why).toContain("금지어(이혼)");
  });
  it("너무 짧거나 너무 길면 이유에 길이가 적혀요", () => {
    expect(parseChapterWhy({ sections: [{ heading: "a", body: "짧아요" }] }, H1).why).toMatch(/^짧음/);
    expect(parseChapterWhy({ sections: [{ heading: "a", body: "가".repeat(1600) }] }, H1).why).toMatch(/^김\(.*:1600\)/);
  });
  it("1500자 이하의 긴 본문은 받아요", () => {
    expect(parseChapterWhy({ sections: [{ heading: "a", body: "가나다라 ".repeat(260).trim() }] }, H1).sections).not.toBeNull();
  });
});

describe("19쪽이 1쪽 결론과 같은 방향으로 쓰이게 하는 근거", () => {
  const page = (key: string) => ({ no: 1, key, title: "t", subtitle: "s", lead: "l", sections: [{ heading: "h", body: "내용" }], tables: [] });
  it("concern 장에는 1쪽 결론이 들어가고 다른 장에는 안 들어가요", () => {
    const withIt = chapterFacts([page("concern")], page("concern"), "철수", null, "지금은 이직보다 남아서 준비하는 쪽이에요.");
    expect(withIt).toContain("1쪽에서 이미 전한 결론");
    expect(withIt).toContain("남아서 준비");
    expect(chapterFacts([page("lucky")], page("lucky"), "철수", null, "결론")).not.toContain("1쪽에서 이미 전한 결론");
  });
  it("올해가 몇 년인지 알려 줘서 엉뚱한 해를 올해라고 쓰지 않게 해요", () => {
    expect(chapterFacts([page("lucky")], page("lucky"), null, null)).toMatch(/올해는 20\d\d년/);
  });
});
