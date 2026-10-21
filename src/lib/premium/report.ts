import { calculateSaju } from "ssaju";
import { STEMS } from "@/lib/saju/constants";
import type { BirthInput } from "@/lib/saju/types";
import { buildBook } from "./book";
import { applyLocks } from "./book/lock";
import { CONCERN_CHIPS, hasConcern, parseConcern, type Concern } from "@/lib/concerns";
import { buildCompat } from "./compat";
import { buildCompatBook, lockCompatBook, type BookSource } from "./book/compatBook";
import { buildConcernAnswers } from "./concernAnswer";
import { buildTopicInsight, resolveTopic } from "./topic";
import type { BookPage, DaeunView, ElementKind, ElementView, PillarView, PremiumReportView, ReportLevel, SeyunView } from "./types";

const PILLARS: { key: PillarView["key"]; label: string }[] = [
  { key: "year", label: "연주" },
  { key: "month", label: "월주" },
  { key: "day", label: "일주" },
  { key: "hour", label: "시주" },
];

const ELEMENTS: { name: string; kind: ElementKind }[] = [
  { name: "목", kind: "wood" },
  { name: "화", kind: "fire" },
  { name: "토", kind: "earth" },
  { name: "금", kind: "metal" },
  { name: "수", kind: "water" },
];

const GRADE: Record<string, string> = { strong: "신강", weak: "신약", neutral: "중화" };

/** 천간 한자에 한글 읽기를 붙여요. (丙 → 丙(병)) 천간이 아니면 그대로 둬요. */
function withReading(stem: string): string {
  const s = STEMS.find((x) => x.hanja === stem);
  return s ? `${stem}(${s.hangul})` : stem;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export type ValidationResult =
  | { ok: true; value: BirthInput; level: ReportLevel; topic: string; concern: Concern; partner: BirthInput | null }
  | { ok: false; error: string };

type BirthResult = { ok: true; value: BirthInput } | { ok: false; error: string };

/** 생년월일시·성별 한 사람 분을 검사해요. /api/reading 과 같은 BirthInput 모양을 받아요. */
function parseBirth(raw: unknown, who: string): BirthResult {
  if (!isRecord(raw)) return { ok: false, error: "잘못된 요청입니다." };
  const int = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : null);
  const year = int(raw.year);
  const month = int(raw.month);
  const day = int(raw.day);
  if (year === null || year < 1900 || year > 2100) return { ok: false, error: `${who}태어난 해를 1900~2100 사이로 입력해 주세요.` };
  if (month === null || month < 1 || month > 12) return { ok: false, error: `${who}태어난 달을 확인해 주세요.` };
  if (day === null || day < 1 || day > 31) return { ok: false, error: `${who}태어난 날을 확인해 주세요.` };

  let hour: number | null = null;
  let minute: number | null = null;
  if (raw.hour !== null && raw.hour !== undefined) {
    hour = int(raw.hour);
    minute = raw.minute === null || raw.minute === undefined ? 0 : int(raw.minute);
    if (hour === null || hour < 0 || hour > 23 || minute === null || minute < 0 || minute > 59) {
      return { ok: false, error: `${who}태어난 시간을 확인해 주세요.` };
    }
  }
  if (raw.calendar !== "solar" && raw.calendar !== "lunar") return { ok: false, error: `${who}양력/음력을 선택해 주세요.` };
  if (raw.gender !== "male" && raw.gender !== "female") return { ok: false, error: `${who}성별을 선택해 주세요.` };
  return { ok: true, value: { year, month, day, hour, minute, calendar: raw.calendar, isLeapMonth: raw.isLeapMonth === true, gender: raw.gender } };
}

/** 서버 입력 검사. 궁합이면 `partner`(상대방 생년월일시)도 같은 모양으로 받아요. */
export function validatePremiumInput(raw: unknown): ValidationResult {
  if (!isRecord(raw)) return { ok: false, error: "잘못된 요청입니다." };
  const me = parseBirth(raw, "");
  if (!me.ok) return me;
  let partner: BirthInput | null = null;
  if (raw.partner !== undefined && raw.partner !== null) {
    const p = parseBirth(raw.partner, "상대방의 ");
    if (!p.ok) return p;
    partner = p.value;
  }
  // level 을 안 보내면 기본(basic). 알 수 없는 값도 basic 으로 처리해요.
  const level: ReportLevel = raw.level === "full" ? "full" : "basic";
  return {
    ok: true,
    level,
    topic: typeof raw.topic === "string" ? raw.topic.slice(0, 40) : "",
    concern: parseConcern(raw.concern),
    value: me.value,
    partner,
  };
}

/** 상대방 사주를 계산해 두 사람의 궁합과 10페이지 궁합 리포트를 만들어요. 계산할 수 없는 입력이면 ssaju 의 Error 를 그대로 던져요. */
function computeCompat(meResult: BookSource, meHourUnknown: boolean, partner: BirthInput, now: Date, full: boolean, lock: boolean) {
  const pHourUnknown = partner.hour === null || partner.hour === undefined;
  const pr = calculateSaju({
    year: partner.year,
    month: partner.month,
    day: partner.day,
    hour: pHourUnknown ? undefined : (partner.hour as number),
    minute: pHourUnknown ? undefined : (partner.minute ?? 0),
    gender: partner.gender === "female" ? "여" : "남",
    calendar: partner.calendar,
    leap: partner.calendar === "lunar" && partner.isLeapMonth === true,
    now,
  }) as unknown as BookSource;
  const compat = buildCompat(meResult, pr, !meHourUnknown, !pHourUnknown);
  if (!full) return { compat, book: [] as BookPage[] };
  const book = buildCompatBook(meResult, pr, { compat, meHourKnown: !meHourUnknown, otherHourKnown: !pHourUnknown });
  return { compat, book: lock ? lockCompatBook(book, meResult.currentYear) : book };
}

