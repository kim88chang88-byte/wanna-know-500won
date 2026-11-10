import { tenGodOf, type TenGod } from "@/lib/ai/dailyFacts";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import { groupOf, type Group } from "../topic";
import type { BookRow } from "../types";
import { GOD_MONTH_LINE, interactions, mainStemOf, POS_LABEL, type PosKey } from "./insight";

/*
 * "지금부터 12개월 시기표"와 대운 비교의 재료를 코드로 계산해요. (AI 호출 없음, 같은 입력이면 항상 같은 결과)
 * 달마다: 월운 간지 → 일간 기준 십성(천간·지지) → 원국과의 합·충·형·해 → 용신 기운이 들어오는지 → 원국에 없는 기운이 채워지는지
 * 를 한꺼번에 따져서 '어떤 달인지'와 '왜 그런지'를 만들어요. 표의 note 에 근거가 그대로 남아서 AI 가 글자 이름으로 짚을 수 있어요.
 * 모든 표현은 단정하지 않고 겁주지 않아요. 지수는 흐름의 높낮이를 보는 참고용이에요.
 */

type Natal = Partial<Record<PosKey, string>>;

const EL_KO: Record<string, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
const AREA: Record<PosKey, string> = { year: "초년·뿌리", month: "일·사회", day: "가까운 관계", hour: "꿈·앞날" };

export interface SajuMonth {
  /** 절기 기준 사주 연도 (1월경 丑월은 전해로 셈) */
  year: number;
  /** 월 이름으로 쓰는 양력 달 (절기가 대략 7일 무렵 바뀌어서 '○월경') */
  month: number;
}

/** 지금(KST)이 속한 절기 달. 매달 7일 무렵 절기가 바뀌므로 7일 전이면 지난달로 봐요. */
export function currentSajuMonth(now: Date): SajuMonth {
  const k = new Date(now.getTime() + 9 * 3600 * 1000);
  const day = k.getUTCDate();
  let year = k.getUTCFullYear();
  let month = k.getUTCMonth() + 1;
  if (day < 7) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return { year, month };
}

/** 양력 달 m(절기 달 이름)의 월운 간지. 월지는 2월=寅 … 12월=子, 1월=丑. 월간은 해의 천간으로 오호둔(五虎遁). */
export function monthGanzhi(year: number, month: number): string {
  const sajuYear = month >= 2 ? year : year - 1;
  const yearStem = (((sajuYear - 4) % 10) + 10) % 10;
  const branchIdx = month % 12;
  const startStem = ((yearStem % 5) * 2 + 2) % 10; // 寅월의 천간
  const k = (branchIdx - 2 + 12) % 12;
  const stem = (startStem + k) % 10;
  return `${STEMS[stem].hanja}${BRANCHES[branchIdx].hanja}`;
}

export function elKoOfStem(h: string): string {
  const s = STEMS.find((x) => x.hanja === h);
  return s ? (EL_KO[s.element] ?? "") : "";
}
function elKoOfBranch(h: string): string {
  const b = BRANCHES.find((x) => x.hanja === h);
  return b ? (EL_KO[b.element] ?? "") : "";
}

/** 원국 글자들이 가진 오행(천간·지지 겉글자 기준) */
function natalElements(natal: Natal): Set<string> {
  const s = new Set<string>();
  for (const p of Object.values(natal)) {
    if (!p || p.length < 2) continue;
    s.add(elKoOfStem(p[0]));
    s.add(elKoOfBranch(p[1]));
  }
  s.delete("");
  return s;
}

export type MonthTone = "힘이 붙는 달" | "순항하는 달" | "차분히 점검하는 달" | "쉬어 가는 달";

export interface MonthPlan {
  index: number;
  year: number;
  month: number;
  ganzhi: string;
  stemGod: TenGod;
  branchGod: TenGod;
  /** 원국과 만나는 합·충·형·해 (짧은 이름, 예: 子午충) */
  relations: Array<{ kind: "합" | "충" | "형" | "해"; name: string; area: string; day: boolean }>;
  /** 용신 오행이 들어오는 자리 */
  yongsinIn: Array<{ el: string; where: "천간" | "지지" }>;
  /** 원국에 없는 기운이 채워지면 그 오행 */
  fills: string[];
  /** 0~100 상대 지수 (실제 확률이 아니에요) */
  score: number;
  tone: MonthTone;
}

