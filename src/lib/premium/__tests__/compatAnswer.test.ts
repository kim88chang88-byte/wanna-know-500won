import { describe, expect, it } from "vitest";
import { buildCompatAnswer, buildShareSummary, buildTogether, elementNote, plainPointTitle } from "../compatAnswer";
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

describe("buildTogether / buildShareSummary", () => {
  const c = {
    score: 70,
    headline: "서로 맞춰 가며 더 빛나는 사이예요",
    relation: "연인",
    scores: [{ label: "대화와 소통", score: 74, note: "" }, { label: "서로에게 주는 힘", score: 64, note: "" }],
  } as unknown as CompatView;

  it("질문은 항상 3개고, 가장 낮은 항목에 맞는 질문·행동이 들어가요", () => {
    const t = buildTogether(c);
    expect(t.questions).toHaveLength(3);
    expect(t.questions[0]).toContain("힘이 돼");
    expect(t.action).toContain("조언 대신");
  });

  it("관계도 점수도 없으면 기본 문구로 채워요", () => {
    const t = buildTogether({ score: 60, headline: "h" } as unknown as CompatView);
    expect(t.questions).toHaveLength(3);
    expect(t.action.length).toBeGreaterThan(10);
  });

  it("공유 글에는 점수·질문·주소만 담고 생년월일 같은 정보는 없어요", () => {
    const t = buildTogether(c);
    const text = buildShareSummary(c, { me: "은혁", partner: null }, t, "https://x.test");
    expect(text).toContain("은혁님과 너의 궁합 70점");
    expect(text).toContain("1. ");
    expect(text).toContain("https://x.test");
    expect(text).not.toMatch(/19\d\d|20\d\d\./);
  });
});

describe("plainPointTitle", () => {
  it("용어 제목을 일상 말로 바꾸고, 모르는 제목은 그대로 둬요", () => {
    expect(plainPointTitle("내가 보는 상대 · 편재의 기운")).toBe("내가 보는 상대 · 새로운 경험을 함께하는 느낌");
    expect(plainPointTitle("연지 · 띠 궁합 · 충")).toBe("띠 자리(주변·가족): 서로 부딪혀");
    expect(plainPointTitle("일지 · 마음의 거리 · 합")).toBe("마음이 가장 가까운 자리: 서로 끌어당겨");
    expect(plainPointTitle("오행 보완 · 금")).toBe("빈 쇠 기운을 채워 줘");
    expect(plainPointTitle("일간의 합 · 끌림")).toBe("처음부터 마음이 끌리는 사이");
    expect(plainPointTitle("처음 보는 제목")).toBe("처음 보는 제목");
  });
});
