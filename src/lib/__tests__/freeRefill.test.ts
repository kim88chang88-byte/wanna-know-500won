import { describe, expect, it } from "vitest";
import { checkRefill, formatClock, kstDayOf, msUntilKstMidnight } from "../freeRefill";

const at = (y: number, mo: number, d: number, h: number, mi = 0, s = 0) => Date.UTC(y, mo - 1, d, h, mi, s) - 9 * 3600 * 1000; // KST 시각 → 시각값

describe("다음 충전까지 시계", () => {
  it("KST 날짜", () => {
    expect(kstDayOf(at(2026, 11, 10, 0, 0, 1))).toBe("2026-11-10");
    expect(kstDayOf(at(2026, 11, 9, 23, 59, 59))).toBe("2026-11-09");
  });
  it("자정까지 남은 시간", () => {
    expect(formatClock(msUntilKstMidnight(at(2026, 11, 9, 16, 17, 50)))).toBe("07:42:10");
    expect(formatClock(msUntilKstMidnight(at(2026, 11, 10, 0, 0, 0)))).toBe("24:00:00");
    expect(formatClock(msUntilKstMidnight(at(2026, 11, 9, 23, 59, 59)))).toBe("00:00:01");
  });
  it("표시 모양", () => {
    expect(formatClock(0)).toBe("00:00:00");
    expect(formatClock(61_000)).toBe("00:01:01");
    expect(formatClock(500)).toBe("00:00:01");
  });
});

describe("충전 알림", () => {
  const prevOut = { day: "2026-11-09", out: true, tag: "u1" };
  it("어제 다 쓰고 오늘 다시 들어오면 한 번 보여준다", () => {
    const r = checkRefill(prevOut, "u1", "2026-11-10", false);
    expect(r.show).toBe(true);
    expect(r.next).toEqual({ day: "2026-11-10", out: false, tag: "u1" });
    // 다시 열어도 또 뜨지 않는다
    expect(checkRefill(r.next, "u1", "2026-11-10", false).show).toBe(false);
  });
  it("어제 안 썼거나 기록이 없거나 다른 회원이면 안 보여준다", () => {
    expect(checkRefill({ ...prevOut, out: false }, "u1", "2026-11-10", false).show).toBe(false);
    expect(checkRefill(null, "u1", "2026-11-10", false).show).toBe(false);
    expect(checkRefill(prevOut, "u2", "2026-11-10", false).show).toBe(false);
  });
  it("오늘 이미 다 쓴 상태로 들어오면 안 보여준다", () => {
    expect(checkRefill(prevOut, "u1", "2026-11-10", true).show).toBe(false);
  });
  it("같은 날에는 한 번 다 썼으면 계속 다 쓴 날로 기억한다", () => {
    const r = checkRefill({ day: "2026-11-10", out: true, tag: "u1" }, "u1", "2026-11-10", false);
    expect(r.next.out).toBe(true);
  });
  it("며칠 지나 들어와도 보여준다", () => {
    expect(checkRefill(prevOut, "u1", "2026-11-13", false).show).toBe(true);
  });
});
