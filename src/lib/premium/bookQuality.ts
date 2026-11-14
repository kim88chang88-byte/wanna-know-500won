import { containsForbidden } from "@/lib/ai/reading";
import type { BookPage, PremiumReportView } from "./types";

/**
 * 프리미엄 책 품질 점검 (코드로만 세요. AI 비용 없음).
 * 기준값은 아래 THRESHOLDS 한 곳에 모아 두었어요. 재홍이 보면서 고치면 돼요.
 * 값이 warn 이상이면 "주의", fail 이상이면 "실패"로 표시해요.
 */
export const THRESHOLDS = {
  /** 같은 두 어절로 끝나는 문장 수 */
  endingRepeat: { warn: 5, fail: 10 },
  /** 같은 두 어절로 시작하는 문장 수 */
  startRepeat: { warn: 6, fail: 12 },
  /** 한 낱말이 책 전체에서 나온 횟수 */
  wordRepeat: { warn: 15, fail: 25 },
  /** 같은 비유 소재가 나온 쪽 수 */
  metaphorPages: { warn: 3, fail: 5 },
  /** 문장 통째로 굵게 쓴 곳(40자 이상)의 수 */
  longBold: { warn: 4, fail: 8 },
  /** 쪽 글자 수가 중앙값의 몇 % 미만이면 짧은 쪽 */
  shortPageRatio: 0.4,
} as const;

export type Level = "ok" | "warn" | "fail";
export interface Metric {
  id: string;
  title: string;
  level: Level;
  summary: string;
  /** 자세한 줄들 (많이 나온 것 순) */
  details: string[];
}
export interface QualityReport {
  chars: number;
  pages: number;
  metrics: Metric[];
}

const METAPHORS = ["저수지", "큰 산", "듬직한 산", "산길", "정원", "방의 온도", "날씨", "지도", "사계절", "계절", "등불", "설계도", "이정표", "나침반", "바다", "나무", "씨앗", "파도", "다리", "그릇"];
const PLACEHOLDER = /장이름|이름님|OOO|○○|\{[^}]*\}|\[이름\]|undefined|null|NaN|\bTODO\b/;
const STOP = new Set(["그리고", "하지만", "그래서", "때문에", "이렇게", "그렇게", "같은", "있는", "없는", "하는", "되는", "이런", "저런", "그런", "어떤", "무엇", "모든", "정말", "조금", "먼저", "다음", "지금", "이번", "오늘", "이것", "그것", "때는", "것이", "것은", "수가", "있어요", "있습니다", "해요", "해서", "있고", "이고", "하고", "같아요", "좋아요", "입니다", "합니다", "있을", "할수", "해도", "에서", "으로"]);

/** 쪽 하나의 글을 문단별로 모아요. 굵은 글씨 표시(**)는 따로 세고 본문에서는 빼요. */
export function pageTexts(p: BookPage): string[] {
  const out: string[] = [];
  if (p.lead) out.push(p.lead);
  if (p.note) out.push(p.note);
  if (p.advice) out.push(p.advice);
  for (const s of p.sections) {
    if (s.heading) out.push(s.heading);
    if (s.body) out.push(s.body);
    for (const c of s.checks ?? []) out.push(c);
  }
  return out;
}

const plain = (t: string) => t.replace(/\*\*/g, "");

