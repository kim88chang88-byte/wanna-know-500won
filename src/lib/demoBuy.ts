/*
 * 베타 "구매 체험": 실제 결제 없이 구매한 것처럼 조약돌이 들어오는 흐름이에요.
 * 결제 금액은 어디에도 기록하지 않고, 한 계정이 한 달에 DEMO_MONTH_CAP 번까지만 받아요.
 * 정식 결제가 열리면 이 기능은 실제 결제창으로 바꾸고 지워요.
 */
export const DEMO_KIND = "demo_buy";
export const DEMO_MONTH_CAP = 3;

export type DemoProduct = "pack2" | "pack7" | "pack22";

/** 상품별로 들어오는 조약돌 수 (11-08 개편: 1,000원=2개, 3,000원=6개+보너스 1개=7개, 9,000원=18개+보너스 4개=22개) */
export const DEMO_COINS: Record<DemoProduct, number> = { pack2: 2, pack7: 7, pack22: 22 };

export function parseDemoProduct(v: unknown): DemoProduct | null {
  return v === "pack2" || v === "pack7" || v === "pack22" ? v : null;
}
