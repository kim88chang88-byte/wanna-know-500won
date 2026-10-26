/**
 * 프리미엄 리포트의 일부 풀이를 잠글지(블러). 베타 기간에는 전부 열어 두고,
 * 결제를 열 때 Vercel 환경변수 PREMIUM_LOCK=true 로 켜요. (값을 바꾼 뒤에는 Redeploy 필요)
 */
export function isPremiumLocked(env: Record<string, string | undefined>): boolean {
  return env.PREMIUM_LOCK?.trim().toLowerCase() === "true";
}

/** 프리미엄 "미리 보기"에서 이 쪽 번호부터는 서버가 풀이를 비워서 내려보내요. (1~4쪽만 열려 있어요) */
export const PREVIEW_OPEN_PAGES = 5;
