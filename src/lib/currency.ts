/*
 * 도유사주의 화폐 이름: 조약돌(500원) · 진주(3,000원 = 조약돌 6개).
 * 서버와 DB 에는 조약돌 개수(옛 "조약돌")만 저장해요. 진주는 화면에서만 6개씩 묶어 보여줘요.
 */
export const PEBBLES_PER_PEARL = 6;

/** 조약돌 개수 → 진주 몇 개 + 남는 조약돌 몇 개 */
export function splitPearls(pebbleBalance: number): { pearls: number; pebbles: number } {
  const n = Number.isFinite(pebbleBalance) && pebbleBalance > 0 ? Math.floor(pebbleBalance) : 0;
  return { pearls: Math.floor(n / PEBBLES_PER_PEARL), pebbles: n % PEBBLES_PER_PEARL };
}

/** 글로 보여줄 때: 19 → "진주 3개 + 조약돌 1개", 6 → "진주 1개", 2 → "조약돌 2개", 0 → "조약돌 0개" */
export function pebbleText(pebbleBalance: number): string {
  const { pearls, pebbles } = splitPearls(pebbleBalance);
  if (pearls > 0 && pebbles > 0) return `진주 ${pearls}개 + 조약돌 ${pebbles}개`;
  if (pearls > 0) return `진주 ${pearls}개`;
  return `조약돌 ${pebbles}개`;
}
