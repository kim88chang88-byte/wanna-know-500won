import { calculateSaju } from "ssaju";
import { STEMS } from "@/lib/saju/constants";
import type { BirthInput } from "@/lib/saju/types";
import type { DaeunView, ElementKind, ElementView, PillarView, PremiumReportView, SeyunView } from "./types";

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

export type ValidationResult = { ok: true; value: BirthInput } | { ok: false; error: string };

/** 서버 입력 검사. /api/reading 과 같은 BirthInput 모양을 받아요. */
export function validatePremiumInput(raw: unknown): ValidationResult {
  if (!isRecord(raw)) return { ok: false, error: "잘못된 요청입니다." };
  const int = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : null);
  const year = int(raw.year);
  const month = int(raw.month);
  const day = int(raw.day);
  if (year === null || year < 1900 || year > 2100) return { ok: false, error: "태어난 해를 1900~2100 사이로 입력해 주세요." };
  if (month === null || month < 1 || month > 12) return { ok: false, error: "태어난 달을 확인해 주세요." };
  if (day === null || day < 1 || day > 31) return { ok: false, error: "태어난 날을 확인해 주세요." };

  let hour: number | null = null;
  let minute: number | null = null;
  if (raw.hour !== null && raw.hour !== undefined) {
    hour = int(raw.hour);
    minute = raw.minute === null || raw.minute === undefined ? 0 : int(raw.minute);
    if (hour === null || hour < 0 || hour > 23 || minute === null || minute < 0 || minute > 59) {
      return { ok: false, error: "태어난 시간을 확인해 주세요." };
    }
  }
  if (raw.calendar !== "solar" && raw.calendar !== "lunar") return { ok: false, error: "양력/음력을 선택해 주세요." };
  if (raw.gender !== "male" && raw.gender !== "female") return { ok: false, error: "성별을 선택해 주세요." };
  return {
    ok: true,
    value: { year, month, day, hour, minute, calendar: raw.calendar, isLeapMonth: raw.isLeapMonth === true, gender: raw.gender },
  };
}

/**
 * 생년월일시로 프리미엄 리포트(원국·오행·신강신약·격국·용신·대운·세운)를 만들어요.
 * ssaju 는 순수 계산 라이브러리라 API 키도, 외부 호출도 없어요.
 * 잘못된 날짜(없는 음력 윤달 등)면 ssaju 가 던진 Error 를 그대로 던져요.
 */
export function buildPremiumReport(input: BirthInput, now: Date = new Date()): PremiumReportView {
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

  return {
    pillars,
    elements,
    strength: { grade: GRADE[r.advanced.dayStrength.strength] ?? r.advanced.dayStrength.strength, score: r.advanced.dayStrength.score },
    geukguk: r.advanced.geukguk,
    yongsin: r.advanced.yongsin.map(withReading),
    gilsin: r.advanced.sinsal.gilsin,
    hyungsin: r.advanced.sinsal.hyungsin,
    daeun,
    seyun,
    summary: r.advanced.interpretation,
    hourUnknown,
  };
}
