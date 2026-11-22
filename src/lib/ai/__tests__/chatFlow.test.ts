import { describe, expect, it } from "vitest";
import { CRISIS_ANSWER, isCrisis } from "../chat";
import { GREETING_NUDGE, GREETING_REPLIES, greetingReply, isFirstAsk, isGreeting, withoutCrisisTurns } from "../chatFlow";

const u = (text: string) => ({ role: "user" as const, text });
const d = (text: string) => ({ role: "dori" as const, text });

describe("인사만 보낸 말", () => {
  it("짧은 인사는 인사로 본다", () => {
    for (const t of ["안녕", "안녕?", "하이", "하이~", "ㅎㅇ", "hi", "Hello!", "반가워", "안녕하세요", "도리야 안녕", "안뇽ㅎㅎ"]) {
      expect(isGreeting(t)).toBe(true);
    }
  });
  it("질문이 붙었거나 작별로 쓰일 수 있는 말은 인사로 보지 않는다", () => {
    for (const t of ["안녕 내 올해 운 어때?", "안녕히 계세요", "안녕히 가세요", "하이 이직운 알려줘", "올해 이직운 어때?", "", "도리야 나 힘들어"]) {
      expect(isGreeting(t)).toBe(false);
    }
  });
  it("인사에는 정해 둔 답, 3번째부터는 질문을 청한다", () => {
    expect(GREETING_REPLIES).toContain(greetingReply([u("하이")]) ?? "");
    expect(greetingReply([u("안녕"), d(GREETING_REPLIES[0]), u("하이")])).not.toBeNull();
    expect(greetingReply([u("안녕"), d(GREETING_REPLIES[0]), u("하이"), d(GREETING_REPLIES[1]), u("ㅎㅇ")])).toBe(GREETING_NUDGE);
    expect(greetingReply([u("올해 이직운 어때?")])).toBeNull();
  });
  it("위기 말은 인사로 걸러지지 않고, 인사 답에는 위기 판정도 걸리지 않는다", () => {
    expect(isGreeting("죽고 싶어")).toBe(false);
    for (const t of [...GREETING_REPLIES, GREETING_NUDGE]) expect(isCrisis(t)).toBe(false);
  });
});

describe("첫 질문 판단", () => {
  it("인사·안내·위로(🤍) 답만 있으면 아직 첫 질문이다", () => {
    expect(isFirstAsk([u("안녕")])).toBe(true);
    expect(isFirstAsk([u("안녕"), d(GREETING_REPLIES[0]), u("올해 운은?")])).toBe(true);
    expect(isFirstAsk([u("살 의미가 없어"), d(CRISIS_ANSWER), u("올해 운은?")])).toBe(true);
    expect(isFirstAsk([u("지쳤어"), d("🤍 많이 지쳤구나."), u("올해 운은?")])).toBe(true);
  });
  it("풀이 답이 있으면 첫 질문이 아니다", () => {
    expect(isFirstAsk([u("올해 운은?"), d("올해는 차분한 흐름이야."), u("그럼 이직은?")])).toBe(false);
  });
});

describe("AI 에게 보낼 기록", () => {
  it("안내 주고받음을 빼고 마지막 말은 그대로 둔다", () => {
    const h = [u("올해 운은?"), d("차분한 흐름이야."), u("살 의미가 없어"), d(CRISIS_ANSWER), u("이직운 어때?")];
    expect(withoutCrisisTurns(h)).toEqual([u("올해 운은?"), d("차분한 흐름이야."), u("이직운 어때?")]);
  });
  it("안내가 없으면 그대로", () => {
    const h = [u("올해 운은?"), d("차분한 흐름이야."), u("이직운 어때?")];
    expect(withoutCrisisTurns(h)).toEqual(h);
  });
});
