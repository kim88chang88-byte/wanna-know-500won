import { describe, expect, it } from "vitest";
import { LOVE_Q, loveFacts } from "../loveFacts";
import { unableReply } from "../outOfScope";
import { CHAT_SYSTEM_PROMPT } from "../chat";

const chart = { year: { stem: "甲", branch: "子" }, month: { stem: "戊", branch: "辰" }, day: { stem: "壬", branch: "午" }, hour: null, solarDate: { year: 1994, month: 3, day: 10 }, uncertainPillars: [] } as never;

describe("연애 재료와 상담실 규칙", () => {
  it("연애 질문만 잡아요", () => {
    expect(LOVE_Q.test("전남친이 연락 왔어")).toBe(true);
    expect(LOVE_Q.test("오늘 점심 뭐 먹지")).toBe(false);
  });
  it("배우자 자리와 올해·내년 세운 관계를 줘요", () => {
    const f = loveFacts(chart, new Date("2026-11-16T12:00:00+09:00"));
    expect(String(f.배우자자리)).toContain("午");
    expect(String(f.올해세운과배우자자리)).toContain("2026년 午");
    expect(String(f.내년세운과배우자자리)).toContain("2027년 未");
    expect(f.올해남은기간).toMatch(/약 \d+주/);
  });
  it("사전 차단 문구의 조사와 키워드가 맞아요", () => {
    expect(unableReply("홍대 근처 분위기 좋은 맛집 알려줘")?.answer).toContain("'홍대 맛집'으로");
    expect(unableReply("예약 가능한 레스토랑 알려줘")?.answer).toContain("'레스토랑'으로");
  });
  it("로맨스 스캠·판단형 규칙이 프롬프트에 있어요", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("1332");
    expect(CHAT_SYSTEM_PROMPT).toContain("연애 판단형");
  });
});
