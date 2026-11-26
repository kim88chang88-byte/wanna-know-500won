import { describe, expect, it } from "vitest";
import { ACTION_POOL, LACK_ACTIONS, actionIdeas } from "../actionIdeas";

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
  it("일·돈·시험 같은 무거운 주제에는 집안 정돈·몸 돌봄 후보를 안 줘요", () => {
    const home = /환기|침구|핸드크림|디퓨저|일찍 자리에|스트레칭|음미|입기 편한|물 한 컵|메뉴|요리|배경화면|카페|귀가|치우기/;
    for (const q of ["올해 목숨 걸고 일할 해야?", "올해 승진할 가치가 있는 일일까?", "이 프로젝트가 사라졌으면 좋겠어", "투자해도 되는 시기야?", "이직할 가치가 있을까?"]) {
      for (let turn = 0; turn < 6; turn++) {
        const r = actionIdeas(q, turn, 100 + turn * 37);
        expect(r).toHaveLength(3);
        r.forEach((i) => expect(home.test(i), `${q} → ${i}`).toBe(false));
      }
    }
  });
  it("부족한 기운이 있으면 그 기운을 채우는 행동 2개가 먼저 와요", () => {
    const r = actionIdeas("요즘 피곤해", 0, 100, [], "water");
    expect(r).toHaveLength(3);
    expect(r.filter((x) => LACK_ACTIONS.water.includes(x))).toHaveLength(2);
  });
  it("식상한 집안 정돈·침구·저녁 메뉴 후보는 없어요", () => {
    ACTION_POOL.forEach((x) => expect(/침구|환기|책상 위 물건|저녁 메뉴|음미/.test(x)).toBe(false));
  });
});
