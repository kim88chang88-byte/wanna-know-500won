import { describe, expect, it } from "vitest";
import { fixPossessive, repairName, scrubDeep, scrubExampleName } from "../nameRepair";

describe("이름 오타 바로잡기", () => {
  it("한 글자만 다른 이름을 되돌려요", () => {
    expect(repairName("장능혁님은 든든해요. 장혜혁님, 상은혁님도요.", "장은혁")).toBe("장은혁님은 든든해요. 장은혁님, 장은혁님도요.");
  });
  it("성+이름 자리표시를 되돌려요", () => {
    expect(repairName("장이름님은 차분해요.", "장은혁")).toBe("장은혁님은 차분해요.");
  });
  it("맞는 이름과 다른 단어는 그대로 둬요", () => {
    const s = "장은혁님은 선생님과 사장님을 만나요. 은혁님도 좋아요.";
    expect(repairName(s, "장은혁")).toBe(s);
  });
  it("세 글자 한글 이름이 아니면 손대지 않아요", () => {
    expect(repairName("장이름님", "Chang88")).toBe("장이름님");
    expect(repairName("장이름님", null)).toBe("장이름님");
    expect(repairName("김수님", "김수")).toBe("김수님");
  });
  it("두 글자 이상 다른 세 글자 말은 그대로", () => {
    expect(repairName("사람들님", "장은혁")).toBe("사람들님");
  });
});

describe("scrubExampleName", () => {
  it("남의 글에 새어 든 예시 이름을 지워요", () => {
    expect(scrubExampleName("은혁아, 오늘은 쉬어 봐.", "하나")).toBe("오늘은 쉬어 봐.");
    expect(scrubExampleName("은혁이는 불 기운이 강해.", null)).toBe("너는 불 기운이 강해.");
    expect(scrubExampleName("은혁이의 올해", "")).toBe("너의 올해");
  });
  it("실제 이름이나 고민 글에 은혁이 있으면 그대로 둬요", () => {
    expect(scrubExampleName("은혁아, 안녕", "은혁")).toBe("은혁아, 안녕");
    expect(scrubExampleName("은혁이랑 헤어졌구나", "하나", "은혁이랑 헤어졌어")).toBe("은혁이랑 헤어졌구나");
  });
  it("객체 안의 글도 고쳐요", () => {
    expect(scrubDeep({ a: ["은혁아, 응"], b: 3 }, "하나")).toEqual({ a: ["응"], b: 3 });
  });
});

describe("이름 뒤 소유격", () => {
  it("받침 있는 이름은 \"이의\"로 고쳐요", () => {
    expect(fixPossessive("재홍의 사주에서 가장 두드러진 십성인 관성", "재홍")).toBe("재홍이의 사주에서 가장 두드러진 십성인 관성");
    expect(fixPossessive("은혁의 사주는 단단해.", "장은혁")).toBe("은혁이의 사주는 단단해.");
  });
  it("받침 없는 이름·이미 맞는 말·다른 단어는 그대로 둬요", () => {
    expect(fixPossessive("지수의 사주", "지수")).toBe("지수의 사주");
    expect(fixPossessive("재홍이의 사주", "재홍")).toBe("재홍이의 사주");
    expect(fixPossessive("재홍의미는 없어", "재홍")).toBe("재홍의미는 없어");
    expect(fixPossessive("재홍의 사주", null)).toBe("재홍의 사주");
  });
});
