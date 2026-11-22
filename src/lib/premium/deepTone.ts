/** 프리미엄 책의 도리 한 줄: "가볍게 살펴보자" → "깊이 있게 살펴보자". 그 밖의 "가볍게"는 말만 뺍니다. */
export function softToDeep(t: string): string {
  return t
    .replace(/가볍게(\s*)(살펴|읽어|들여다|짚어|알아|풀어)/g, "깊이 있게$1$2")
    .replace(/가볍게\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
