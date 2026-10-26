import { parseProfileRow, sameBirth, type SavedProfile } from "@/lib/profile";

/** 로그인한 회원이 동의하고 기억해 둔 다른 사람(궁합 상대 등). 생년월일시는 별명과 함께 저장돼요. */
export const MAX_PEOPLE = 10;
export const MAX_LABEL = 20;

export interface SavedPerson {
  id: string;
  label: string;
  birth: SavedProfile;
}

/** 별명 다듬기: 공백 정리 + 20자. 비면 null */
export function cleanLabel(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_LABEL);
  return s.length > 0 ? s : null;
}

/** DB 행을 SavedPerson 으로. 이상하면 null */
export function parsePersonRow(row: unknown): SavedPerson | null {
  if (typeof row !== "object" || row === null) return null;
  const r = row as Record<string, unknown>;
  const label = cleanLabel(r.label);
  const birth = parseProfileRow(row);
  if (typeof r.id !== "string" || !label || !birth) return null;
  return { id: r.id, label, birth };
}

/** 요청 본문 검사: { label, birth } → 다듬은 값. 이상하면 null */
export function parsePersonBody(body: unknown): { label: string; birth: SavedProfile } | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const label = cleanLabel(b.label);
  const birth = parseProfileRow(b.birth);
  if (!label || !birth) return null;
  const y = birth.year;
  if (y < 1900 || y > 2100 || birth.month < 1 || birth.month > 12 || birth.day < 1 || birth.day > 31) return null;
  return { label, birth };
}

export function samePerson(a: SavedPerson, birth: SavedProfile): boolean {
  return sameBirth(a.birth, birth);
}
