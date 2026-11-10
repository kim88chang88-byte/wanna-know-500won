import { elementOfChar } from "@/lib/elementColor";
import type { Element } from "@/lib/saju/constants";
import type { ElementView } from "./types";

/*
 * 건강운 "오행 장부 지도". 전통 오행 대응(목=간·눈, 화=심장, 토=위, 금=폐, 수=신장)으로
 * 몸의 어느 곳을 챙기면 좋을지 생활 습관 힌트만 줘요. 병이나 증상을 알려 주는 그림이 아니에요.
 */
export type BodyEl = "목" | "화" | "토" | "금" | "수";
export type BodyState = "fill" | "rest" | "ok";

/** 그림 파일(public/images/body-map.webp) 크기. 표시 위치는 이 크기 기준 좌표예요. */
export const BODY_IMG = { w: 560, h: 1105 } as const;

export interface BodyGroup {
  el: BodyEl;
  /** 그림 옆 라벨 */
  label: string;
  area: string;
  habit: string;
  side: "L" | "R";
  /** 라벨 높이(그림 기준 y) */
  y: number;
  /** 그림 위 표시 위치 [x, y] */
  marks: [number, number][];
}

export const BODY_GROUPS: BodyGroup[] = [
  { el: "금", label: "폐", area: "호흡 · 피부", habit: "환기를 자주 하고, 자기 전 깊은 호흡 5번", side: "L", y: 270, marks: [[185, 370]] },
  { el: "목", label: "간 · 눈", area: "눈 · 간 · 근육", habit: "점심 뒤 5분 먼 곳 보기, 늦은 야식 줄이기", side: "L", y: 470, marks: [[195, 475], [203, 166], [290, 166]] },
  { el: "수", label: "신장", area: "허리 · 신장 · 수면", habit: "따뜻한 물을 하루 3번, 같은 시각에 잠자리에 들기", side: "L", y: 670, marks: [[185, 570], [315, 562]] },
  { el: "화", label: "심장", area: "심장 · 혈액순환", habit: "하루 20분 가벼운 걷기, 소리 내어 웃는 시간 만들기", side: "R", y: 340, marks: [[250, 370], [250, 595]] },
  { el: "토", label: "위", area: "소화 · 위장", habit: "식사 시간을 하루 중 같은 때로 맞추기", side: "R", y: 540, marks: [[305, 490]] },
];

export const STATE_TEXT: Record<BodyState, string> = { fill: "채워 주면 좋아", rest: "쉬어 가며 써", ok: "무난해" };
/** 그림 옆 라벨용 짧은 말 (좁은 화면에서도 한 줄) */
export const STATE_SHORT: Record<BodyState, string> = { fill: "채워 주기", rest: "쉬어 가기", ok: "무난해" };

/** 오행별 많고 적음으로 상태를 정해요. (적으면 채우기, 많으면 쉬어 가며 쓰기) */
export function bodyStates(elements: ElementView[]): Partial<Record<BodyEl, BodyState>> {
  const out: Partial<Record<BodyEl, BodyState>> = {};
  if (elements.length === 0) return out;
  const avg = elements.reduce((a, e) => a + e.count, 0) / elements.length;
  for (const e of elements) {
    if (!BODY_GROUPS.some((g) => g.el === e.name)) continue;
    out[e.name as BodyEl] = e.count === 0 || e.count < avg - 0.6 ? "fill" : e.count > avg + 1.2 ? "rest" : "ok";
  }
  return out;
}

const KO: Record<Element, BodyEl> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

/** 올해 세운 천간의 오행: 올해 몸에서 한 번 더 살펴볼 곳을 짚는 데 써요 */
export function yearFocus(seyunGanzhi: string | null | undefined): BodyEl | null {
  const el = elementOfChar(seyunGanzhi?.[0], false);
  return el ? KO[el] : null;
}

const RANK: Record<BodyState, number> = { fill: 0, rest: 1, ok: 2 };

/** 500원 풀이용: 챙길 곳 3가지 (채울 곳 → 쉬어 갈 곳 → 무난한 곳 순) */
export function topBodyPicks(states: Partial<Record<BodyEl, BodyState>>, max = 3): Array<{ group: BodyGroup; state: BodyState }> {
  return BODY_GROUPS.flatMap((g) => (states[g.el] ? [{ group: g, state: states[g.el] as BodyState }] : []))
    .sort((a, b) => RANK[a.state] - RANK[b.state])
    .slice(0, max);
}

/* ───────── 건강운 개선: 근거 한 줄 · 월별 컨디션 달력 · 하루 루틴 (계산과 문장 사전만 써요. AI 호출 없음) ───────── */

const NAME: Record<BodyEl, string> = { 목: "나무", 화: "불", 토: "땅", 금: "쇠", 수: "물" };
export const bodyElName = (el: BodyEl): string => NAME[el];

const TOPIC: Record<BodyEl, string> = { 목: "눈과 근육", 화: "혈액순환", 토: "소화", 금: "피부와 호흡기", 수: "허리와 수면" };

