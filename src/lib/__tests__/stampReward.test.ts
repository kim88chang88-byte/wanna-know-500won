import { describe, expect, it } from "vitest";
import { currentRun, grantTickets, readTickets, spendTicket, TICKET_KEY } from "../stampReward";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe("currentRun", () => {
  it("오늘까지 이어진 연속 일수와 시작일", () => {
    expect(currentRun(["2026-10-26", "2026-10-27", "2026-10-28"], "2026-10-28")).toEqual({ length: 3, start: "2026-10-26", stampedToday: true });
  });
  it("오늘 아직 안 찍었으면 어제까지 이어진 연속을 센다", () => {
    expect(currentRun(["2026-10-26", "2026-10-27"], "2026-10-28")).toEqual({ length: 2, start: "2026-10-26", stampedToday: false });
  });
  it("하루 건너뛰면 끊긴다(쉬어 가기 없음)", () => {
    expect(currentRun(["2026-10-24", "2026-10-26", "2026-10-27"], "2026-10-27").length).toBe(2);
    expect(currentRun(["2026-10-20"], "2026-10-28").length).toBe(0);
  });
});

describe("grantTickets / spendTicket", () => {
  it("3일 연속이면 1장, 같은 연속에서 다시 불러도 또 주지 않는다", () => {
    const s = mem();
    const days = ["2026-10-26", "2026-10-27", "2026-10-28"];
    expect(grantTickets(s, days, "2026-10-28")).toEqual({ earned: 1, balance: 1 });
    expect(grantTickets(s, days, "2026-10-28")).toEqual({ earned: 0, balance: 1 });
    expect(readTickets(s)).toBe(1);
  });
  it("2일만으로는 받지 못하고, 6일째에 한 장 더 받는다", () => {
    const s = mem();
    expect(grantTickets(s, ["2026-10-27", "2026-10-28"], "2026-10-28").earned).toBe(0);
    const six = ["2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28"];
    expect(grantTickets(s, six, "2026-10-28")).toEqual({ earned: 2, balance: 2 });
  });
  it("보너스 뽑기를 쓰면 줄어들고, 없으면 쓸 수 없다", () => {
    const s = mem();
    expect(spendTicket(s)).toEqual({ ok: false, balance: 0 });
    s.setItem(TICKET_KEY, JSON.stringify({ balance: 1, claimed: [] }));
    expect(spendTicket(s)).toEqual({ ok: true, balance: 0 });
    expect(spendTicket(s).ok).toBe(false);
  });
  it("저장소가 없어도 오류 없이 동작한다", () => {
    expect(grantTickets(null, ["2026-10-26", "2026-10-27", "2026-10-28"], "2026-10-28").earned).toBe(1);
    expect(readTickets(null)).toBe(0);
  });
});
