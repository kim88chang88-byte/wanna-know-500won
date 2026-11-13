/** 사용후기: 별점(필수) + 아쉬운 점 칩(낮은 별점일 때, 선택) + 한 줄 후기(선택). 화면·서버가 같은 규칙을 써요. */

export type ReviewReasonId = "wrong" | "long" | "hard" | "slow" | "price";

export const REVIEW_REASONS: ReadonlyArray<{ id: ReviewReasonId; label: string }> = [
  { id: "wrong", label: "풀이가 나랑 안 맞아" },
  { id: "long", label: "내용이 너무 길어" },
  { id: "hard", label: "화면·입력이 불편해" },
  { id: "slow", label: "너무 느려" },
  { id: "price", label: "가격이 아까워" },
];

export const MAX_REVIEW_TEXT = 200;
export const MAX_REVIEW_REASONS = 3;
/** 이 점수 이하면 "아쉬운 점"을 물어봐요 */
export const LOW_RATING = 3;

export interface ReviewInput {
  rating: number;
  text: string;
  reasons: ReviewReasonId[];
  /** 가린 닉네임과 함께 메인 화면에 보여 줘도 좋다고 직접 고른 경우만 true (한 줄 후기가 있을 때만 의미가 있어요) */
  publicOk?: boolean;
}

const REASON_IDS = new Set<string>(REVIEW_REASONS.map((r) => r.id));

export function reasonLabel(id: string): string {
  return REVIEW_REASONS.find((r) => r.id === id)?.label ?? id;
}

/** 제어문자·여러 줄을 정리하고 200자로 잘라요. */
export function cleanReviewText(v: string): string {
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_REVIEW_TEXT);
}

/** 서버 입력 검사. 별점이 1~5 정수가 아니면 null. 모르는 칩은 버려요. */
export function parseReview(raw: unknown): ReviewInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const rating = o.rating;
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  const reasons: ReviewReasonId[] = [];
  if (rating <= LOW_RATING && Array.isArray(o.reasons)) {
    for (const r of o.reasons) {
      if (typeof r === "string" && REASON_IDS.has(r) && !reasons.includes(r as ReviewReasonId)) reasons.push(r as ReviewReasonId);
      if (reasons.length >= MAX_REVIEW_REASONS) break;
    }
  }
  const text = typeof o.text === "string" ? cleanReviewText(o.text) : "";
  const publicOk = o.publicOk === true && text.length > 0;
  return { rating, text, reasons, ...(publicOk ? { publicOk: true } : {}) };
}

/** 메인에 보여 줄 후기 기준: 별점이 이 점수 이상인 것만 */
export const PUBLIC_MIN_RATING = 4;

/** 닉네임을 가려요: 첫 글자만 남기고 나머지는 O (장은혁 → 장OO). 공백은 빼고 세고, O 는 최대 6개예요. 닉네임이 없으면 null */
export function maskNickname(nick: string | null | undefined): string | null {
  const chars = Array.from((nick ?? "").replace(/\s+/g, ""));
  if (chars.length === 0) return null;
  return chars[0] + "O".repeat(Math.max(1, Math.min(6, chars.length - 1)));
}
