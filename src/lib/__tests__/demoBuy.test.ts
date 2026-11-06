import { describe, expect, it } from "vitest";
import { DEMO_COINS, DEMO_MONTH_CAP, parseDemoProduct } from "../demoBuy";

describe("베타 구매 체험", () => {
  it("상품마다 동전 수가 정해져 있고, 월 한도는 3번이에요", () => {
    expect(DEMO_COINS).toEqual({ reading: 1, compat: 2, premium: 5 });
    expect(DEMO_MONTH_CAP).toBe(3);
  });
  it("알 수 없는 상품은 받지 않아요", () => {
    expect(parseDemoProduct("compat")).toBe("compat");
    expect(parseDemoProduct("coin100")).toBeNull();
    expect(parseDemoProduct(undefined)).toBeNull();
  });
});