const avgOf = (elements: ElementView[]) => (elements.length ? elements.reduce((a, e) => a + e.count, 0) / elements.length : 0);
const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/** 부위마다 "왜 이 상태인지" 근거 한 줄. 오행 개수와 평균만 써요. */
export function bodyWhy(el: BodyEl, state: BodyState, elements: ElementView[]): string {
  const n = elements.find((e) => e.name === el)?.count ?? 0;
  const avg = f1(avgOf(elements));
  const nm = NAME[el];
  if (state === "rest") return `${nm} 기운이 ${n}개로 평균(${avg}개)보다 많아. ${TOPIC[el]} 쪽에 힘이 몰리기 쉬운 편이라 쉬어 가며 쓰면 좋아.`;
  if (state === "fill") return `${nm} 기운이 ${n}개로 적어(평균 ${avg}개). ${TOPIC[el]}을 채워 주는 습관이 도움이 돼.`;
  return `${nm} 기운이 ${n}개로 평균과 비슷해. 지금 습관을 이어 가면 돼.`;
}

const STEM_EL: Record<string, BodyEl> = { 甲: "목", 乙: "목", 丙: "화", 丁: "화", 戊: "토", 己: "토", 庚: "금", 辛: "금", 壬: "수", 癸: "수" };

/** 이번 달이 wolun(양력 2월경=0번) 의 몇 번째인지. 절기가 매달 7일 무렵 바뀌어서 그 전이면 지난달로 봐요. */
export function monthIndexNow(now: Date): number {
  const k = new Date(now.getTime() + 9 * 3600 * 1000);
  const d = k.getUTCDate();
  const m = k.getUTCMonth() + 1;
  const eff = d >= 7 ? m : m === 1 ? 12 : m - 1;
  return eff >= 2 ? eff - 2 : 11;
}

export interface MonthCond {
  label: string;
  el: BodyEl;
  group: BodyGroup;
  state: BodyState;
  text: string;
  current: boolean;
}

/** 올해 월운 천간의 오행 → 그 달에 챙길 부위. 내 사주에서 그 기운이 적으면 채우기 좋은 달, 많으면 쉬어 가는 달이에요. */
export function monthlyCondition(
  wolun: Array<{ month: number; ganzhi: string }> | undefined,
  states: Partial<Record<BodyEl, BodyState>>,
  nowIdx?: number,
): MonthCond[] {
  if (!wolun) return [];
  const out: MonthCond[] = [];
  wolun.forEach((m, i) => {
    const el = STEM_EL[m.ganzhi?.[0] ?? ""];
    const group = el ? BODY_GROUPS.find((g) => g.el === el) : undefined;
    const state = el ? states[el] : undefined;
    if (!el || !group || !state) return;
    const label = `${(m.month % 12) + 1}월경`;
    const nm = NAME[el];
    const text =
      state === "fill"
        ? `${label} ${nm} 기운이 들어와. 평소 적은 기운이라 ${group.area}을 채우기 좋은 달이야. ${group.habit}`
        : state === "rest"
          ? `${label} ${nm} 기운이 더해져. 이미 많은 기운이라 ${group.area}은 쉬어 가는 달로 잡아. ${group.habit}`
          : `${label} ${nm} 기운이 들어와. ${group.area}은 가볍게 챙기면 충분해. ${group.habit}`;
    out.push({ label, el, group, state, text, current: i === nowIdx });
  });
  return out;
}

/** 달력 아래 요약: 쉬어 가는 달 / 채우기 좋은 달 */
export function monthlySummary(cal: MonthCond[]): { rest: string; fill: string } {
  const line = (st: BodyState) => {
    const by = new Map<string, string[]>();
    for (const c of cal.filter((x) => x.state === st)) by.set(c.group.area, [...(by.get(c.group.area) ?? []), c.label.replace("월경", "")]);
    return [...by.entries()].map(([area, ms]) => `${ms.join("·")}월경 ${area}`).join(", ");
  };
  return { rest: line("rest"), fill: line("fill") };
}

export type RoutineSlot = { time: string; items: Array<{ el: BodyEl; text: string }> };

/** 하루 루틴: 채울 곳 → 쉬어 갈 곳 순으로 시간대에 배치. 일반적인 생활 습관만 써요. */
const HABITS: Record<BodyEl, Array<[string, string]>> = {
  수: [["아침", "따뜻한 물 한 컵 마시기"], ["자기 전", "같은 시각에 잠자리에 들기"]],
  목: [["아침", "3분 가볍게 스트레칭"], ["점심", "점심 뒤 5분 먼 곳 바라보기"], ["저녁", "늦은 야식은 줄이기"]],
  토: [["점심", "식사는 매일 같은 시간에"], ["저녁", "저녁은 천천히 꼭꼭 씹기"]],
  화: [["저녁", "20분 가볍게 걷기"], ["점심", "잠깐 웃고 떠드는 시간 만들기"]],
  금: [["자기 전", "창문 열고 깊은 호흡 5번"], ["아침", "환기부터 하기"]],
};
const TIMES = ["아침", "점심", "저녁", "자기 전"] as const;

export function dailyRoutine(states: Partial<Record<BodyEl, BodyState>>): RoutineSlot[] {
  const order = BODY_GROUPS.filter((g) => states[g.el]).sort((a, b) => RANK[states[a.el] as BodyState] - RANK[states[b.el] as BodyState]);
  const slots: RoutineSlot[] = TIMES.map((time) => ({ time, items: [] }));
  for (const g of order) {
    const st = states[g.el] as BodyState;
    const lim = st === "ok" ? 1 : 2; // 무난한 곳은 한 가지만
    for (const [time, text] of HABITS[g.el].slice(0, lim)) {
      const slot = slots.find((s) => s.time === time);
      if (slot && slot.items.length < 2) slot.items.push({ el: g.el, text });
    }
  }
  return slots.filter((s) => s.items.length > 0);
}
