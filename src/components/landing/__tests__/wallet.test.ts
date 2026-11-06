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
  it("동전 2개는 천원권, 20개는 만원권이에요", () => {
    expect(splitWallet(0)).toEqual({ tenK: 0, bills: 0, coins: 0 });
    expect(splitWallet(1)).toEqual({ tenK: 0, bills: 0, coins: 1 });
    expect(splitWallet(19)).toEqual({ tenK: 0, bills: 9, coins: 1 });
    expect(splitWallet(20)).toEqual({ tenK: 1, bills: 0, coins: 0 });
    expect(splitWallet(21)).toEqual({ tenK: 1, bills: 0, coins: 1 });
    expect(splitWallet(30)).toEqual({ tenK: 1, bills: 5, coins: 0 });
    expect(splitWallet(-4)).toEqual({ tenK: 0, bills: 0, coins: 0 });
  });
});
