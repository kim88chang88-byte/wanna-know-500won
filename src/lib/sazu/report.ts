import type { ElementKind, ElementView, ManseReportView, PillarView, SazuFormInput, StrengthView } from "./types";

const PILLARS: { key: PillarView["key"]; label: string }[] = [
  { key: "year", label: "연주" },
  { key: "month", label: "월주" },
  { key: "day", label: "일주" },
  { key: "hour", label: "시주" },
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function elementKind(name: string): ElementKind {
  if (/목|木|wood/i.test(name)) return "wood";
  if (/화|火|fire/i.test(name)) return "fire";
  if (/토|土|earth/i.test(name)) return "earth";
  if (/금|金|metal/i.test(name)) return "metal";
  if (/수|水|water/i.test(name)) return "water";
  return "unknown";
}

const ELEMENT_ORDER: ElementKind[] = ["wood", "fire", "earth", "metal", "water"];

/**
 * SAZU 만세력 응답에서 화면에 필요한 부분만 꺼내요. (문서 기준)
 *  - 원국:   modules.fourPillars.{year|month|day|hour}.full
 *  - 오행:   modules.elements 의 각 항목 { name, total: { count } }
 *  - 신강약: modules.sinStrength.{ strength, analysis }
 * SDK 가 `result.modules` 로 주든 `result.data.modules` 로 주든 둘 다 받아요.
 * 모양이 달라도 화면이 깨지지 않게, 읽을 수 없는 값은 비워 둬요.
 */
export function parseManseResult(result: unknown): ManseReportView {
  const root = isRecord(result) ? result : {};
  const modules = isRecord(root.modules) ? root.modules : isRecord(root.data) && isRecord(root.data.modules) ? root.data.modules : {};

  const fp = isRecord(modules.fourPillars) ? modules.fourPillars : {};
  const pillars: PillarView[] = PILLARS.map(({ key, label }) => {
    const p = fp[key];
    return { key, label, full: isRecord(p) ? str(p.full) : null };
  });

  const el = isRecord(modules.elements) ? modules.elements : {};
  const elements: ElementView[] = Object.values(el)
    .filter(isRecord)
    .map((e) => {
      const name = str(e.name) ?? "";
      const total = isRecord(e.total) ? e.total : {};
      const count = typeof total.count === "number" && Number.isFinite(total.count) ? total.count : 0;
      return { name, count, kind: elementKind(name) };
    })
    .filter((e) => e.name)
    .sort((a, b) => ELEMENT_ORDER.indexOf(a.kind) - ELEMENT_ORDER.indexOf(b.kind));

  const ss = isRecord(modules.sinStrength) ? modules.sinStrength : null;
  const grade = ss ? str(ss.strength) : null;
  const strength: StrengthView | null = ss && grade ? { grade, analysis: str(ss.analysis) ?? "" } : null;

  return { pillars, elements, strength };
}

/** 서버 입력 검사. 문제가 있으면 사용자에게 보여 줄 문장을 돌려줘요. */
export function validateSazuInput(raw: unknown): { ok: true; value: SazuFormInput } | { ok: false; error: string } {
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
  if (typeof raw.isFemale !== "boolean" || typeof raw.isLunar !== "boolean") return { ok: false, error: "성별과 음양력을 선택해 주세요." };
  const city = typeof raw.city === "string" ? raw.city.trim() : "";
  if (!city || city.length > 20) return { ok: false, error: "출생 도시를 입력해 주세요." };

  return { ok: true, value: { year, month, day, hour, minute, isFemale: raw.isFemale, isLunar: raw.isLunar, city } };
}
