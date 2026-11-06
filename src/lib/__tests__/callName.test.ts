import { describe, expect, it } from "vitest";
import { givenName, possessive, vocative, withName } from "../callName";

describe("친근한 호칭", () => {
  it("성을 떼고 이름으로 불러요", () => {
    expect(givenName("장은혁")).toBe("은혁");
    expect(vocative("장은혁")).toBe("은혁아");
    expect(vocative("김지수")).toBe("지수야");
    expect(possessive("장은혁")).toBe("은혁이의");
    expect(possessive("김지수")).toBe("지수의");
    expect(withName("장은혁")).toBe("은혁이와");
    expect(withName("김지수")).toBe("지수와");
  });
  it("네 글자 이름(남궁민수)은 뒤 두 글자, 두 글자는 그대로", () => {
    expect(givenName("남궁민수")).toBe("민수");
    expect(vocative("지수")).toBe("지수야");
  });
  it("성씨로 시작하지 않는 닉네임은 그대로 써요", () => {
    expect(givenName("별빛이")).toBe("별빛이");
    expect(vocative("Peter")).toBe("Peter");
    expect(givenName("도리팬")).toBe("도리팬");
    expect(vocative("")).toBe("");
    expect(vocative(null)).toBe("");
  });
});
