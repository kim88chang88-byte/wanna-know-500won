import { cleanReviewText } from "./reviews";

/*
 * 정성 후기 보상: 후기를 남기면 500원 뽑기 코인 1장을 바로 선물해요.
 * 보상은 별점이나 칭찬 여부와 상관없이, 정성껏 쓴 후기에 줘요. (낮은 별점도 똑같이 받아요)
 * 복붙·의미 없는 반복은 걸러내고, 한 사람이 한 달에 받을 수 있는 횟수도 정해 둬요.
 */

export const REWARD_MIN_CHARS = 40;
export const REWARD_MONTH_CAP = 2;
export const REWARD_KIND = "review";

/** 정성 후기로 인정하는 글인지 (길이, 서로 다른 글자 수, 같은 조각의 반복) */
export function isRewardableText(raw: string): boolean {
  const t = cleanReviewText(raw);
  if (Array.from(t).length < REWARD_MIN_CHARS) return false;
  const compact = t.replace(/\s+/g, "");
  if (new Set(Array.from(compact)).size < 10) return false;
  if (/(.{2,6})\1{3,}/u.test(compact)) return false;
  return true;
}

/** 같은 글로 두 번 받지 못하게 하는 값 (공백·대소문자를 무시한 글의 지문) */
export function rewardRef(raw: string, hash: (s: string) => string): string {
  return hash(cleanReviewText(raw).replace(/\s+/g, "").toLowerCase()).slice(0, 20);
}

export type RewardResult = "granted" | "cap" | "dup" | "short" | "none";
