import type { StorageLike } from "@/lib/drawCounter";

const PREFIX = "wanna500:reality:v1:";

/** 질문 글을 짧은 키로 바꿔요. (같은 질문이면 같은 키) */
function keyOf(question: string): string {
  let h = 5381;
  for (let i = 0; i < question.length; i++) h = ((h << 5) + h + question.charCodeAt(i)) | 0;
  return PREFIX + (h >>> 0).toString(36);
}

/** 이 질문에 이미 고른 답의 번호. 없거나 범위를 벗어나면 null. */
export function readRealityPick(store: StorageLike | null, question: string, optionCount: number): number | null {
  try {
    const v = store?.getItem(keyOf(question));
    if (v == null) return null;
    const n = Number(v);
    return Number.isInteger(n) && n >= 0 && n < optionCount ? n : null;
  } catch {
    return null;
  }
}

export function saveRealityPick(store: StorageLike | null, question: string, index: number): void {
  try {
    store?.setItem(keyOf(question), String(index));
  } catch {
    /* 저장이 안 돼도 화면에서는 잠겨요 */
  }
}
