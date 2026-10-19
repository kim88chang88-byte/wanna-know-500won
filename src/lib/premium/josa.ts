/** 한글 조사 붙이기. 받침이 있는지에 따라 을/를, 이/가, 은/는, 과/와, 으로/로 를 골라요. */

type Josa = "을/를" | "이/가" | "은/는" | "과/와" | "으로/로";

/** 마지막 글자의 받침 번호. 한글이 아니면 받침 없음(0)으로 봐요. (0 없음, 8 = ㄹ) */
function finalConsonant(word: string): number {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return 0;
  return (code - 0xac00) % 28;
}

export function josa(word: string, kind: Josa): string {
  const f = finalConsonant(word);
  const has = f !== 0;
  switch (kind) {
    case "을/를":
      return word + (has ? "을" : "를");
    case "이/가":
      return word + (has ? "이" : "가");
    case "은/는":
      return word + (has ? "은" : "는");
    case "과/와":
      return word + (has ? "과" : "와");
    case "으로/로":
      return word + (!has || f === 8 ? "로" : "으로");
  }
}
