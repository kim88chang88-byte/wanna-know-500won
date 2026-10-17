/**
 * 무료 횟수를 서버에서 강제할지. 기본은 "기록만 하고 막지는 않아요"(베타).
 * 결제가 열리면 DAILY_FREE_LIMIT_ENFORCED=true 로 켜서, 오늘 무료 1회를 쓴 계정은 결제 없이 더 뽑지 못하게 해요.
 */
export function isDailyLimitEnforced(env: Record<string, string | undefined>): boolean {
  return env.DAILY_FREE_LIMIT_ENFORCED === "true";
}

export const FREE_PER_DAY = 1;
