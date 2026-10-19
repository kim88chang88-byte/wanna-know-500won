import { calculateSaju as ssajuCalculate } from "ssaju";
import { STEMS } from "@/lib/saju/constants";
import type { BirthInput } from "@/lib/saju/types";

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
  daeun?: { current?: { startAge?: number; ganzhi?: string } | null };
  seyun?: Array<{ year?: number; ganzhi?: string; tenGodStem?: string; tenGodBranch?: string }>;
  currentYear?: number;
}

export interface CoreFacts {
  신강신약: string;
  격국?: string;
  /** 부족하거나 도움이 되는 기운 (예: 丙(병)) */
  용신?: string[];
  길신?: string[];
  지금대운?: string;
  올해세운?: { 간지: string; 천간십성?: string; 지지십성?: string };
  참고?: string;
}

function withReading(stem: string): string {
  const s = STEMS.find((x) => x.hanja === stem);
  return s ? `${stem}(${s.hangul})` : stem;
}

const strs = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, max) : [];

/** ssaju 결과에서 핵심만 뽑아요. 값이 없거나 모양이 달라도 던지지 않고 가능한 것만 담아요. */
export function extractCoreFacts(r: SsajuLike, hourKnown: boolean): CoreFacts | null {
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
  if (!hourKnown) facts.참고 = "태어난 시간을 몰라서 신강/신약과 용신은 참고용이에요";
  return facts;
}

/** 출생 정보로 핵심 사실을 계산해요. 어떤 이유로든 실패하면 null — 이 경우 풀이는 기본 재료만으로 나가요. */
export function buildCoreFacts(input: BirthInput, now: Date = new Date()): CoreFacts | null {
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
    return extractCoreFacts(r as unknown as SsajuLike, !hourUnknown);
  } catch {
    return null;
  }
}
