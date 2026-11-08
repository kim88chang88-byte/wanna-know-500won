import { describe, expect, it } from "vitest";
import { pebbleText, splitPearls } from "../currency";

describe("조약돌·진주", () => {
  it("조약돌 6개는 진주 1개예요", () => {
    expect(splitPearls(0)).toEqual({ pearls: 0, pebbles: 0 });
    expect(splitPearls(5)).toEqual({ pearls: 0, pebbles: 5 });
    expect(splitPearls(6)).toEqual({ pearls: 1, pebbles: 0 });
    expect(splitPearls(19)).toEqual({ pearls: 3, pebbles: 1 });
    expect(splitPearls(23)).toEqual({ pearls: 3, pebbles: 5 });
    expect(splitPearls(-4)).toEqual({ pearls: 0, pebbles: 0 });
    expect(splitPearls(Number.NaN)).toEqual({ pearls: 0, pebbles: 0 });
  });
  it("글로 보여줘요", () => {
    expect(pebbleText(19)).toBe("진주 3개 + 조약돌 1개");
    expect(pebbleText(6)).toBe("진주 1개");
    expect(pebbleText(2)).toBe("조약돌 2개");
    expect(pebbleText(0)).toBe("조약돌 0개");
  });
});
