import { describe, expect, it } from "vitest";
import { PENDING_DRAW_KEY, PENDING_DRAW_TTL_MS, clearPendingDraw, savePendingDraw, takePendingDraw } from "../pendingDraw";

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}
const D = { key: "success", fortune: "성공운", price: "500원", premium: false };

describe("로그인 뒤 이어서 뽑기", () => {
  it("적어 둔 카드를 한 번만 꺼내요", () => {
    const s = mem();
    savePendingDraw(s, D, 1000);
    expect(takePendingDraw(s, 2000)).toEqual(D);
    expect(takePendingDraw(s, 2000)).toBeNull();
  });
  it("20분이 지나면 버려요", () => {
    const s = mem();
    savePendingDraw(s, D, 1000);
    expect(takePendingDraw(s, 1000 + PENDING_DRAW_TTL_MS + 1)).toBeNull();
  });
  it("모양이 이상하거나 비어 있으면 null", () => {
    const s = mem();
    s.setItem(PENDING_DRAW_KEY, "not json");
    expect(takePendingDraw(s)).toBeNull();
    s.setItem(PENDING_DRAW_KEY, JSON.stringify({ key: "", fortune: "x", price: "1", at: Date.now() }));
    expect(takePendingDraw(s)).toBeNull();
    expect(takePendingDraw(null)).toBeNull();
  });
  it("지우면 아무것도 안 나와요", () => {
    const s = mem();
    savePendingDraw(s, D);
    clearPendingDraw(s);
    expect(takePendingDraw(s)).toBeNull();
  });
  it("프리미엄 표시도 그대로 유지", () => {
    const s = mem();
    savePendingDraw(s, { ...D, premium: true, price: "9,900원" }, 5);
    expect(takePendingDraw(s, 6)?.premium).toBe(true);
  });
});