/**
 * 생년월일시로 사주 리포트를 만들어요.
 * - level "basic": 원국·오행·신강신약 (일반 자판기)
 * - level "full": 위 + 격국·용신·길흉신·대운·세운·구조 설명 (프리미엄)
 * basic 일 때 나머지 값은 서버에서 비워서 내려보내요. (화면에서 숨기기만 하는 게 아니에요)
 * ssaju 는 순수 계산 라이브러리라 API 키도, 외부 호출도 없어요.
 * 잘못된 날짜(없는 음력 윤달 등)면 ssaju 가 던진 Error 를 그대로 던져요.
 */
export function buildPremiumReport(input: BirthInput, now: Date = new Date(), level: ReportLevel = "full", topicRaw: unknown = "", lock = false, concern: Concern | null = null, partner: BirthInput | null = null): PremiumReportView {
  const hourUnknown = input.hour === null || input.hour === undefined;
  const r = calculateSaju({
    year: input.year,
    month: input.month,
    day: input.day,
    // 시간을 모르면 ssaju 기본값(정오)로 계산하고, 화면에서는 시주를 비워요.
    hour: hourUnknown ? undefined : (input.hour as number),
    minute: hourUnknown ? undefined : (input.minute ?? 0),
    gender: input.gender === "female" ? "여" : "남",
    calendar: input.calendar,
    leap: input.calendar === "lunar" && input.isLeapMonth === true,
    now,
  });

  const pillars: PillarView[] = PILLARS.map(({ key, label }) => {
    if (key === "hour" && hourUnknown) return { key, label, full: null, reading: null, tenGodStem: null, tenGodBranch: null };
    const d = r.pillarDetails[key];
    return {
      key,
      label,
      full: r.pillars[key],
      reading: `${d.stemKo}${d.branchKo}`,
      tenGodStem: key === "day" ? "일간" : r.tenGods[key].stem,
      tenGodBranch: r.tenGods[key].branch,
    };
  });

  // 시간을 모르면 화면에 보이는 세 기둥(여섯 글자)만 세어서 보여줘요.
  const counts: Record<string, number> = {};
  if (hourUnknown) {
    for (const key of ["year", "month", "day"] as const) {
      const d = r.pillarDetails[key];
      counts[d.element.stem] = (counts[d.element.stem] ?? 0) + 1;
      counts[d.element.branch] = (counts[d.element.branch] ?? 0) + 1;
    }
  } else {
    Object.assign(counts, r.fiveElements);
  }
  const elements: ElementView[] = ELEMENTS.map(({ name, kind }) => ({ name, kind, count: counts[name] ?? 0 }));

  const cur = r.daeun.current;
  const daeun: DaeunView | null = r.daeun.list.length
    ? {
        startAge: r.daeun.startAge,
        direction: r.daeun.basis.direction === "forward" ? "순행" : "역행",
        list: r.daeun.list.map((d) => ({ age: d.startAge, ganzhi: d.ganzhi, current: cur !== null && d.startAge === cur.startAge })),
      }
    : null;

  const sy = r.seyun.find((s) => s.year === r.currentYear);
  const seyun: SeyunView | null = sy ? { year: sy.year, ganzhi: sy.ganzhi, tenGodStem: sy.tenGodStem, tenGodBranch: sy.tenGodBranch } : null;

  const full = level === "full";
  // 일반 자판기(주제 없음)에서 고민 버튼을 골랐으면, 첫 번째 고민과 가까운 주제로 맞춤 분석을 보여 줘요.
  const picked = resolveTopic(topicRaw);
  const firstChip = concern && concern.tags.length > 0 ? CONCERN_CHIPS.find((c) => c.id === concern.tags[0]) : undefined;
  const topicKey = picked === "general" && firstChip ? firstChip.topic : picked;
  const topic = buildTopicInsight(topicKey, r, { elements, hourUnknown, level });
  const locking = full && lock;
  // 궁합이면 10페이지 리포트도 두 사람 기준 궁합 리포트로 바꿔요.
  const pair = partner ? computeCompat(r as unknown as BookSource, hourUnknown, partner, now, full, locking) : null;
  const gradeLabel = GRADE[r.advanced.dayStrength.strength] ?? r.advanced.dayStrength.strength;
  return {
    level,
    pillars,
    elements,
    strength: { grade: GRADE[r.advanced.dayStrength.strength] ?? r.advanced.dayStrength.strength, score: r.advanced.dayStrength.score },
    geukguk: full ? r.advanced.geukguk : "",
    yongsin: full && !locking ? r.advanced.yongsin.map(withReading) : [],
    gilsin: full && !locking ? r.advanced.sinsal.gilsin : [],
    hyungsin: full && !locking ? r.advanced.sinsal.hyungsin : [],
    daeun: full ? daeun : null,
    seyun: full ? seyun : null,
    summary: full && !locking ? r.advanced.interpretation : "",
    hourUnknown,
    // 잠긴 상태에서는 흐름(timing) 문장도 내려보내지 않아요. (7쪽에서 잠긴 글과 같은 내용이에요)
    topic: locking ? { ...topic, timing: [] } : topic,
    concern: hasConcern(concern) ? { text: concern.text, answers: buildConcernAnswers(concern, elements, gradeLabel) } : null,
    locked: locking,
    compat: pair ? pair.compat : null,
    book: pair ? pair.book : full ? (locking ? applyLocks(buildBook(r, { elements, pillars, hourUnknown, topicKey, insight: topic, gradeLabel, now }), r.currentYear) : buildBook(r, { elements, pillars, hourUnknown, topicKey, insight: topic, gradeLabel, now })) : [],
  };
}
