import { calculateSaju as ssajuCalculate } from "ssaju";
import { STEMS } from "@/lib/saju/constants";
import type { BirthInput } from "@/lib/saju/types";
import { hiddenGods, interactions, natalRelations, POS_LABEL, type PosKey } from "@/lib/premium/book/insight";

/*
 * 프리미엄 리포트 엔진(ssaju)이 이미 계산하는 값 중, 오늘 풀이에 쓸 핵심만 추려서 AI 에게 넘겨요.
 * (신강/신약, 격국, 용신, 길신, 지금 대운, 올해 세운) 출생 날짜 자체는 담지 않아요.
 */

const GRADE: Record<string, string> = { strong: "신강(자기 기운이 센 편)", weak: "신약(주변 기운에 영향을 잘 받는 편)", neutral: "중화(균형)" };

/** ssaju 결과 중 여기서 읽는 부분만 적은 모양. 라이브러리 내부 타입에 기대지 않으려고 직접 정의했어요. */
export interface SsajuLike {
  advanced?: {
    dayStrength?: { strength?: string };
    geukguk?: string;
    yongsin?: string[];
    sinsal?: { gilsin?: string[] };
  };
  daeun?: { current?: { startAge?: number; endAge?: number; ganzhi?: string } | null };
  seyun?: Array<{ year?: number; ganzhi?: string; tenGodStem?: string; tenGodBranch?: string }>;
  currentYear?: number;
  pillars?: { year?: string; month?: string; day?: string; hour?: string };
  wolun?: Array<{ month: number; ganzhi?: string; stemTenGod?: string; branchTenGod?: string }>;
}

export interface CoreFacts {
  신강신약: string;
  격국?: string;
  /** 부족하거나 도움이 되는 기운 (예: 丙(병)) */
  용신?: string[];
  길신?: string[];
  지금대운?: string;
  올해세운?: { 간지: string; 천간십성?: string; 지지십성?: string };
  /** 원국 안의 합·충·형 (예: 월주-일주 午戌반합) */
  원국관계?: string[];
  /** 지장간 속에 숨은 십성 (겉으로 안 보이는 별) */
  숨은십성?: string[];
  /** 올해 세운이 원국과 만나는 합충 */
  세운과원국?: string[];
  /** 지금 대운이 원국과 만나는 합충 */
  대운과원국?: string[];
  /** (질문 칩용) 올해 월별 흐름. 예: "2월경 戊寅(식신)" */
  올해월운?: string[];
  지금대운나이?: string;
  이번달월운?: { 간지: string; 천간십성?: string; 지지십성?: string; 원국과?: string[] };
  참고?: string;
}

function withReading(stem: string): string {
  const s = STEMS.find((x) => x.hanja === stem);
  return s ? `${stem}(${s.hangul})` : stem;
}

const strs = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, max) : [];

/** 풀이에 '왜 그런지'를 담을 수 있게, 합충·지장간·세운·월운 근거를 덧붙여요. 값이 없으면 조용히 건너뛰어요. */
function addInteractionFacts(facts: CoreFacts, r: SsajuLike, hourKnown: boolean, now: Date): void {
  try {
    const pl = r.pillars;
    if (!pl?.year || !pl.month || !pl.day) return;
    const natal: Partial<Record<PosKey, string>> = { year: pl.year, month: pl.month, day: pl.day };
    if (hourKnown && pl.hour) natal.hour = pl.hour;
    const rels = natalRelations(natal)
      .slice(0, 4)
      .map((x) => `${POS_LABEL[x.a]}-${POS_LABEL[x.b]} ${x.branches}${x.type}${x.element ? `(${x.element})` : ""}`);
    if (rels.length) facts.원국관계 = rels;

    const dayStem = pl.day[0];
    const hid = hiddenGods(dayStem, natal)
      .slice(0, 6)
      .map((h) => `${POS_LABEL[h.pos]} 속 ${h.stem}(${h.god})`);
    if (hid.length) facts.숨은십성 = hid;

    const texts = (label: string, gz: string) => interactions(natal, { label, ganzhi: gz }).slice(0, 3).map((x) => x.text.split(" — ")[0]);
    const sy = r.seyun?.find((x) => x.year === r.currentYear);
    if (sy?.ganzhi) {
      const t = texts("세운", sy.ganzhi);
      if (t.length) facts.세운과원국 = t;
    }
    if (r.daeun?.current?.ganzhi) {
      const t = texts("대운", r.daeun.current.ganzhi);
      if (t.length) facts.대운과원국 = t;
    }
    // 이번 달 월운 (절기가 매달 7일 무렵 바뀌어서, 그 전이면 지난달로 봐요. r.wolun[0] 은 양력 2월경 寅월)
    const k = new Date(now.getTime() + 9 * 3600 * 1000);
    const day = k.getUTCDate();
    const solar = k.getUTCMonth() + 1;
    const eff = day >= 7 ? solar : solar === 1 ? 12 : solar - 1;
    const w = r.wolun?.[eff >= 2 ? eff - 2 : 11];
    if (w?.ganzhi) {
      const t = texts("이번 달", w.ganzhi);
      facts.이번달월운 = {
        간지: w.ganzhi,
        ...(w.stemTenGod ? { 천간십성: w.stemTenGod } : {}),
        ...(w.branchTenGod ? { 지지십성: w.branchTenGod } : {}),
        ...(t.length ? { 원국과: t } : {}),
      };
    }
  } catch {
    /* 근거를 못 만들어도 기본 풀이는 나가요 */
  }
}

