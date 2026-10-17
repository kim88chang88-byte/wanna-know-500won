import { describe, it, expect } from "vitest";
import { kstDay, kstMonthRange } from "../kst";
import { createDb, DbError, loadDbConfig } from "../supabase";
import { isDailyLimitEnforced } from "../config";

describe("kst", () => {
  it("한국 시간 0시에 하루가 바뀌어요", () => {
    expect(kstDay(new Date("2026-10-16T14:59:59Z"))).toBe("2026-10-16");
    expect(kstDay(new Date("2026-10-16T15:00:00Z"))).toBe("2026-10-17");
  });
  it("달 범위(12월→다음 해 1월 포함)", () => {
    expect(kstMonthRange(new Date("2026-10-17T00:00:00Z"))).toEqual({ start: "2026-10-01", next: "2026-11-01" });
    expect(kstMonthRange(new Date("2026-12-20T00:00:00Z"))).toEqual({ start: "2026-12-01", next: "2027-01-01" });
    // UTC 로는 11월 30일이지만 한국 시간으론 12월 1일
    expect(kstMonthRange(new Date("2026-11-30T16:00:00Z"))).toEqual({ start: "2026-12-01", next: "2027-01-01" });
  });
});

describe("loadDbConfig", () => {
  it("둘 다 있어야 하고 https 여야 해요", () => {
    expect(loadDbConfig({})).toBe(null);
    expect(loadDbConfig({ SUPABASE_URL: "https://a.supabase.co" })).toBe(null);
    expect(loadDbConfig({ SUPABASE_URL: "http://a.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" })).toBe(null);
    expect(loadDbConfig({ SUPABASE_URL: " https://a.supabase.co/ ", SUPABASE_SERVICE_ROLE_KEY: " k " })).toEqual({
      url: "https://a.supabase.co",
      serviceKey: "k",
    });
  });
  it("무료 제한 강제는 true 일 때만", () => {
    expect(isDailyLimitEnforced({})).toBe(false);
    expect(isDailyLimitEnforced({ DAILY_FREE_LIMIT_ENFORCED: "false" })).toBe(false);
    expect(isDailyLimitEnforced({ DAILY_FREE_LIMIT_ENFORCED: "true" })).toBe(true);
  });
});

const cfg = { url: "https://x.supabase.co", serviceKey: "SERVICE" };

function recorder(handler: (url: string, init?: RequestInit) => Response) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return handler(url, init);
  };
  return { calls, f };
}

describe("createDb", () => {
  it("upsertUser: 병합 upsert 로 보내요", async () => {
    const r = recorder(() => new Response(null, { status: 201 }));
    await createDb(cfg, r.f).upsertUser("123", "별이", new Date("2026-10-17T00:00:00Z"));
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/users?on_conflict=id");
    const h = r.calls[0].init?.headers as Record<string, string>;
    expect(h.apikey).toBe("SERVICE");
    expect(h.Authorization).toBe("Bearer SERVICE");
    expect(h.Prefer).toBe("resolution=merge-duplicates,return=minimal");
    expect(JSON.parse(String(r.calls[0].init?.body))).toEqual({ id: "123", nickname: "별이", last_login_at: "2026-10-17T00:00:00.000Z" });
  });

  it("getCounts: 오늘·이번 달 조건과 Content-Range 를 읽어요", async () => {
    const r = recorder((url) =>
      new Response("[]", { status: 206, headers: { "content-range": url.includes("day=eq.") ? "0-0/2" : "0-0/9" } }),
    );
    const c = await createDb(cfg, r.f).getCounts("123", new Date("2026-10-17T02:00:00Z"));
    expect(c).toEqual({ today: 2, month: 9 });
    const today = r.calls.find((x) => x.url.includes("day=eq."))!;
    expect(today.url.includes("user_id=eq.123")).toBe(true);
    expect(today.url.includes("day=eq.2026-10-17")).toBe(true);
    const month = r.calls.find((x) => x.url.includes("gte."))!;
    expect(month.url.includes("day=gte.2026-10-01")).toBe(true);
    expect(month.url.includes("day=lt.2026-11-01")).toBe(true);
    expect((today.init?.headers as Record<string, string>).Prefer).toBe("count=exact");
  });

  it("getCounts: 기록이 없을 때(*/0)도 0 으로 읽어요", async () => {
    const r = recorder(() => new Response("[]", { status: 200, headers: { "content-range": "*/0" } }));
    expect(await createDb(cfg, r.f).getCounts("1")).toEqual({ today: 0, month: 0 });
  });

  it("recordDraw: 날짜(KST)와 주제만 저장해요", async () => {
    const r = recorder(() => new Response(null, { status: 201 }));
    await createDb(cfg, r.f).recordDraw("123", "love", new Date("2026-10-16T15:30:00Z"));
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/draws");
    expect(JSON.parse(String(r.calls[0].init?.body))).toEqual({ user_id: "123", day: "2026-10-17", topic: "love" });
  });

  it("deleteUser: DELETE users?id=eq.", async () => {
    const r = recorder(() => new Response(null, { status: 204 }));
    await createDb(cfg, r.f).deleteUser("123");
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/users?id=eq.123");
    expect(r.calls[0].init?.method).toBe("DELETE");
  });

  it("오류 메시지에는 상태 코드만, 위험한 id 는 거절", async () => {
    const r = recorder(() => new Response('{"hint":"SERVICE secret"}', { status: 401 }));
    let msg = "";
    try {
      await createDb(cfg, r.f).deleteUser("1");
    } catch (e) {
      expect(e instanceof DbError).toBe(true);
      msg = (e as Error).message;
    }
    expect(msg).toBe("HTTP 401");
    let bad = "";
    try {
      await createDb(cfg, r.f).deleteUser("1&id=neq.0");
    } catch (e) {
      bad = (e as Error).message;
    }
    expect(bad).toBe("invalid id");
    expect(r.calls.length).toBe(1);
  });

  it("네트워크 오류도 DbError", async () => {
    const f = async () => {
      throw new Error("boom SERVICE");
    };
    let msg = "";
    try {
      await createDb(cfg, f).recordDraw("1", "x");
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toBe("network");
  });
});
