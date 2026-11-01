import { describe, expect, it } from "vitest";
import { applyCompatAi, buildCorePrompt, buildItemsPrompt, parseCore, parseItems, rewritableItems } from "../compatStory";
import type { CompatView } from "@/lib/premium/types";

const long = (s: string) => s.repeat(40);
const base = {
  score: 70,
  headline: "h",
  closing: "c",
  relation: "결혼",
  me: { label: "나", dayPillar: "戊午", dayReading: "무오", elements: [{ name: "나무", count: 1, kind: "wood" }], hourUnknown: false },
  partner: { label: "상대", dayPillar: "壬寅", dayReading: "임인", elements: [{ name: "나무", count: 2, kind: "wood" }], hourUnknown: true },
  points: [{ title: "a", body: "원래 a", tone: "good" }, { title: "b", body: "원래 b", tone: "tip" }],
  timing: [{ title: "2026", body: "원래 t" }],
  tips: [{ emoji: "x", title: "k", body: "팁" }],
} as unknown as CompatView;

describe("compat ai", () => {
  it("다시 쓸 항목은 풀이·흐름·상대 성향·도리의 팁이에요", () => {
    expect(rewritableItems(base).map((x) => x.id)).toEqual(["p0", "p1", "t0", "k0"]);
    expect(rewritableItems({ ...base, partnerTrait: { title: "t", body: "b" } }).map((x) => x.id)).toContain("r0");
  });

  it("프롬프트에 이름·관계·고민을 데이터로 담고, 풀이 입력은 고른 항목만 담아요", () => {
    const u = buildCorePrompt(base, { tags: [], text: "결혼해도 될까요" }, { me: "은혁", partner: "민지" });
    expect(u).toContain("은혁");
    expect(u).toContain("민지");
    expect(u).toContain("결혼해도 될까요");
    expect(u).toContain("태어난 시간을 몰라");
    const it = buildItemsPrompt(base, null, {}, ["p1"]);
    expect(it).toContain("원래 b");
    expect(it).not.toContain("원래 a");
  });

  it("핵심 글은 통과한 부분만 쓰고, 답과 요약이 모두 없으면 다시 시도하게 null 이에요", () => {
    const core = parseCore({ answer: long("두 사람은 대화가 잘 통해. "), summary: "짧음", last: "서로를 아끼는 마음이 이미 큰 힘이야. 오늘도 안부를 나눠 봐.", questions: ["서로 고마웠던 순간은 언제였어요?", "요즘 가장 편한 시간은 언제예요?", "바라는 작은 한 가지가 있어요?"], action: "오늘 고마웠던 일을 한 가지만 말로 전해 봐." });
    expect(core?.answer).toBeTruthy();
    expect(core?.summary).toBeNull();
    expect(core?.questions).toHaveLength(3);
    expect(parseCore({ answer: "짧음", summary: "짧음" })).toBeNull();
    expect(parseCore(null)).toBeNull();
  });

  it("풀이 글은 분량이 모자라거나 없는 항목은 버려요", () => {
    const items = parseItems(
      { items: [{ id: "p0", head: "둘이 함께 움직일 때 가장 빛나는 사이네요", body: long("함께 밥 먹을 때 편안해. ") }, { id: "zz", head: "없는 항목이에요 정말로요", body: long("없는 항목이야. ") }, { id: "p1", head: "짧은 글", body: "짧음" }] },
      ["p0", "p1", "t0"],
    );
    expect(items?.body.size).toBe(1);
    expect(items?.head.get("p0")).toContain("빛나는");
    expect(parseItems({ items: [] }, ["p0"])).toBeNull();
  });

  it("검사를 통과한 부분만 끼워 넣고 나머지는 원래 문장을 둬요", () => {
    const items = parseItems({ items: [{ id: "p0", head: "둘이 함께 움직일 때 가장 빛나는 사이네요", body: long("함께 밥 먹을 때 편안해. ") }] }, ["p0", "p1", "t0"]);
    const out = applyCompatAi(base, parseCore({ answer: long("두 사람은 대화가 잘 통해. "), summary: "" }), items);
    expect(out.points[0].body).not.toBe("원래 a");
    expect(out.points[0].title).toContain("빛나는");
    expect(out.points[1].body).toBe("원래 b");
    expect(out.points[1].title).toBe("b");
    expect(out.timing![0].body).toBe("원래 t");
    expect(out.ai?.answer).toBeTruthy();
    expect(out.ai?.summary).toBeUndefined();
    expect(out.tips![0].body).toBe("팁");
  });

  it("도리의 팁도 AI 글로 바뀌고 제목은 그대로예요", () => {
    const items = parseItems({ items: [{ id: "k0", head: "싸운 뒤에도 먼저 손 내밀기 쉬운 사이네요", body: long("싸운 날 밤엔 말을 꺼내기가 어렵지. ") }] }, ["p0", "p1", "t0", "k0"]);
    const out = applyCompatAi(base, null, items);
    expect(out.tips![0].title).toBe("k");
    expect(out.tips![0].body).not.toBe("팁");
  });

  it("금지 표현이 있으면 버려요", () => {
    expect(parseCore({ answer: long("이혼 이야기는 하지 않아. "), summary: long("이혼 이야기는 하지 않아. ") })).toBeNull();
  });

  it("아무것도 못 쓰면 원래 결과를 그대로 돌려줘요", () => {
    expect(applyCompatAi(base, null, null)).toBe(base);
  });
});
