/**
 * AI 가 이름을 한두 글자 잘못 쓰는 일이 있어요(예: 장은혁 → 장능혁, 장이름님, 상은혁님).
 * 이름이 한글 세 글자일 때, "세 글자 + 님" 중 이름과 한 글자만 다르거나 "성+이름님"(자리표시를 그대로 쓴 것)인 말을
 * 실제 이름으로 되돌려요. 다른 단어를 건드리지 않도록 이 두 가지 경우만 고쳐요.
 */
const HANGUL3 = /^[가-힣]{3}$/;

function hamming(a: string, b: string): number {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
}

export function repairName(text: string, name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (!HANGUL3.test(n)) return text;
  return text.replace(/(?<![가-힣])([가-힣]{3})님/g, (whole, token: string) => {
    if (token === n) return whole;
    if (hamming(token, n) <= 1) return `${n}님`; // 한 글자 오타
    if (token[0] === n[0] && token.slice(1) === "이름") return `${n}님`; // "성+이름" 자리표시
    return whole;
  });
}
