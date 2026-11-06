import { describe, expect, it } from "vitest";
import { capCount, splitWallet } from "../WalletBar";

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

describe("동전 잔액 → 지폐·동전", () => {
  it("동전 2개는 지폐 1장이에요", () => {
    expect(splitWallet(0)).toEqual({ bills: 0, coins: 0 });
    expect(splitWallet(1)).toEqual({ bills: 0, coins: 1 });
    expect(splitWallet(20)).toEqual({ bills: 10, coins: 0 }); // 1만원
    expect(splitWallet(19)).toEqual({ bills: 9, coins: 1 }); // 500원 쓴 뒤
    expect(splitWallet(-4)).toEqual({ bills: 0, coins: 0 });
  });
});
