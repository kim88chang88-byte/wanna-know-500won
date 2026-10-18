/**
 * 프리미엄 리포트의 일부 풀이를 잠글지(블러). 베타 기간에는 전부 열어 두고,
 * 결제를 열 때 Vercel 환경변수 PREMIUM_LOCK=true 로 켜요. (값을 바꾼 뒤에는 Redeploy 필요)
 */
export function isPremiumLocked(env: Record<string, string | undefined>): boolean {
  return env.PREMIUM_LOCK?.trim().toLowerCase() === "true";
}
