import { describe, expect, it } from "vitest";
import { buildCompatAnswer, elementNote } from "../compatAnswer";
import type { CompatPerson, CompatView } from "../types";

const el = (counts: number[]): CompatPerson["elements"] =>
  (["wood", "fire", "earth", "metal", "water"] as const).map((kind, i) => ({ kind, name: ["나무", "불", "땅", "쇠", "물"][i], count: counts[i] }));
const person = (counts: number[]) => ({ elements: el(counts) }) as unknown as CompatPerson;

describe("elementNote", () => {
  it("둘 다 0인 오행과 가장 차이 큰 오행을 짚어요", () => {
    const t = elementNote(person([1, 3, 3, 0, 1]), person([2, 1, 2, 0, 1]), "상대");
    expect(t).toContain("쇠는 둘 다 0");
    expect(t).toContain("불은 나 3, 상대 1");
  });
  it("차이가 없으면 닮았다고 말해요", () => {
    expect(elementNote(person([1, 1, 1, 1, 1]), person([1, 1, 1, 1, 1]), "상대")).toContain("닮아서");
  });
});

describe("buildCompatAnswer", () => {
  const base = { score: 70, headline: "h", closing: "c", points: [], me: {}, partner: {} } as unknown as CompatView;
  it("점수가 없으면 만들지 않아요", () => {
    expect(buildCompatAnswer(base)).toBeNull();
  });
  it("관계에 맞춰 가장 높은·낮은 항목과 팁을 담아요", () => {
    const a = buildCompatAnswer({
      ...base,
      relation: "결혼",
      scores: [{ label: "대화", score: 74, note: "" }, { label: "힘", score: 64, note: "" }, { label: "리듬", score: 67, note: "" }],
      tips: [{ emoji: "x", title: "결혼 사이에서 마음 쓰면 좋은 점", body: "작은 약속을 챙겨요." }],
    })!;
    expect(a.hasRelation).toBe(true);
    expect(a.body).toContain("오래 함께할 사이로 보면");
    expect(a.body).toContain("‘대화’(74점)");
    expect(a.body).toContain("‘힘’(64점)");
    expect(a.body).toContain("작은 약속을 챙겨요.");
  });
});
