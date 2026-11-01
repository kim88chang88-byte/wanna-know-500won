import { describe, expect, it } from "vitest";
import { applyCompatAi, buildCompatPrompt, parseCompatAi, rewritableItems } from "../compatStory";
import type { CompatView } from "@/lib/premium/types";

const long = (s: string) => s.repeat(8);
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
  it("다시 쓸 항목은 풀이와 흐름만이고 팁은 건드리지 않아요", () => {
    expect(rewritableItems(base).map((x) => x.id)).toEqual(["p0", "p1", "t0"]);
    expect(rewritableItems({ ...base, partnerTrait: { title: "t", body: "b" } }).map((x) => x.id)).toContain("r0");
  });

  it("프롬프트에 이름·관계·고민을 데이터로 담아요", () => {
    const u = buildCompatPrompt(base, { tags: [], text: "결혼해도 될까요" }, { me: "은혁", partner: "민지" });
    expect(u).toContain("은혁");
    expect(u).toContain("민지");
    expect(u).toContain("결혼해도 될까요");
    expect(u).toContain("태어난 시간을 몰라");
  });

  it("검사를 통과한 부분만 끼워 넣고 나머지는 원래 문장을 둬요", () => {
    const r = parseCompatAi(
      { answer: long("두 사람은 대화가 잘 통해요. "), summary: "짧음", last: "서로를 아끼는 마음이 이미 큰 힘이에요. 오늘도 따뜻하게 안부를 나눠 보세요.", items: [{ id: "p0", body: long("함께 밥 먹을 때 편안해요. ") }, { id: "zz", body: long("없는 항목이에요. ") }, { id: "p1", body: "짧음" }] },
      ["p0", "p1", "t0"],
    );
    expect(r.answer).not.toBeNull();
    expect(r.summary).toBeNull();
    expect(r.items.size).toBe(1);
    const out = applyCompatAi(base, r);
    expect(out.points[0].body).not.toBe("원래 a");
    expect(out.points[1].body).toBe("원래 b");
    expect(out.timing![0].body).toBe("원래 t");
    expect(out.ai?.answer).toBeTruthy();
    expect(out.ai?.summary).toBeUndefined();
    expect(out.tips).toBe(base.tips);
  });

  it("금지 표현이 있으면 버려요", () => {
    const r = parseCompatAi({ answer: long("이혼 이야기는 하지 않아요. "), summary: "", last: "", items: [] }, []);
    expect(r.answer).toBeNull();
  });

  it("아무것도 못 쓰면 원래 결과를 그대로 돌려줘요", () => {
    expect(applyCompatAi(base, parseCompatAi(null, []))).toBe(base);
  });
});
