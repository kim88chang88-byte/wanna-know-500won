/*
 * 베타 "구매 체험": 실제 결제 없이 구매한 것처럼 동전이 들어오는 흐름이에요.
 * 결제 금액은 어디에도 기록하지 않고, 한 계정이 한 달에 DEMO_MONTH_CAP 번까지만 받아요.
 * 정식 결제가 열리면 이 기능은 실제 결제창으로 바꾸고 지워요.
 */
export const DEMO_KIND = "demo_buy";
export const DEMO_MONTH_CAP = 3;

export type DemoProduct = "reading" | "compat" | "premium";

/** 상품별로 들어오는 동전 수 (500원=1개, 궁합=2개, 프리미엄=보너스 5개) */
export const DEMO_COINS: Record<DemoProduct, number> = { reading: 1, compat: 2, premium: 5 };

export function parseDemoProduct(v: unknown): DemoProduct | null {
  return v === "reading" || v === "compat" || v === "premium" ? v : null;
}
