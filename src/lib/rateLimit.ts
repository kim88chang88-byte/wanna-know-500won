/**
 * 아주 단순한 "분당 N번" 제한기입니다. (서버 메모리에만 저장)
 * 주의: 서버리스 환경에서는 인스턴스마다 따로 세고, 재시작하면 초기화돼요. 악의적인 대량 호출까지 막지는 못하니
 * 로그인/결제가 붙으면 계정 기준의 서버 쪽 횟수 관리로 바꿔야 합니다.
 */
export interface RateLimiter {
  check(key: string): { ok: true } | { ok: false; retryAfterSec: number };
}

export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    check(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + windowMs - t) / 1000)) };
      }
      recent.push(t);
      hits.set(key, recent);
      // 오래된 키가 쌓이지 않게 가끔 정리
      if (hits.size > 5000) for (const [k, v] of hits) if (v.every((x) => t - x >= windowMs)) hits.delete(k);
      return { ok: true };
    },
  };
}
