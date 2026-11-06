/*
 * 풀이 글에서 이용자를 친근하게 부르는 이름.
 * "장은혁" → 이름만 떼어 "은혁아," / "은혁이의". 닉네임처럼 성씨로 시작하지 않는 이름은 그대로 써요.
 */
const SURNAMES = "김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구천방공";

const isHangul = (c: string) => c >= "가" && c <= "힣";
const hasBatchim = (c: string) => isHangul(c) && (c.charCodeAt(0) - 0xac00) % 28 !== 0;

/** 불러 줄 이름: 성씨가 앞에 있는 세·네 글자 한글 이름이면 성을 떼요. */
export function givenName(name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (/^[가-힣]{3,4}$/.test(n) && SURNAMES.includes(n[0])) return n.slice(n.length === 3 ? 1 : 2);
  return n;
}

/** "은혁아" / "지수야". 한글이 아니면 이름 뒤에 아·야를 붙이지 않아요. */
export function vocative(name: string | null | undefined): string {
  const g = givenName(name);
  if (!g) return "";
  const last = g[g.length - 1];
  if (!isHangul(last)) return g;
  return `${g}${hasBatchim(last) ? "아" : "야"}`;
}

/** "은혁이의" / "지수의". 제목에서 "○○의 …"처럼 써요. */
export function possessive(name: string | null | undefined): string {
  const g = givenName(name);
  if (!g) return "";
  const last = g[g.length - 1];
  return `${g}${isHangul(last) && hasBatchim(last) ? "이" : ""}의`;
}

/** "은혁이와" / "지수와". */
export function withName(name: string | null | undefined): string {
  const g = givenName(name);
  if (!g) return "";
  const last = g[g.length - 1];
  return `${g}${isHangul(last) && hasBatchim(last) ? "이" : ""}와`;
}
