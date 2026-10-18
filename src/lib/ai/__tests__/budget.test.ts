import { beforeEach, describe, it, expect } from "vitest";
import { DEFAULT_AI_DAILY_CAP, isAiDisabled, parseAiDailyCap, resetMemoryBudget, takeAiBudget } from "../budget";

const D1 = new Date("2026-10-18T03:00:00Z");
const D2 = new Date("2026-10-19T03:00:00Z");

describe("AI 비용 방어", () => {
  beforeEach(() => resetMemoryBudget());

  it("AI_DISABLED 는 true/1 일 때만 켜져요", () => {
    expect(isAiDisabled({})).toBe(false);
    expect(isAiDisabled({ AI_DISABLED: "false" })).toBe(false);
    expect(isAiDisabled({ AI_DISABLED: " TRUE " })).toBe(true);
    expect(isAiDisabled({ AI_DISABLED: "1" })).toBe(true);
  });

  it("AI_DAILY_CAP: 비었거나 이상하면 기본값, 0 은 0", () => {
    expect(parseAiDailyCap({})).toBe(DEFAULT_AI_DAILY_CAP);
    expect(parseAiDailyCap({ AI_DAILY_CAP: "abc" })).toBe(DEFAULT_AI_DAILY_CAP);
    expect(parseAiDailyCap({ AI_DAILY_CAP: "-5" })).toBe(DEFAULT_AI_DAILY_CAP);
    expect(parseAiDailyCap({ AI_DAILY_CAP: "1.5" })).toBe(DEFAULT_AI_DAILY_CAP);
    expect(parseAiDailyCap({ AI_DAILY_CAP: " 50 " })).toBe(50);
    expect(parseAiDailyCap({ AI_DAILY_CAP: "0" })).toBe(0);
  });

  it("비상 차단과 한도 0 은 DB 를 부르지 않고 막아요", async () => {
    let called = 0;
    const db = { takeAiBudget: async () => (called++, true) };
    expect(await takeAiBudget({ AI_DISABLED: "true" }, db, D1)).toBe("disabled");
    expect(await takeAiBudget({ AI_DAILY_CAP: "0" }, db, D1)).toBe("cap");
    expect(called).toBe(0);
  });

  it("DB 가 허락하면 ok, 한도면 cap (한국 날짜와 한도를 넘겨요)", async () => {
    const seen: Array<[string, number]> = [];
    let allow = true;
    const db = { takeAiBudget: async (day: string, cap: number) => (seen.push([day, cap]), allow) };
    expect(await takeAiBudget({ AI_DAILY_CAP: "10" }, db, D1)).toBe("ok");
    allow = false;
    expect(await takeAiBudget({ AI_DAILY_CAP: "10" }, db, D1)).toBe("cap");
    expect(seen[0]).toEqual(["2026-10-18", 10]);
  });

  it("DB 가 없거나 오류면 메모리 카운터로 한도를 지켜요 (무제한이 되지 않아요)", async () => {
    const env = { AI_DAILY_CAP: "2" };
    expect(await takeAiBudget(env, null, D1)).toBe("ok");
    expect(await takeAiBudget(env, null, D1)).toBe("ok");
    expect(await takeAiBudget(env, null, D1)).toBe("cap");
    expect(await takeAiBudget(env, null, D2)).toBe("ok"); // 다음 날은 다시 열려요

    resetMemoryBudget();
    const broken = { takeAiBudget: async () => { throw new Error("down"); } };
    expect(await takeAiBudget(env, broken, D1)).toBe("ok");
    expect(await takeAiBudget(env, broken, D1)).toBe("ok");
    expect(await takeAiBudget(env, broken, D1)).toBe("cap");
  });
});
