import { describe, expect, it } from "vitest";
import { MONEY_Q, moneyFacts } from "../moneyFacts";
import { CHAT_SYSTEM_PROMPT } from "../chat";
import { LOVE_Q } from "../loveFacts";

const chart = {
  year: { stem: "庚", branch: "午" },
  month: { stem: "戊", branch: "戌" },
  day: { stem: "丙", branch: "寅" },
  hour: { stem: "甲", branch: "午" },
} as never;

describe("재물 재료", () => {
  it("돈 질문만 잡고, 연애 질문은 잡지 않는다", () => {
    for (const q of ["월급이 통장을 스쳐 지나가", "부업 뭐가 좋아?", "친구가 돈 빌려달래", "빚 언제 갚아?", "내 사주에 편재가 있다던데"]) expect(MONEY_Q.test(q)).toBe(true);
    expect(MONEY_Q.test("그 사람이 연락을 안 해")).toBe(false);
    expect(LOVE_Q.test("친구가 돈 빌려달래")).toBe(false);
  });

  it("재성·식상·비겁과 올해·내년 세운 십성을 계산해 준다", () => {
    const f = moneyFacts(chart, new Date("2026-11-20T12:00:00+09:00")) as Record<string, string>;
    expect(f.일간).toContain("병");
    // 병화(火) 일간이 극하는 오행은 金: 재성
    expect(f.재성).toContain("쇠 기운");
    expect(f.돈을만드는힘).toContain("땅 기운");
    expect(f.재성이드러난자리).toContain("연주 천간 편재");
    expect(f.올해세운).toContain("2026년");
    expect(f.내년세운).toContain("2027년");
    expect(f.올해세운).not.toContain("올해 분위기");
  });

  it("프롬프트는 고정비·메모장·재물 달력을 기본 처방으로 박아 두지 않는다", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("기본 행동이 아니야");
    expect(CHAT_SYSTEM_PROMPT).toContain("재물재료");
  });
});
