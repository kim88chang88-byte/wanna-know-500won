import { describe, expect, it } from "vitest";
import { containsForbidden, normalizeTopic, parseReading, READING_SCHEMA, toPublicReading } from "../reading";

const good = {
  keyword: "설렘 충전",
  total: { score: 4, summary: "마음이 한결 가벼워지는 하루야." },
  love: { score: 5, comment: "먼저 연락이 올지도 몰라." },
  money: { score: 3, comment: "작은 지출만 챙기면 든든해." },
  mind: { score: 4, comment: "오늘은 쉬어가도 괜찮아." },
  kkotgeoji: "오늘 이 마음, 맞지? 천천히 가도 괜찮아 🌸",
};

describe("normalizeTopic", () => {
  it("화면 문구에서 주제를 찾는다", () => {
    expect(normalizeTopic("연애운 슬롯")).toBe("love");
    expect(normalizeTopic("재물운")).toBe("money");
    expect(normalizeTopic("성공운 자판기")).toBe("success");
    expect(normalizeTopic("우리 둘의 궁합 리포트")).toBe("general");
    expect(normalizeTopic(undefined)).toBe("general");
    expect(normalizeTopic(123)).toBe("general");
  });
});

describe("parseReading", () => {
  it("올바른 값은 통과한다", () => {
    expect(parseReading(good)?.keyword).toBe("설렘 충전");
  });

  it("점수가 범위 밖이거나 정수가 아니면 거절", () => {
    expect(parseReading({ ...good, total: { ...good.total, score: 6 } })).toBeNull();
    expect(parseReading({ ...good, love: { ...good.love, score: 0 } })).toBeNull();
    expect(parseReading({ ...good, money: { ...good.money, score: 3.5 } })).toBeNull();
    expect(parseReading({ ...good, mind: { ...good.mind, score: "4" } })).toBeNull();
  });

  it("빠진 필드, 빈 문자열, 너무 긴 문장은 거절", () => {
    const { kkotgeoji: _omit, ...noKk } = good;
    expect(parseReading(noKk)).toBeNull();
    expect(parseReading({ ...good, keyword: "  " })).toBeNull();
    expect(parseReading({ ...good, kkotgeoji: "가".repeat(301) })).toBeNull();
    expect(parseReading(null)).toBeNull();
    expect(parseReading("text")).toBeNull();
    expect(parseReading({ ...good, total: null })).toBeNull();
  });

  it("겁주는 표현이 섞이면 거절", () => {
    expect(parseReading({ ...good, kkotgeoji: "이번 달은 이혼수가 있으니 조심하세요" })).toBeNull();
    expect(parseReading({ ...good, money: { score: 2, comment: "파산할 수 있어" } })).toBeNull();
    expect(containsForbidden("오늘은 설레는 날")).toBeNull();
  });

  it("네 점수가 모두 같으면 거절하고, 하나라도 다르면 통과", () => {
    const flat = { ...good, total: { ...good.total, score: 4 }, love: { ...good.love, score: 4 }, money: { ...good.money, score: 4 }, mind: { ...good.mind, score: 4 } };
    expect(parseReading(flat)).toBeNull();
    expect(parseReading({ ...flat, money: { ...flat.money, score: 3 } })).not.toBeNull();
  });

  it("앞뒤 공백은 잘라서 돌려준다", () => {
    expect(parseReading({ ...good, keyword: "  설렘 충전  " })?.keyword).toBe("설렘 충전");
  });
});

describe("READING_SCHEMA (Claude 구조화 출력 제약)", () => {
  const text = JSON.stringify(READING_SCHEMA);
  it("지원하지 않는 키워드를 쓰지 않는다", () => {
    for (const k of ["minimum", "maximum", "minLength", "maxLength", "multipleOf"]) expect(text.includes(`"${k}"`)).toBe(false);
  });
  it("모든 객체에 additionalProperties:false", () => {
    const objects = text.match(/"type":"object"/g)?.length ?? 0;
    const closed = text.match(/"additionalProperties":false/g)?.length ?? 0;
    expect(objects).toBe(closed);
  });
});

describe("toPublicReading (무료 공개 범위)", () => {
  const r = parseReading(good)!;
  const pub = toPublicReading(r, "free");

  it("키워드·총운·도리 한마디와 지표 점수는 보여준다", () => {
    expect(pub.keyword).toBe("설렘 충전");
    expect(pub.total.score).toBe(4);
    expect(pub.kkotgeoji).toBe(good.kkotgeoji);
    expect(pub.indicators.map((i) => [i.key, i.score])).toEqual([["love", 5], ["money", 3], ["mind", 4]]);
  });

  it("세 지표의 풀이 문장은 응답에 아예 들어 있지 않다 (블러가 아니라 서버에서 제거)", () => {
    expect(pub.indicators.every((i) => i.locked && i.comment === null)).toBe(true);
    const json = JSON.stringify(pub);
    for (const secret of [good.love.comment, good.money.comment, good.mind.comment]) expect(json.includes(secret)).toBe(false);
  });
});

describe("뻔한 풀이 걸러내기", () => {
  it("도리 한마디가 너무 짧거나 뻔한 말뿐이면 null", () => {
    expect(parseReading({ ...good, kkotgeoji: "힘내!" })).toBeNull();
    expect(parseReading({ ...good, kkotgeoji: "오늘도 좋은 하루 될 거야, 파이팅 해보자!" })).toBeNull();
  });
});

describe("도리가 본 이유(reason)", () => {
  const reason = "올해 흐름이 월주 자리와 부딪혀서 일터 쪽 마음이 분주해지기 쉬워(병임충).";
  it("있으면 담아서 공개 응답에도 내려보낸다", () => {
    const r = parseReading({ ...good, reason });
    expect(r?.reason).toBe(reason);
    expect(toPublicReading(r!).reason).toBe(reason);
  });
  it("비어 있거나 짧으면 reason 만 빼고 통과한다", () => {
    expect(parseReading({ ...good, reason: "" })?.reason).toBeUndefined();
    expect(parseReading({ ...good, reason: "짧음" })?.reason).toBeUndefined();
  });
  it("금지 표현이 섞이면 전체를 거른다", () => {
    expect(parseReading({ ...good, reason: "올해는 이혼 이야기가 나오기 쉬운 흐름이라 조심하세요 그렇대" })).toBeNull();
  });
});
