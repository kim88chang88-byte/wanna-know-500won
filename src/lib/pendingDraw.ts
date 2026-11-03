/**
 * 비회원이 뽑기 카드를 눌러 로그인 창으로 갔을 때, 로그인하고 돌아오면 그 카드를 이어서 열어 주려고
 * "어떤 카드를 눌렀는지"만 잠깐 이 기기에 적어 둬요. (이름·생일 같은 개인정보는 넣지 않아요)
 * 20분이 지나거나 로그인 창을 그냥 닫으면 지워요.
 */
export const PENDING_DRAW_KEY = "wanna500:pending-draw:v1";
export const PENDING_DRAW_TTL_MS = 20 * 60 * 1000;

export interface PendingDraw {
  key: string;
  fortune: string;
  price: string;
  premium: boolean;
}

/** getItem/setItem 만 있는 저장소(`StorageLike`)도 받아요. removeItem 이 없으면 빈 값으로 덮어써서 지워요. */
type Store = { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem?(key: string): void };

function short(v: unknown, max: number): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= max;
}

export function savePendingDraw(store: Store | null, d: PendingDraw, now: number = Date.now()): void {
  try {
    store?.setItem(PENDING_DRAW_KEY, JSON.stringify({ ...d, at: now }));
  } catch {
    // 저장이 안 돼도 로그인 뒤에 직접 다시 누르면 돼요
  }
}

export function clearPendingDraw(store: Store | null): void {
  try {
    if (!store) return;
    if (store.removeItem) store.removeItem(PENDING_DRAW_KEY);
    else store.setItem(PENDING_DRAW_KEY, "");
  } catch {
    /* 무시 */
  }
}

/** 적어 둔 카드를 한 번만 꺼내요(꺼내면서 지워요). 오래됐거나 모양이 이상하면 null. */
export function takePendingDraw(store: Store | null, now: number = Date.now()): PendingDraw | null {
  if (!store) return null;
  let raw: string | null = null;
  try {
    raw = store.getItem(PENDING_DRAW_KEY);
  } catch {
    return null;
  }
  clearPendingDraw(store);
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<PendingDraw> & { at?: unknown };
    if (typeof d.at !== "number" || now - d.at > PENDING_DRAW_TTL_MS || now < d.at - 60_000) return null;
    if (!short(d.key, 40) || !short(d.fortune, 40) || !short(d.price, 20)) return null;
    return { key: d.key, fortune: d.fortune, price: d.price, premium: d.premium === true };
  } catch {
    return null;
  }
}