export interface TimelineInput {
  natal: Natal;
  dayStem: string;
  /** 용신 오행 한글 이름 (예: ["화", "수"]) */
  yongsinEls: string[];
  now: Date;
  count?: number;
}

function toneOf(score: number): MonthTone {
  return score >= 72 ? "힘이 붙는 달" : score >= 58 ? "순항하는 달" : score >= 44 ? "차분히 점검하는 달" : "쉬어 가는 달";
}

/** 월운 하나가 원국과 만나는 모습을 한 번에 계산해요. */
export function planMonth(input: Omit<TimelineInput, "now" | "count">, year: number, month: number, index: number): MonthPlan {
  const { natal, dayStem, yongsinEls } = input;
  const ganzhi = monthGanzhi(year, month);
  const stem = ganzhi[0];
  const branch = ganzhi[1];
  const stemGod = tenGodOf(dayStem, stem);
  const branchGod = tenGodOf(dayStem, mainStemOf(branch));

  const relations: MonthPlan["relations"] = [];
  for (const x of interactions(natal, { label: "이번 달", ganzhi })) {
    const name = x.text.split(" — ")[0];
    // 어느 기둥과 만났는지는 문장 속 기둥 이름에서 읽어요
    const pos = (Object.keys(POS_LABEL) as PosKey[]).find((k) => x.text.includes(`${POS_LABEL[k]} 천간`) || x.text.includes(`${POS_LABEL[k]} 지지`));
    if (!pos) continue;
    const isBranch = x.text.includes(`${POS_LABEL[pos]} 지지`);
    relations.push({ kind: x.kind, name, area: AREA[pos], day: pos === "day" && isBranch });
  }

  const yongsinIn: MonthPlan["yongsinIn"] = [];
  const stemEl = elKoOfStem(stem);
  const branchEl = elKoOfBranch(branch);
  if (stemEl && yongsinEls.includes(stemEl)) yongsinIn.push({ el: stemEl, where: "천간" });
  if (branchEl && yongsinEls.includes(branchEl)) yongsinIn.push({ el: branchEl, where: "지지" });

  const have = natalElements(natal);
  const fills = [...new Set([stemEl, branchEl])].filter((e) => e && !have.has(e));

  let score = 50;
  for (const y of yongsinIn) score += y.where === "천간" ? 12 : 8;
  if (fills.length) score += 4;
  let good = 0;
  for (const r of relations) {
    if (r.kind === "합") good += 1;
    else if (r.kind === "충") score -= r.day ? 10 : 7;
    else if (r.kind === "형") score -= 5;
    else score -= 3;
  }
  score += Math.min(good, 2) * 4;
  score = Math.max(20, Math.min(95, score));

  return { index, year, month, ganzhi, stemGod, branchGod, relations, yongsinIn, fills, score, tone: toneOf(score) };
}