export function sentencesOf(text: string): string[] {
  return plain(text)
    .split(/(?<=[.!?。…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8);
}

const clean = (w: string) => w.replace(/[^가-힣A-Za-z0-9]/g, "");
const level = (n: number, t: { warn: number; fail: number }): Level => (n >= t.fail ? "fail" : n >= t.warn ? "warn" : "ok");
const worst = (a: Level, b: Level): Level => (a === "fail" || b === "fail" ? "fail" : a === "warn" || b === "warn" ? "warn" : "ok");

function top(map: Map<string, number>, n: number, min = 2): Array<[string, number]> {
  return [...map.entries()].filter(([, c]) => c >= min).sort((a, b) => b[1] - a[1]).slice(0, n);
}

/** 같은 두 어절로 끝나거나 시작하는 문장이 얼마나 되풀이되는지 */
function edgeRepeat(sentences: string[], edge: "start" | "end", t: { warn: number; fail: number }, id: string, title: string): Metric {
  const m = new Map<string, number>();
  for (const s of sentences) {
    const w = s.split(/\s+/).map(clean).filter(Boolean);
    if (w.length < 3) continue;
    const key = edge === "end" ? w.slice(-2).join(" ") : w.slice(0, 2).join(" ");
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  const list = top(m, 8);
  const max = list[0]?.[1] ?? 0;
  return { id, title, level: level(max, t), summary: list.length ? `가장 많이 반복된 것: "${list[0][0]}" ${max}번` : "눈에 띄는 반복 없음", details: list.map(([k, c]) => `${k} — ${c}번`) };
}

export function analyzeBook(report: Pick<PremiumReportView, "book" | "viewerName">): QualityReport {
  const pages = report.book;
  const perPage = pages.map((p) => ({ p, text: pageTexts(p).map(plain).join("\n") }));
  const all = perPage.map((x) => x.text).join("\n");
  const sentences = pages.flatMap((p) => pageTexts(p).flatMap(sentencesOf));
  const metrics: Metric[] = [];

  metrics.push(edgeRepeat(sentences, "end", THRESHOLDS.endingRepeat, "endings", "문장 끝맺음 반복"));
  metrics.push(edgeRepeat(sentences, "start", THRESHOLDS.startRepeat, "starts", "문장 시작 반복"));

  // 자주 나오는 낱말 (조사 정리는 거칠게. 눈으로 볼 참고용)
  const wc = new Map<string, number>();
  for (const raw of all.split(/\s+/)) {
    const w = clean(raw).replace(/(은|는|이|가|을|를|에|의|도|로|과|와|에서|으로|에게|처럼|부터|까지|만|이나|라도)$/, "");
    if (w.length < 2 || STOP.has(w) || /^\d+$/.test(w)) continue;
    wc.set(w, (wc.get(w) ?? 0) + 1);
  }
  const words = top(wc, 20, 3);
  metrics.push({ id: "words", title: "많이 나오는 낱말 상위 20", level: level(words[0]?.[1] ?? 0, THRESHOLDS.wordRepeat), summary: words.length ? `가장 많은 낱말: "${words[0][0]}" ${words[0][1]}번` : "쏠린 낱말 없음", details: words.map(([k, c]) => `${k} — ${c}번`) });

  // 비유 소재가 몇 쪽에 나왔는지
  const metaRows = METAPHORS.map((m) => ({ m, pages: perPage.filter((x) => x.text.includes(m)).length, times: all.split(m).length - 1 })).filter((r) => r.pages > 0).sort((a, b) => b.pages - a.pages);
  metrics.push({ id: "metaphor", title: "같은 비유 소재의 쪽 수", level: level(metaRows[0]?.pages ?? 0, THRESHOLDS.metaphorPages), summary: metaRows.length ? `"${metaRows[0].m}" ${metaRows[0].pages}쪽 ${metaRows[0].times}번` : "비유 소재 반복 없음", details: metaRows.slice(0, 8).map((r) => `${r.m} — ${r.pages}쪽, 총 ${r.times}번`) });

  // 자리표시·이름 오타
  const holders = pages.flatMap((p) => pageTexts(p).filter((t) => PLACEHOLDER.test(t)).map((t) => `${p.no}쪽: ${t.slice(0, 40)}…`));
  const nameSet = new Map<string, number>();
  for (const m of all.matchAll(/([가-힣]{3})님/g)) nameSet.set(m[1], (nameSet.get(m[1]) ?? 0) + 1);
  const viewer = report.viewerName ?? null;
  const names = [...nameSet.entries()].filter(([n]) => !/(고객|여러분|도리|사용자|이용자|독자)/.test(n)).sort((a, b) => b[1] - a[1]);
  const typo = viewer ? names.filter(([n]) => n !== viewer && n[0] === viewer[0]) : names.slice(1);
  metrics.push({ id: "names", title: "이름 오타·자리표시", level: holders.length ? "fail" : typo.length ? "warn" : "ok", summary: holders.length ? `남은 자리표시 ${holders.length}곳` : typo.length ? `비슷한 이름 ${typo.length}개: ${typo.map(([n]) => n).join(", ")}` : "문제 없음", details: [...holders, ...names.slice(0, 5).map(([n, c]) => `"${n}님" ${c}번`)] });

  // 금지어
  const forb: string[] = [];
  for (const p of pages) for (const t of pageTexts(p)) { const w = containsForbidden(plain(t)); if (w) forb.push(`${p.no}쪽 "${w}": ${plain(t).slice(0, 36)}…`); }
  metrics.push({ id: "forbidden", title: "금지어", level: forb.length ? "fail" : "ok", summary: forb.length ? `${forb.length}곳` : "없음", details: forb.slice(0, 8) });

  // 말투 섞임: 존댓말 글에 반말 2인칭이 끼는지
  const informal = [...all.matchAll(/(^|\s)(너를|너는|너의|네가|너도|너랑)(?=\s|[.,!?]|$)/g)].length;
  metrics.push({ id: "tone", title: "말투 섞임(존댓말 속 반말 '너')", level: informal >= 3 ? "fail" : informal >= 1 ? "warn" : "ok", summary: informal ? `반말 2인칭 ${informal}곳` : "없음", details: [] });

  // 문장 통째로 굵게
  const bold = [...report.book.flatMap((p) => pageTexts(p)).join("\n").matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]);
  const longBold = bold.filter((b) => b.length >= 40);
  metrics.push({ id: "bold", title: "굵은 글씨", level: level(longBold.length, THRESHOLDS.longBold), summary: `굵은 곳 ${bold.length}개, 문장 통째 ${longBold.length}개`, details: longBold.slice(0, 5).map((b) => b.slice(0, 50) + "…") });

  // 쪽 길이
  const lens = perPage.map((x) => x.text.length);
  const sorted = [...lens].sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const shortPages = perPage.filter((x) => med > 0 && x.text.length < med * THRESHOLDS.shortPageRatio);
  metrics.push({ id: "length", title: "쪽별 글자 수", level: shortPages.length >= 3 ? "fail" : shortPages.length ? "warn" : "ok", summary: `중앙값 ${med}자, 짧은 쪽 ${shortPages.length}개`, details: perPage.map((x) => `${x.p.no}쪽 ${x.p.title} — ${x.text.length}자`) });

  return { chars: all.length, pages: pages.length, metrics };
}

export const overallLevel = (r: QualityReport): Level => r.metrics.reduce<Level>((a, m) => worst(a, m.level), "ok");
