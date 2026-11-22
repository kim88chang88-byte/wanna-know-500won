import { CRISIS_ANSWER } from "./chat";

/**
 * 상담방 대화 흐름 도우미 (AI 를 부르지 않는 가벼운 판단들)
 * - 인사만 보낸 말은 정해 둔 답으로 받고 질문을 쓰지 않아요.
 * - 첫 질문 판단에서 인사·위로·안내 답은 "첫 풀이"로 세지 않아요.
 * - 안내(위기) 대화는 AI 에게 넘기지 않아요. 평범한 다음 질문이 지친 사람 말투로 이어지지 않게요.
 */

interface Turn {
  role: "user" | "dori";
  text: string;
}

// "안녕히 계세요"처럼 작별로 쓰일 수 있는 말은 인사로 보지 않아요(뒤에 글자가 더 붙으면 거름).
const GREETING = /^(도리야?\s?)?(안녕(하세요|하십니까)?|안뇽|하이|하잉|헬로우?|hi|hello|hey|ㅎㅇ(ㅎㅇ)?|반가워|반갑다|반갑습니다)[\s!?~.,ㅎㅋ…^]*$/i;

export function isGreeting(text: string): boolean {
  const t = text.trim();
  return t.length > 0 && t.length <= 16 && GREETING.test(t);
}

export const GREETING_REPLIES = [
  "안녕! 반가워 ❄️ 궁금한 거 있으면 편하게 물어봐.",
  "어서 와! 오늘은 어떤 게 궁금해? ✨",
  "하이! 도리 여기 있어 🌙 편하게 말 걸어 줘.",
  "반가워! 마음에 걸리는 거 하나만 던져 줘 ❄️",
];

export const GREETING_NUDGE = "인사 고마워! 이제 궁금한 걸 하나 물어봐 줘. 도리가 사주로 같이 봐 줄게 ❄️";

const GREETING_TEXTS = new Set([...GREETING_REPLIES, GREETING_NUDGE]);

/** 인사만 보냈으면 정해 둔 답을 돌려줘요(아니면 null). 같은 방에서 인사만 계속 보내면 질문을 청해요. */
export function greetingReply(history: Turn[]): string | null {
  const last = history[history.length - 1];
  if (!last || last.role !== "user" || !isGreeting(last.text)) return null;
  const users = history.filter((m) => m.role === "user");
  const greetings = users.filter((m) => isGreeting(m.text)).length;
  if (greetings >= 3) return GREETING_NUDGE;
  return GREETING_REPLIES[(users.length - 1) % GREETING_REPLIES.length];
}

/** 이 방에서 풀이 답을 처음 받는 질문인지 (인사·안내·위로(🤍) 답은 풀이로 세지 않아요 → 첫 질문에는 도리 메모가 붙어요) */
export function isFirstAsk(history: Turn[]): boolean {
  return !history.some((m) => m.role === "dori" && !GREETING_TEXTS.has(m.text) && m.text !== CRISIS_ANSWER && !m.text.trimStart().startsWith("🤍"));
}

/** AI 에게 보낼 기록에서 안내(위기) 주고받음을 빼요. 마지막 사용자 말은 그대로 둬요. */
export function withoutCrisisTurns(history: Turn[]): Turn[] {
  const out: Turn[] = [];
  for (let i = 0; i < history.length; i++) {
    const next = history[i + 1];
    if (history[i].role === "user" && next && next.role === "dori" && next.text === CRISIS_ANSWER) {
      i += 1;
      continue;
    }
    out.push(history[i]);
  }
  return out.length > 0 && out[out.length - 1].role === "user" ? out : history;
}
