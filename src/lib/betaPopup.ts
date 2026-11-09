/*
 * 오픈베타 안내 팝업: 접속하면 가장 먼저 한 번 보여주고,
 * "오늘 하루 보지 않기"를 체크하고 닫으면 그날(KST)은 다시 보여주지 않아요.
 */
export const BETA_POPUP_KEY = "wanna500_beta_open_hide";

/** KST 기준 날짜 문자열 (YYYY-MM-DD) */
export function kstToday(now: number = Date.now()): string {
  return new Date(now + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 오늘 숨김으로 저장된 값이면 보여주지 않아요. 저장소를 못 읽으면 보여줘요. */
export function shouldShowBeta(stored: string | null, now: number = Date.now()): boolean {
  return stored !== kstToday(now);
}
