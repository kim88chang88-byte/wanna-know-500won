import { describe, expect, it } from "vitest";
import { repairName } from "../nameRepair";

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