/** 지금부터 count(기본 12)개월의 시기표 */
export function buildMonthTimeline(input: TimelineInput): MonthPlan[] {
  const count = input.count ?? 12;
  const start = currentSajuMonth(input.now);
  const out: MonthPlan[] = [];
  let y = start.year;
  let m = start.month;
  for (let i = 0; i < count; i++) {
    out.push(planMonth(input, y, m, i));
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

const KIND_SHORT: Record<"합" | "충" | "형" | "해", string> = { 합: "어울림", 충: "부딪힘", 형: "날이 서는 자극", 해: "서운함이 쌓이기 쉬움" };

/** 달마다 '왜 이런 달인지'를 글자 이름으로 짚은 근거 한 줄 (표의 note 로 들어가 AI 와 이용자가 함께 읽어요) */
export function monthEvidence(p: MonthPlan): string {
  const parts: string[] = [p.tone];
  parts.push(`천간 ${p.stemGod} · 지지 ${p.branchGod}`);
  for (const y of p.yongsinIn) parts.push(`용신 ${y.el}(${y.where})이 들어와`);
  if (p.fills.length) parts.push(`원국에 적은 ${p.fills.join("·")} 기운이 채워져`);
  for (const r of p.relations.slice(0, 3)) parts.push(`${r.name} ${KIND_SHORT[r.kind]}(${r.area})`);
  return parts.join(" · ");
}

/** 달마다 한 줄 요약: 십성 분위기 + (있다면) 가장 큰 관계 */
export function monthLine(p: MonthPlan): string {
  const base = GOD_MONTH_LINE[p.stemGod] ?? "";
  const clash = p.relations.find((r) => r.kind === "충");
  const combine = p.relations.find((r) => r.kind === "합");
  const extra = clash ? ` ${clash.area}에서 변화가 있을 수 있어 속도를 조절해.` : combine ? ` ${combine.area}에서 손발이 맞아.` : "";
  return `${base}${extra}`.trim();
}

/** 표(BookTable)의 행으로. 첫 달이 '지금'이에요. topic 을 주면 그 주제의 기운이 닿는 달을 포인트 달로 표시해요. */
export function timelineRows(plans: MonthPlan[], topic?: { hit: (p: MonthPlan) => boolean; label: string }): BookRow[] {
  return plans.map((p) => {
    const hit = topic ? topic.hit(p) : false;
    return {
      label: `${p.month}월경 · ${p.ganzhi}`,
      value: monthLine(p),
      note: `${monthEvidence(p)}${hit && topic ? ` · ${topic.label} 포인트` : ""}`,
      highlight: hit || p.tone === "힘이 붙는 달",
      bar: Math.min(95, p.score + (hit ? 6 : 0)),
      current: p.index === 0,
    };
  });
}

/* ------------------------------------------------------------------ 대운: 지난·지금·다음 비교 */

export interface DaeunItem {
  startAge: number;
  endAge: number;
  ganzhi: string;
  stemTenGod?: string;
  branchTenGod?: string;
}

export interface DaeunCompareInput {
  natal: Natal;
  dayStem: string;
  yongsinEls: string[];
  list: DaeunItem[];
  /** 지금 대운의 위치 (없으면 -1) */
  currentIdx: number;
}

const GROUP_PLAIN: Record<Group, string> = { 비겁: "내 힘·동료", 식상: "표현·재능", 재성: "돈·현실", 관성: "책임·직업", 인성: "배움·돌봄" };

function groupName(item: DaeunItem): Group | null {
  return groupOf(item.stemTenGod) ?? groupOf(item.branchTenGod);
}

/** 지난·지금·다음 대운 각각이 원국과 만나는 합충, 용신, 그리고 앞 대운과 달라지는 주제를 행으로 만들어요. */
export function daeunCompareRows(input: DaeunCompareInput): BookRow[] {
  const { natal, yongsinEls, list, currentIdx } = input;
  if (currentIdx < 0 || !list[currentIdx]) return [];
  const slots: Array<{ idx: number; tag: string }> = [
    { idx: currentIdx - 1, tag: "지난 대운" },
    { idx: currentIdx, tag: "지금 대운" },
    { idx: currentIdx + 1, tag: "다음 대운" },
  ];
  const rows: BookRow[] = [];
  for (const { idx, tag } of slots) {
    const d = list[idx];
    if (!d) continue;
    const prev = list[idx - 1];
    const g = groupName(d);
    const pg = prev ? groupName(prev) : null;
    const rel = interactions(natal, { label: tag, ganzhi: d.ganzhi })
      .slice(0, 3)
      .map((x) => x.text.split(" — ")[0]);
    const el1 = elKoOfStem(d.ganzhi[0]);
    const el2 = elKoOfBranch(d.ganzhi[1]);
    const yong = [...new Set([el1, el2])].filter((e) => e && yongsinEls.includes(e));
    const parts: string[] = [];
    if (g) parts.push(`주제 ${GROUP_PLAIN[g]}(${g})`);
    if (pg && g && pg !== g) parts.push(`앞 대운(${GROUP_PLAIN[pg]})에서 ${GROUP_PLAIN[g]} 쪽으로 무게가 옮겨가`);
    if (yong.length) parts.push(`용신 ${yong.join("·")} 기운이 함께 들어와`);
    if (rel.length) parts.push(`원국과 ${rel.join(", ")}`);
    else parts.push("원국과 눈에 띄는 합충은 없어");
    rows.push({
      label: `${tag} · ${d.startAge}~${d.endAge}세`,
      value: d.ganzhi,
      note: parts.join(" · "),
      highlight: idx === currentIdx,
    });
  }
  return rows;
}
