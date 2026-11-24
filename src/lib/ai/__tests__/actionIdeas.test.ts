import { describe, expect, it } from "vitest";
import { ACTION_POOL, actionIdeas } from "../actionIdeas";

describe("actionIdeas", () => {
  it("3개를 서로 다르게 골라요", () => {
    const r = actionIdeas("이번 주에 가볍게 해 볼 일은?", 0, 300);
    expect(r).toHaveLength(3);
    expect(new Set(r).size).toBe(3);
    r.forEach((x) => expect(ACTION_POOL).toContain(x));
  });
  it("같은 입력이면 같고, 질문이 다르면 달라져요", () => {
    expect(actionIdeas("A", 2, 10)).toEqual(actionIdeas("A", 2, 10));
    const seen = new Set<string>();
    for (const q of ["이직할까", "돈 모으는 법", "취미 추천", "친구와 싸웠어", "시험 걱정", "연애운"]) seen.add(actionIdeas(q, 0, 300).join("|"));
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
  it("이미 쓴 종류는 빼요", () => {
    const r = actionIdeas("아무거나", 0, 300, [/책|독서|읽/, /톡|연락|안부/]);
    r.forEach((x) => expect(/책|독서|읽|톡|연락|안부/.test(x)).toBe(false));
  });
  it("후보에 적어 보라는 항목은 없어요", () => {
    ACTION_POOL.forEach((x) => expect(/적어|적기|기록|메모|노트|쪽지|가계부|쓰기/.test(x)).toBe(false));
  });
  it("후보에 폰 끄고 산책하는 항목은 없어요", () => {
    ACTION_POOL.forEach((x) => expect(/산책|알림/.test(x)).toBe(false));
  });
});
