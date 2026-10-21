import { concernLabel, type ConcernId } from "./concerns";
import type { StorageLike } from "./drawCounter";

/*
 * 고민 후속 체크인. "지난번 이직 고민, 요즘은 어때요?" 하고 도리가 다시 물어봐요.
 * 이 기기(브라우저)에만 저장하고, 자유롭게 쓴 고민 글은 저장하지 않아요. 고른 항목의 이름만 기억해요.
 */

export const FOLLOWUP_KEY = "wanna500:followup:v1";
/** 며칠 뒤부터 물어볼지 / 며칠까지 물어볼지 */
export const ASK_AFTER_DAYS = 2;
export const ASK_UNTIL_DAYS = 45;

export interface Followup {
  day: string;
  tag: ConcernId;
  /** 이미 대답한 경우 대답한 날 */
  answered?: string;
}

const VALID = /^\d{4}-\d{2}-\d{2}$/;
const dayNum = (d: string): number => {
  const [y, m, dd] = d.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, dd) / 86_400_000);
};

export type Mood = "better" | "same" | "heavier";

export const MOODS: Array<{ id: Mood; label: string }> = [
  { id: "better", label: "나아졌어요" },
  { id: "same", label: "그대로예요" },
  { id: "heavier", label: "더 무거워졌어요" },
];

const REPLY: Record<Mood, string> = {
  better:
    "다행이에요! 마음이 가벼워진 데에는 분명 내가 해낸 작은 노력이 있었을 거예요. 이 흐름을 이어서, 오늘의 쪽지에서 또 하나 힌트를 가져가 볼까요?",
  same:
    "괜찮아요. 고민은 하루아침에 풀리지 않는 게 보통이에요. 그래도 마음에 두고 계속 살펴보고 있다는 것 자체가 이미 한 걸음이에요. 오늘의 쪽지에서 작은 힌트 하나만 가져가 볼까요?",
  heavier:
    "마음이 무거운 날이 이어지고 있군요. 도리가 곁에 있을게요. 혼자 감당하기 버거울 땐 가까운 사람이나 전문가와 이야기해 보는 것도 좋아요. 오늘은 물 한 잔 마시고 5분만 쉬어 가요 🫧",
};

export function followupReply(m: Mood): string {
  return REPLY[m];
}

export function followupQuestion(tag: ConcernId): string {
  return `지난번에 ‘${concernLabel(tag)}’ 고민을 적으셨죠? 요즘은 어때요?`;
}

/** 지금 물어볼 차례인지. 며칠 지났고, 아직 대답하지 않았고, 너무 오래되지 않았을 때만 true */
export function dueFollowup(f: Followup | null, today: string): boolean {
  if (!f || f.answered) return false;
  const gap = dayNum(today) - dayNum(f.day);
  return gap >= ASK_AFTER_DAYS && gap <= ASK_UNTIL_DAYS;
}

export function readFollowup(storage: StorageLike | null): Followup | null {
  if (!storage) return null;
  try {
    const v = JSON.parse(storage.getItem(FOLLOWUP_KEY) ?? "null") as Partial<Followup> | null;
    if (v && typeof v.day === "string" && VALID.test(v.day) && typeof v.tag === "string") {
      return { day: v.day, tag: v.tag as ConcernId, ...(typeof v.answered === "string" && VALID.test(v.answered) ? { answered: v.answered } : {}) };
    }
  } catch {
    /* 깨진 값은 없는 것으로 */
  }
  return null;
}

function write(storage: StorageLike | null, f: Followup | null): void {
  if (!storage) return;
  try {
    if (f) storage.setItem(FOLLOWUP_KEY, JSON.stringify(f));
    else (storage as Storage).removeItem?.(FOLLOWUP_KEY);
  } catch {
    /* 저장 실패는 무시 */
  }
}

/** 오늘 고른 고민 항목 중 첫 번째를 기억해요. (이미 오늘 저장한 게 있으면 그대로 둬요) */
export function rememberConcern(storage: StorageLike | null, tags: ConcernId[], today: string): void {
  if (tags.length === 0) return;
  const cur = readFollowup(storage);
  if (cur && !cur.answered && cur.day === today) return;
  write(storage, { day: today, tag: tags[0] });
}

export function answerFollowup(storage: StorageLike | null, today: string): void {
  const cur = readFollowup(storage);
  if (cur) write(storage, { ...cur, answered: today });
}

export function forgetFollowup(storage: StorageLike | null): void {
  write(storage, null);
}
