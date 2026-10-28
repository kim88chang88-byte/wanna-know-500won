import { BRANCHES, STEMS } from "@/lib/saju/constants";

/*
 * 풀이 글에 나오는 한자는 "음 먼저, 괄호 안에 한자"로 보여줘요. (예: 병오(丙午), 목(木))
 * 이미 그 모양이면 그대로 두고(여러 번 돌려도 같은 결과), 한자 먼저인 "丙午(병오)" 는 뒤집어요.
 */

const EXTRA: Record<string, string> = {
  木: "목", 火: "화", 土: "토", 金: "쇠", 水: "수",
  四: "사", 柱: "주", 八: "팔", 字: "자", 年: "년", 月: "월", 日: "일", 時: "시",
  干: "간", 支: "지", 沖: "충", 合: "합", 刑: "형", 破: "파", 害: "해", 運: "운",
};

const READING: Record<string, string> = { ...EXTRA };
for (const s of STEMS) READING[s.hanja] = s.hangul;
for (const b of BRANCHES) READING[b.hanja] = b.hangul;

/** 한자 덩어리의 한글 읽기. 모르는 글자가 하나라도 있으면 null */
export function hanjaReading(run: string): string | null {
  let out = "";
  for (const ch of Array.from(run)) {
    const r = READING[ch];
    if (!r) return null;
    out += r;
  }
  return out;
}

const H = "\\u4e00-\\u9fff";
// 0) 이미 바꾼 "병(丙, 편재)"  1) 한자(한글)  2) 한글(한자)  3) (한자)  4) 한자만
const PATTERN = new RegExp(
  `[가-힣]+\\([${H}]+, [^)]*\\)|([${H}]+)\\(([가-힣][가-힣 ]*)\\)|([가-힣]+)\\(([${H}]+)\\)|\\(([${H}]+)\\)|([${H}]+)`,
  "g",
);

/** 글 속 한자를 모두 "음(한자)" 모양으로 바꿔요. 읽는 법을 모르는 한자는 그대로 둬요. */
export function readingFirst(text: string): string {
  return friendlyMetal(hanjaToReadingFirst(friendlyMetal(text)));
}

/** 오행의 금(金)은 쉬운 말로 "쇠"라고 불러요. (금요일·금전 같은 다른 말은 건드리지 않아요) */
export function friendlyMetal(text: string): string {
  return text
    .replace(/금\(金\)/g, "쇠(金)")
    .replace(/(?<![가-힣])금(?=\s?(?:기운|오행|에너지|의 기운)|[·,]\s?[목화토수쇠])/g, "쇠")
    .replace(/(?<=[목화토수쇠][·,]\s?)금(?![가-힣])/g, "쇠");
}

function hanjaToReadingFirst(text: string): string {
  if (!/[\u4e00-\u9fff]/.test(text)) return text;
  return text.replace(PATTERN, (m, h1?: string, k1?: string, k2?: string, h2?: string, h3?: string, h4?: string) => {
    if (h1 && k1) {
      const r = hanjaReading(h1);
      if (!r) return m;
      return k1 === r ? `${r}(${h1})` : `${r}(${h1}, ${k1})`; // 丙(병) → 병(丙), 丁(편재) → 정(丁, 편재)
    }
    if (k2 && h2) {
      const r = hanjaReading(h2);
      if (!r || k2.endsWith(r)) return m; // 이미 병오(丙午) 모양
      return `${k2} ${r}(${h2})`; // 2024년(甲辰) → 2024년 갑진(甲辰)
    }
    if (h3) {
      const r = hanjaReading(h3);
      return r ? `${r}(${h3})` : m;
    }
    if (h4) {
      const r = hanjaReading(h4);
      return r ? `${r}(${h4})` : m;
    }
    return m; // 이미 바꾼 모양
  });
}

/** 값 안의 모든 글에 readingFirst 를 적용해요. skip 에 든 이름의 칸(구조 데이터)은 건드리지 않아요. */
export function readingFirstDeep<T>(value: T, skip: ReadonlySet<string> = new Set()): T {
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return readingFirst(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = skip.has(k) ? x : walk(x);
      return out;
    }
    return v;
  };
  return walk(value) as T;
}
