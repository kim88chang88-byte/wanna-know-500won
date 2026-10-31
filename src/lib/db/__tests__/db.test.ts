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

  it("ensureUser: 이미 있으면 건드리지 않는 방식으로 보내요", async () => {
    const r = recorder(() => new Response(null, { status: 201 }));
    await createDb(cfg, r.f).ensureUser("n_abc", undefined);
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/users?on_conflict=id");
    const h = r.calls[0].init?.headers as Record<string, string>;
    expect(h.Prefer).toBe("resolution=ignore-duplicates,return=minimal");
    expect(JSON.parse(String(r.calls[0].init?.body))).toEqual({ id: "n_abc", nickname: null });
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

  it("upsertProfile/getProfile/deleteProfile: 본인 행만, 필요한 칸만", async () => {
    const r = recorder((url, init) =>
      init?.method === "GET"
        ? new Response(JSON.stringify([{ user_id: "4242", calendar: "solar", year: 1995, month: 3, day: 4, is_leap: false, hour: 9, minute: 5, gender: "female", updated_at: "x" }]), { status: 200 })
        : new Response(null, { status: 201 }),
    );
    const db = createDb(cfg, r.f);
    await db.upsertProfile("4242", { year: 1995, month: 3, day: 4, hour: 9, minute: 5, calendar: "solar", isLeapMonth: false, gender: "female" }, new Date("2026-10-18T00:00:00Z"));
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/profiles?on_conflict=user_id");
    expect(JSON.parse(String(r.calls[0].init?.body))).toEqual({ user_id: "4242", calendar: "solar", year: 1995, month: 3, day: 4, is_leap: false, hour: 9, minute: 5, gender: "female", updated_at: "2026-10-18T00:00:00.000Z", consent_version: "2026-10-18", consented_at: "2026-10-18T00:00:00.000Z" });
    const p = await db.getProfile("4242");
    expect(p).toEqual({ year: 1995, month: 3, day: 4, hour: 9, minute: 5, calendar: "solar", isLeapMonth: false, gender: "female" });
    expect(r.calls[1].url).toContain("profiles?user_id=eq.4242");
    await db.deleteProfile("4242");
    expect(r.calls[2].init?.method).toBe("DELETE");
    expect(r.calls[2].url).toBe("https://x.supabase.co/rest/v1/profiles?user_id=eq.4242");
  });

  it("takeAiBudget: rpc 로 날짜·한도를 보내고 true/false 를 돌려줘요", async () => {
    const r = recorder(() => new Response("true", { status: 200 }));
    const db = createDb(cfg, r.f);
    expect(await db.takeAiBudget("2026-10-18", 300)).toBe(true);
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/rpc/ai_usage_take");
    expect(JSON.parse(String(r.calls[0].init?.body))).toEqual({ p_day: "2026-10-18", p_cap: 300 });
    const r2 = recorder(() => new Response("false", { status: 200 }));
    expect(await createDb(cfg, r2.f).takeAiBudget("2026-10-18", 300)).toBe(false);
    const r3 = recorder(() => new Response("x", { status: 404 }));
    let threw = false;
    try { await createDb(cfg, r3.f).takeAiBudget("2026-10-18", 300); } catch { threw = true; }
    expect(threw).toBe(true);
  });

  it("grantCoin: rpc 로 지급하고, 새로 지급됐는지와 잔액을 돌려줘요", async () => {
    const r = recorder(() => new Response(JSON.stringify([{ out_granted: true, out_balance: 1 }]), { status: 200 }));
    const out = await createDb(cfg, r.f).grantCoin("4242", "login_bonus", "v1", 1);
    expect(out).toEqual({ granted: true, balance: 1 });
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/rpc/coin_grant");
    expect(JSON.parse(String(r.calls[0].init?.body))).toEqual({ p_user: "4242", p_kind: "login_bonus", p_ref: "v1", p_amount: 1 });
    const again = recorder(() => new Response(JSON.stringify([{ out_granted: false, out_balance: 1 }]), { status: 200 }));
    expect((await createDb(cfg, again.f).grantCoin("4242", "login_bonus", "v1", 1)).granted).toBe(false);
  });

  it("getCoins: 행이 없으면 0, spendCoin: 잔액 없으면 -1", async () => {
    expect(await createDb(cfg, recorder(() => new Response("[]", { status: 200 })).f).getCoins("4242")).toBe(0);
    expect(await createDb(cfg, recorder(() => new Response('[{"balance":2}]', { status: 200 })).f).getCoins("4242")).toBe(2);
    const r = recorder(() => new Response("-1", { status: 200 }));
    expect(await createDb(cfg, r.f).spendCoin("4242")).toBe(-1);
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/rpc/coin_spend");
    expect(await createDb(cfg, recorder(() => new Response("0", { status: 200 })).f).spendCoin("4242")).toBe(0);
  });

  it("코인 함수는 안전하지 않은 사용자 id 를 거절해요", async () => {
    const db = createDb(cfg, recorder(() => new Response("[]", { status: 200 })).f);
    await expect(db.getCoins("a/b?x")).rejects.toThrow();
    await expect(db.spendCoin("a b")).rejects.toThrow();
  });

  it("getProfile: 행이 없으면 null", async () => {
    const r = recorder(() => new Response("[]", { status: 200 }));
    expect(await createDb(cfg, r.f).getProfile("4242")).toBeNull();
  });

  it("recordConcern: 생년월일 없이 나이대·성별만, 비로그인은 user_id null", async () => {
    const r = recorder(() => new Response(null, { status: 201 }));
    const db = createDb(cfg, r.f);
    await db.recordConcern({ userId: null, topic: "love", concern: { tags: ["crush"], text: "썸이에요" }, gender: "female", ageBand: "30s" }, new Date("2026-10-18T00:00:00Z"));
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/concern_logs");
    expect(JSON.parse(String(r.calls[0].init?.body))).toEqual({ user_id: null, day: "2026-10-18", topic: "love", tags: ["crush"], concern_text: "썸이에요", gender: "female", age_band: "30s", consent_version: "2026-10-18", consented_at: "2026-10-18T00:00:00.000Z" });
    await db.recordConcern({ userId: "4242", topic: "general", concern: { tags: [], text: "" }, gender: "male", ageBand: "20s" });
    expect(JSON.parse(String(r.calls[1].init?.body)).user_id).toBe("4242");
    expect(JSON.parse(String(r.calls[1].init?.body)).concern_text).toBeNull();
  });

  it("insertReview/setReviewHidden: 필요한 칸만, 비로그인은 user_id null", async () => {
    const r = recorder(() => new Response(null, { status: 201 }));
    const db = createDb(cfg, r.f);
    await db.insertReview({ userId: null, review: { rating: 4, text: "좋아요", reasons: [] }, topic: "love", premium: true });
    expect(r.calls[0].url).toBe("https://x.supabase.co/rest/v1/reviews");
    expect(JSON.parse(String(r.calls[0].init?.body))).toEqual({ user_id: null, rating: 4, review_text: "좋아요", reasons: [], topic: "love", premium: true });
    await db.insertReview({ userId: "4242", review: { rating: 1, text: "", reasons: ["wrong"] }, topic: "general", premium: false });
    expect(JSON.parse(String(r.calls[1].init?.body)).user_id).toBe("4242");
    expect(JSON.parse(String(r.calls[1].init?.body)).review_text).toBeNull();
    await db.setReviewHidden(7, true);
    expect(r.calls[2].init?.method).toBe("PATCH");
    expect(r.calls[2].url).toBe("https://x.supabase.co/rest/v1/reviews?id=eq.7");
    expect(JSON.parse(String(r.calls[2].init?.body))).toEqual({ hidden: true });
    let threw = false;
    try {
      await db.setReviewHidden(0, true);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
