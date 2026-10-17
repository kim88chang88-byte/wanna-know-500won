const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 한국 시간(KST) 기준 날짜 "2026-10-17". "매일 첫 1회 무료"의 하루는 한국 시간 0시에 바뀌어요. */
export function kstDay(now: Date): string {
  const k = new Date(now.getTime() + KST_OFFSET_MS);
  return `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}`;
}

/** 그날이 속한 달의 첫날과 다음 달 첫날 (이번 달 집계 범위 [start, next)) */
export function kstMonthRange(now: Date): { start: string; next: string } {
  const k = new Date(now.getTime() + KST_OFFSET_MS);
  const y = k.getUTCFullYear();
  const m = k.getUTCMonth() + 1;
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return { start: `${y}-${pad(m)}-01`, next: `${ny}-${pad(nm)}-01` };
}
