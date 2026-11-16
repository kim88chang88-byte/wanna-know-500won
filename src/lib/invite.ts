/*
 * 궁합 초대 링크의 공용 규칙이에요. 서버와 브라우저가 같이 써요.
 * 링크 주소의 토큰은 서버가 만든 추측 불가능한 긴 값이고, 상대가 넣은 생년월일시는 이 모양(BirthFields)만 받아요.
 */
import { buildBirthFields, EMPTY_BIRTH, type BirthFields } from "@/lib/intake";
import { isBirthPlace } from "@/lib/saju/birthPlace";

export const INVITE_RELATIONS = ["lover", "some", "friend", "work", "family"] as const;
export type InviteRelation = (typeof INVITE_RELATIONS)[number];

export const RELATION_LABEL: Record<InviteRelation, string> = {
  lover: "연인",
  some: "썸",
  friend: "친구",
  work: "직장 동료",
  family: "가족",
};

export type InviteStatus = "pending" | "filled" | "done";

export const INVITE_TOKEN = /^[A-Za-z0-9_-]{32,64}$/;
export const INVITE_NAME_MAX = 20;

export function cleanInviteToken(raw: unknown): string | null {
  return typeof raw === "string" && INVITE_TOKEN.test(raw) ? raw : null;
}

export function isInviteRelation(v: unknown): v is InviteRelation {
  return typeof v === "string" && (INVITE_RELATIONS as readonly string[]).includes(v);
}

/** 호칭(선택): 제어문자·여러 칸 공백을 정리하고 20자까지만. 비면 null */
export function cleanInviteName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, INVITE_NAME_MAX);
  return s || null;
}

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.slice(0, max) : "");

/**
 * 상대가 보낸 값을 허용한 칸만 골라 BirthFields 로 다듬어요. 날짜·시간·성별이 올바르지 않으면 null.
 * (모르는 칸은 버리고, 출생지는 목록에 있는 값만 받아요)
 */
export function parseInviteBirth(raw: unknown): BirthFields | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const gender = r.gender === "male" || r.gender === "female" ? r.gender : null;
  const fields: BirthFields = {
    ...EMPTY_BIRTH,
    calendar: r.calendar === "lunar" ? "lunar" : "solar",
    solarDate: str(r.solarDate, 10),
    lunarYear: str(r.lunarYear, 4),
    lunarMonth: str(r.lunarMonth, 2),
    lunarDay: str(r.lunarDay, 2),
    isLeapMonth: r.isLeapMonth === true,
    timeKnown: r.timeKnown !== false,
    time: str(r.time, 5),
    birthPlace: isBirthPlace(r.birthPlace) ? r.birthPlace : "",
    lateZi: r.lateZi === "nextDay" ? "nextDay" : "sameDay",
    gender,
  };
  return buildBirthFields(fields) ? fields : null;
}

/** 초대 링크 주소. 받는 사람이 가입하면 보상이 이어지게, 내 추천 코드를 붙일 수 있어요. */
export function inviteUrl(origin: string, token: string, refCode: string | null = null): string {
  const base = `${origin.replace(/\/+$/, "")}/invite/${token}`;
  return refCode ? `${base}?ref=${encodeURIComponent(refCode)}` : base;
}

/** 서버가 돌려준 결과를 쉬운 말로 바꿔요. */
export function createMessage(result: string): string {
  switch (result) {
    case "limit_day":
      return "오늘은 초대 링크를 5개까지 만들 수 있어. 내일 다시 만들어 줘.";
    case "limit_pending":
      return "아직 답이 없는 초대가 10개야. 먼저 받은 링크의 답을 기다리거나 확인해 줘.";
    default:
      return "링크를 만들지 못했어. 잠시 뒤에 다시 시도해 줘.";
  }
}
