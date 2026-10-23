/**
 * AI 가 잠깐 막혔을 때(502)나 네트워크가 순간 끊겼을 때 한 번만 조용히 다시 보내요.
 * 이용자는 "다시 눌러 볼래요?" 대신 그냥 기다리다 답을 받게 돼요. (그 외 상태 코드는 그대로 돌려줘요)
 */
export async function fetchRetry(url: string, init: RequestInit, delayMs = 1200): Promise<Response> {
  const wait = () => new Promise<void>((r) => setTimeout(r, delayMs));
  try {
    const res = await fetch(url, init);
    if (res.status !== 502) return res;
  } catch {
    /* 네트워크 오류는 아래에서 한 번 더 */
  }
  await wait();
  return fetch(url, init);
}
