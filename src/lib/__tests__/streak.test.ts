import { describe, expect, it } from "vitest";
import { computeStreak, recordVisit, streakLine, STREAK_KEY } from "../streak";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe("연속 방문 물길", () => {
  it("방문이 없으면 0", () => {
    expect(computeStreak([], "2026-10-21").count).toBe(0);
  });
  it("연달아 오면 늘어난다", () => {
    const s = computeStreak(["2026-10-19", "2026-10-20", "2026-10-21"], "2026-10-21");
    expect(s.count).toBe(3);
    expect(s.doneToday).toBe(true);
    expect(s.best).toBe(3);
  });
  it("어제까지 왔고 오늘은 아직이면 이어져 있다", () => {
    const s = computeStreak(["2026-10-19", "2026-10-20"], "2026-10-21");
    expect(s.count).toBe(2);
    expect(s.doneToday).toBe(false);
  });
  it("하루 쉬어 가도 이어진다 (7일에 한 번)", () => {
    const s = computeStreak(["2026-10-17", "2026-10-18", "2026-10-20"], "2026-10-20");
    expect(s.count).toBe(3);
    expect(s.restUsed).toBe(true);
  });
  it("쉬어 가기를 7일 안에 두 번 쓰면 끊긴다", () => {
    const s = computeStreak(["2026-10-10", "2026-10-12", "2026-10-14"], "2026-10-14");
    expect(s.count).toBe(1);
    expect(s.best).toBe(2);
  });
  it("이틀 이상 비면 끊기지만 최고 기록은 남는다", () => {
    const s = computeStreak(["2026-10-01", "2026-10-02", "2026-10-03"], "2026-10-10");
    expect(s.count).toBe(0);
    expect(s.best).toBe(3);
  });
  it("그저께 마지막으로 왔고 쉬어 가기가 남았으면 쉬는 중으로 본다", () => {
    const s = computeStreak(["2026-10-18", "2026-10-19"], "2026-10-21");
    expect(s.count).toBe(2);
    expect(s.resting).toBe(true);
  });
  it("깨진 날짜와 미래 날짜는 무시한다", () => {
    expect(computeStreak(["abc", "2026-10-30", "2026-10-21"], "2026-10-21").count).toBe(1);
  });
  it("저장소에 기록하고 같은 날 두 번 와도 한 번만 센다", () => {
    const st = mem();
    recordVisit(st, "2026-10-20");
    recordVisit(st, "2026-10-21");
    const s = recordVisit(st, "2026-10-21");
    expect(s.count).toBe(2);
    expect(JSON.parse(st.getItem(STREAK_KEY)!).days.length).toBe(2);
    expect(recordVisit(null, "2026-10-21").count).toBe(1);
  });
  it("문구는 부담을 주지 않는다", () => {
    expect(streakLine(computeStreak(["2026-10-20"], "2026-10-21"))).toContain("괜찮아요");
    expect(streakLine(computeStreak([], "2026-10-21"))).toBeNull();
    const seven = Array.from({ length: 7 }, (_, i) => `2026-10-${String(15 + i).padStart(2, "0")}`);
    expect(streakLine(computeStreak(seven, "2026-10-21"))).toContain("7일 연속");
  });
});
