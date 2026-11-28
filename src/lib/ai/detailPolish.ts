import { givenName } from "@/lib/callName";
import type { Detail } from "./detail";
import { fixPossessive } from "./nameRepair";

/*
 * 긴 풀이를 AI 가 쓴 뒤, 코드로 한 번 더 다듬어요. (프롬프트로 부탁해도 가끔 어기는 것들)
 * - "(나 절대 00아님!)" 같은 빈칸 표기 복구
 * - 이름을 주어로 쓴 "은혁은 …" → "너는 …"
 * - 같은 낱말 반복(든든·추진력·열정) 줄이기
 * - 글마다 이모지 개수 제한 (아쉬움 글은 0개)
 * - "~해가 될 거야" 같은 장담을 "~될 여지가 커"로
 * - 소제목이 명사로 끝나면(말투가 깨지면) 버려서 기본 제목이 나오게
 */

const KOT = "(나 절대 꼰대 아님!)";

/** 빈칸으로 새어 나온 "꼰대" 복구 */
export function fixKkondae(t: string): string {
  return t.replace(/\(\s*나\s*절대\s*(?:0{2,}|[OＯ○◯Xx]{2,}|\*{2,}|□{2,}|_{2,}|[가-힣]{0,1})\s*아님\s*!?\s*\)/g, KOT);
}

/** "은혁은 …" "은혁이는 …"처럼 이름을 주어로 쓴 곳을 "너는"으로. 부르는 말("은혁아,")은 건드리지 않아요. */
export function fixNameSubject(t: string, name: string | null | undefined): string {
  const g = givenName(name);
  if (!g || g.length < 2) return t;
  const esc = g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return t.replace(new RegExp(`(^|[\\s.!?…~])${esc}(?:이는|이가|은|는|이는|가)(?=\\s)`, "gu"), (_m, pre: string, off: number, whole: string) => {
    // 조사에 따라 너는/네가
    const rest = whole.slice(off + pre.length + g.length);
    const subj = /^(?:이가|가)/.test(rest) ? "네가" : "너는";
    return `${pre}${subj}`;
  });
}

const REPEAT: Array<{ stem: string; alts: string[]; keep: number }> = [
  { stem: "든든", alts: ["믿음직", "탄탄"], keep: 2 },
  { stem: "추진력", alts: ["행동력", "실행력"], keep: 2 },
  { stem: "열정", alts: ["의욕", "에너지"], keep: 2 },
];

/** 같은 낱말이 여러 글에 흩어져 있어도 전체에서 keep 번까지만 두고, 나머지는 비슷한 말로 바꿔요. 글 순서대로 처리해요. */
export function limitRepeats(texts: string[]): string[] {
  const out = texts.slice();
  for (const { stem, alts, keep } of REPEAT) {
    let seen = 0;
    let alt = 0;
    for (let i = 0; i < out.length; i++) {
      out[i] = out[i].split(stem).reduce((acc, part, idx) => {
        if (idx === 0) return part;
        seen += 1;
        if (seen <= keep) return acc + stem + part;
        const r = alts[alt % alts.length];
        alt += 1;
        return acc + r + part;
      }, "");
    }
  }
  return out;
}

const EMOJI = /[\u{1F300}-\u{1FAFF}☀-➿]️?/gu;

/** 글 하나의 이모지를 max 개까지만 남겨요. 지운 자리의 군더더기 공백도 정리해요. */
export function capEmoji(t: string, max: number): string {
  let n = 0;
  return t
    .replace(EMOJI, (m) => (++n <= max ? m : ""))
    .replace(/[ \t]+([.!?,])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trimEnd();
}

/** "~해가 될 거야" 같은 장담을 "~될 여지가 커"로 누그러뜨려요. */
export function softenPredictions(t: string): string {
  return t
    .replace(/(해|때|시기|흐름|한 해)가 될 거야/g, "$1가 될 여지가 커")
    .replace(/(해|때|시기|흐름|한 해)가 될 거라고/g, "$1가 될 여지가 크다고")
    .replace(/(길러|만들어|채워|잡혀|쌓여)질 거야/g, "$1지기 쉬워");
}

/** 늘 틀리는 말 몇 가지를 고쳐요. */
export function fixTypos(t: string): string {
  return t.replace(/고야 말는/g, "고야 마는").replace(/말는 사람/g, "마는 사람");
}

/** 제목 끝이 귀여운 반말인지. 명사로 끝나면 말투가 깨진 제목이에요. */
export function headEndsWell(h: string): boolean {
  const t = h.replace(/[\s!?.~…]+$/g, "");
  return /(네|야|거든|구나|지|자|어|아|워|해|래|걸|데|줘|봐|돼|군)$/u.test(t) && !/(니다|입니다|이다|한다)$/.test(t);
}

/** 접이식 글 일곱 편 + 요약 + 제목을 한 번에 다듬어요. */
export function polishDetail(d: Detail, name?: string | null): Detail {
  const keys = Object.keys(d.folds) as Array<keyof Detail["folds"]>;
  const base = (t: string) => softenPredictions(fixTypos(fixPossessive(fixNameSubject(fixKkondae(t), name), name)));
  const texts = [...keys.map((k) => base(d.folds[k] ?? "")), d.story ? base(d.story) : ""];
  const limited = limitRepeats(texts);
  const folds: Detail["folds"] = {};
  keys.forEach((k, i) => {
    folds[k] = capEmoji(limited[i], k === "lack" ? 0 : 2);
  });
  const story = capEmoji(limited[keys.length], 3);
  const heads: Detail["heads"] = {};
  for (const k of Object.keys(d.heads) as Array<keyof Detail["heads"]>) {
    const h = d.heads[k];
    if (h && headEndsWell(h)) heads[k] = h;
  }
  return { ...d, story, folds, heads };
}
