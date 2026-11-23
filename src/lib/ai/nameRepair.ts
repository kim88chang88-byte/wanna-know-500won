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

/** 반말로 부를 이름: 성을 떼고(한글 3~4자) 받침에 따라 아/야. */
export function givenName(name: string): string {
  const n = name.trim();
  return /^[가-힣]{3,4}$/.test(n) ? n.slice(n.length - 2) : n;
}
export function hasBatchim(word: string): boolean {
  const c = word.charCodeAt(word.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
}
export function callName(name: string): string {
  const g = givenName(name);
  return g + (hasBatchim(g) ? "아" : "야");
}
export function subjName(name: string): string {
  const g = givenName(name);
  return g + (hasBatchim(g) ? "이는" : "는");
}

/**
 * 프롬프트 예시에 쓴 이름("은혁")을 AI 가 다른 사람의 글에 그대로 옮겨 쓰는 일을 막아요.
 * 그 사람의 이름·상대 이름·고민 글(allowed)에 "은혁"이 들어 있으면 정말 그 이름일 수 있으니 건드리지 않아요.
 * 부르는 말("은혁아,")은 지우고, 주어("은혁이는")는 "너는"으로, 나머지는 "너"로 바꿔요.
 */
const EXAMPLE_NAME = "은혁";
export function scrubExampleName(text: string, ...allowed: Array<string | null | undefined>): string {
  if (!text.includes(EXAMPLE_NAME)) return text;
  if (allowed.some((a) => (a ?? "").includes(EXAMPLE_NAME))) return text;
  return text
    .replace(/(?<![가-힣])은혁[아야][,，!]?\s*/g, "")
    .replace(/(?<![가-힣])은혁(이는|은)/g, "너는")
    .replace(/(?<![가-힣])은혁(이가|이도|이만)/g, (_m, p: string) => `네${p === "이가" ? "가" : p === "이도" ? "도" : "만"}`)
    .replace(/(?<![가-힣])은혁이의/g, "너의")
    .replace(/(?<![가-힣])은혁(님|이)?(?![가-힣])/g, "너");
}

/** 객체·배열 안의 모든 글에 scrubExampleName 을 적용해요. (값이 글·배열·일반 객체일 때만. 그 밖의 값은 그대로) */
export function scrubDeep<T>(value: T, ...allowed: Array<string | null | undefined>): T {
  if (typeof value === "string") return scrubExampleName(value, ...allowed) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v, ...allowed)) as unknown as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, scrubDeep(v, ...allowed)])) as T;
  }
  return value;
}
