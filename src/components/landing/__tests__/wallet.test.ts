import { describe, expect, it } from "vitest";
import { capCount } from "../WalletBar";

describe("내 주머니 숫자", () => {
  it("음수·소수·이상한 값은 0 이나 내림으로 보여주고, 100 이상은 99+ 로 줄여요", () => {
    expect(capCount(0)).toBe("0");
    expect(capCount(-3)).toBe("0");
    expect(capCount(2.9)).toBe("2");
    expect(capCount(Number.NaN)).toBe("0");
    expect(capCount(99)).toBe("99");
    expect(capCount(100)).toBe("99+");
  });
});
