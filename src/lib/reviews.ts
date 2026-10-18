/** 사용후기: 별점(필수) + 아쉬운 점 칩(낮은 별점일 때, 선택) + 한 줄 후기(선택). 화면·서버가 같은 규칙을 써요. */

export type ReviewReasonId = "wrong" | "long" | "hard" | "slow" | "price";

export const REVIEW_REASONS: ReadonlyArray<{ id: ReviewReasonId; label: string }> = [
  { id: "wrong", label: "풀이가 나랑 안 맞아요" },
  { id: "long", label: "내용이 너무 길어요" },
  { id: "hard", label: "화면·입력이 불편해요" },
  { id: "slow", label: "너무 느려요" },
  { id: "price", label: "가격이 아까워요" },
];

export const MAX_REVIEW_TEXT = 200;
export const MAX_REVIEW_REASONS = 3;
/** 이 점수 이하면 "아쉬운 점"을 물어봐요 */
export const LOW_RATING = 3;

export interface ReviewInput {
  rating: number;
  text: string;
  reasons: ReviewReasonId[];
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
  return { rating, text, reasons };
}