/** ssaju 결과에서 핵심만 뽑아요. 값이 없거나 모양이 달라도 던지지 않고 가능한 것만 담아요. */
export function extractCoreFacts(r: SsajuLike, hourKnown: boolean, now: Date = new Date(), detail = false): CoreFacts | null {
  const strength = r.advanced?.dayStrength?.strength;
  if (!strength) return null;

  const facts: CoreFacts = { 신강신약: GRADE[strength] ?? strength };
  if (r.advanced?.geukguk) facts.격국 = r.advanced.geukguk;
  const yong = strs(r.advanced?.yongsin, 3).map(withReading);
  if (yong.length) facts.용신 = yong;
  const gil = strs(r.advanced?.sinsal?.gilsin, 4);
  if (gil.length) facts.길신 = gil;

  const dae = r.daeun?.current;
  if (dae?.ganzhi) facts.지금대운 = dae.ganzhi;

  const sy = r.seyun?.find((s) => s.year === r.currentYear);
  if (sy?.ganzhi) {
    facts.올해세운 = {
      간지: sy.ganzhi,
      ...(sy.tenGodStem ? { 천간십성: sy.tenGodStem } : {}),
      ...(sy.tenGodBranch ? { 지지십성: sy.tenGodBranch } : {}),
    };
  }
  addInteractionFacts(facts, r, hourKnown, now);
  if (detail) {
    if (dae?.startAge !== undefined && dae.endAge !== undefined) facts.지금대운나이 = `${dae.startAge}~${dae.endAge}세`;
    const months = (r.wolun ?? [])
      .filter((m) => m.ganzhi)
      .map((m) => `${(m.month % 12) + 1}월경 ${m.ganzhi}(${m.stemTenGod ?? ""}/${m.branchTenGod ?? ""})`);
    if (months.length) facts.올해월운 = months;
  }
  if (!hourKnown) facts.참고 = "태어난 시간을 몰라서 신강/신약과 용신은 참고용이에요";
  return facts;
}

/** 출생 정보로 핵심 사실을 계산해요. 어떤 이유로든 실패하면 null — 이 경우 풀이는 기본 재료만으로 나가요. */
export function buildCoreFacts(input: BirthInput, now: Date = new Date(), detail = false): CoreFacts | null {
  try {
    const hourUnknown = input.hour === null || input.hour === undefined;
    const r = ssajuCalculate({
      year: input.year,
      month: input.month,
      day: input.day,
      hour: hourUnknown ? undefined : (input.hour as number),
      minute: hourUnknown ? undefined : (input.minute ?? 0),
      gender: input.gender === "female" ? "여" : "남",
      calendar: input.calendar,
      leap: input.calendar === "lunar" && input.isLeapMonth === true,
      now,
    });
    return extractCoreFacts(r as unknown as SsajuLike, !hourUnknown, now, detail);
  } catch {
    return null;
  }
}
