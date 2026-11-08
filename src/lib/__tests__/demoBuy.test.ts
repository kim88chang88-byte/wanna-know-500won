import { describe, expect, it } from "vitest";
import { DEMO_COINS, DEMO_MONTH_CAP, parseDemoProduct } from "../demoBuy";

describe("베타 구매 체험", () => {
  it("상품마다 동전 수가 정해져 있고, 월 한도는 3번이에요", () => {
    expect(DEMO_COINS).toEqual({ pack2: 2, pack7: 7, pack22: 22 });
    expect(DEMO_MONTH_CAP).toBe(3);
  });
  it("알 수 없는 상품은 받지 않아요", () => {
    expect(parseDemoProduct("pack7")).toBe("pack7");
    expect(parseDemoProduct("premium")).toBeNull();
    expect(parseDemoProduct(undefined)).toBeNull();
  });
});
