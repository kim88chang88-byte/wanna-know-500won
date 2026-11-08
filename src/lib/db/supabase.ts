import { CONSENT_VERSION } from "@/lib/siteInfo";
import type { Concern } from "@/lib/concerns";
import type { ReviewInput } from "@/lib/reviews";
import { parsePersonRow, type SavedPerson } from "@/lib/people";
import { parseProfileRow, type SavedProfile } from "@/lib/profile";
import { kstDay, kstMonthRange } from "./kst";

export interface DbConfig {
  /** 예: https://abcd1234.supabase.co */
  url: string;
  /** service_role 키. 서버에서만 쓰고 브라우저로 절대 내려보내지 않아요. */
  serviceKey: string;
}

export interface DrawCounts {
  today: number;
  month: number;
}

export class DbError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface VaultListRow {
  id: string;
  topic: string;
  premium: boolean;
  title: string;
  summary: string | null;
  created_at: string;
}

export interface ReviewRow {
  id: number;
  rating: number;
  review_text: string | null;
  reasons: string[];
  topic: string;
  premium: boolean;
  hidden: boolean;
  created_at: string;
}

/** 메인 화면에 보여 주는 후기 (이름·회원 정보는 담지 않아요) */
export interface PublicReviewRow {
  id: number;
  rating: number;
  review_text: string;
  topic: string;
  created_at: string;
}

export interface ConcernLogRow {
  day: string;
  topic: string;
  tags: string[];
  concern_text: string | null;
  gender: string | null;
  age_band: string | null;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** 환경변수가 다 있을 때만 설정을 돌려줘요. (없으면 DB 없이 동작해요) */
export function loadDbConfig(env: Record<string, string | undefined>): DbConfig | null {
  const url = env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey || !/^https:\/\//.test(url)) return null;
  return { url, serviceKey };
}

/** 카카오 회원번호 같은 id 가 주소/필터에 안전하게 들어갈 수 있는 모양인지 확인해요. */
function safeId(id: string): string {
  if (!/^[0-9A-Za-z_-]{1,64}$/.test(id)) throw new DbError("invalid id");
  return id;
}

/**
 * Supabase(PostgREST)를 fetch 로 직접 부르는 얇은 클라이언트예요.
 * 오류 메시지에는 상태 코드만 담고, 키나 응답 본문은 담지 않아요.
 */
export function createDb(config: DbConfig, fetchImpl: FetchLike = fetch) {
  const headers = (extra: Record<string, string> = {}) => ({
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
    "Content-Type": "application/json",
    ...extra,
  });

  async function call(path: string, init: RequestInit): Promise<Response> {
    let res: Response;
    try {
      res = await fetchImpl(`${config.url}/rest/v1/${path}`, init);
    } catch {
      throw new DbError("network");
    }
    if (!res.ok) throw new DbError(`HTTP ${res.status}`);
    return res;
  }

  // Content-Range 헤더(예: 0-0/5)에서 슬래시 뒤의 전체 개수를 읽어요.
  async function count(query: URLSearchParams): Promise<number> {
    query.set("select", "id");
    query.set("limit", "1");
    const res = await call(`draws?${query.toString()}`, {
      method: "GET",
      headers: headers({ Prefer: "count=exact" }),
    });
    const total = res.headers.get("content-range")?.split("/")[1];
    const n = Number(total);
    if (!Number.isInteger(n) || n < 0) throw new DbError("bad count");
    return n;
  }

  // 많은 줄을 1000줄씩 나눠서 가져와요. (PostgREST 는 한 번에 최대 1000줄까지 줘요)
  async function fetchAll<T>(path: string, maxRows: number): Promise<T[]> {
    const out: T[] = [];
    const page = 1000;
    for (let from = 0; from < maxRows; from += page) {
      const to = Math.min(from + page, maxRows) - 1;
      const res = await call(path, { method: "GET", headers: headers({ Range: `${from}-${to}`, "Range-Unit": "items" }) });
      const rows = (await res.json().catch(() => [])) as T[];
      if (!Array.isArray(rows)) break;
      out.push(...rows);
      if (rows.length < to - from + 1) break;
    }
    return out;
  }

  async function countTable(table: string): Promise<number> {
    const res = await call(`${table}?select=*&limit=1`, { method: "GET", headers: headers({ Prefer: "count=exact" }) });
    const n = Number(res.headers.get("content-range")?.split("/")[1]);
    if (!Number.isInteger(n) || n < 0) throw new DbError("bad count");
    return n;
  }

  return {
    /** 관리자 통계: 표별 전체 줄 수 */
    async tableCounts(): Promise<{ users: number; profiles: number; draws: number; concernLogs: number; reviews: number }> {
      const [users, profiles, draws, concernLogs, reviews] = await Promise.all([countTable("users"), countTable("profiles"), countTable("draws"), countTable("concern_logs"), countTable("reviews")]);
      return { users, profiles, draws, concernLogs, reviews };
    },

    /** 관리자 통계: 기간 안의 뽑기 기록(날짜·주제만) */
    listDraws(sinceDay: string, maxRows = 20000): Promise<Array<{ day: string; topic: string }>> {
      return fetchAll(`draws?select=day,topic&day=gte.${encodeURIComponent(sinceDay)}&order=day.asc`, maxRows);
    },

    /** 관리자 통계: 기간 안에 가입한 회원의 가입 시각 */
    listSignups(sinceIso: string, maxRows = 20000): Promise<Array<{ created_at: string }>> {
      return fetchAll(`users?select=created_at&created_at=gte.${encodeURIComponent(sinceIso)}&order=created_at.asc`, maxRows);
    },

    /** 관리자 통계: 기간 안의 고민 통계 줄 (최신순) */
    listConcernLogs(sinceDay: string, maxRows = 20000): Promise<ConcernLogRow[]> {
      return fetchAll(
        `concern_logs?select=day,topic,tags,concern_text,gender,age_band&day=gte.${encodeURIComponent(sinceDay)}&order=id.desc`,
        maxRows,
      );
    },

    /** 사용후기 저장. 로그인한 경우에만 userId 를 남겨요. */
    async insertReview(row: { userId: string | null; review: ReviewInput; topic: string; premium: boolean }): Promise<void> {
      await call("reviews", {
        method: "POST",
        headers: headers({ Prefer: "return=minimal" }),
        body: JSON.stringify({
          user_id: row.userId ? safeId(row.userId) : null,
          rating: row.review.rating,
          review_text: row.review.text || null,
          reasons: row.review.reasons,
          topic: row.topic.slice(0, 40),
          premium: row.premium,
          // 공개에 동의한 경우에만 이 칸을 보내요. (칸이 아직 없는 DB에서도 일반 후기 저장은 그대로 되게)
          ...(row.review.publicOk ? { public_ok: true } : {}),
        }),
      });
    },

    /** 메인 화면용: 공개에 동의했고 숨기지 않은 후기만 (한 줄 후기가 있는 것, 최신순) */
    async listPublicReviews(limit = 12): Promise<PublicReviewRow[]> {
      const n = Math.max(1, Math.min(30, Math.floor(limit)));
      const res = await call(`reviews?select=id,rating,review_text,topic,created_at&public_ok=eq.true&hidden=eq.false&review_text=not.is.null&order=id.desc&limit=${n}`, { method: "GET", headers: headers() });
      const rows = (await res.json()) as PublicReviewRow[];
      return Array.isArray(rows) ? rows.filter((r) => typeof r.review_text === "string" && r.review_text.trim()) : [];
    },

    /** 내 보관함에 저장. 같은 결과가 이미 있으면 duplicate: true 로 알려주고 새로 만들지 않아요. */
    async insertVault(
      userId: string,
      row: { topic: string; premium: boolean; title: string; summary: string | null; payload: unknown; payloadHash: string },
    ): Promise<{ id: string | null; duplicate: boolean }> {
      const res = await call("vault_items?on_conflict=user_id,payload_hash", {
        method: "POST",
        headers: headers({ Prefer: "resolution=ignore-duplicates,return=representation" }),
        body: JSON.stringify({
          user_id: safeId(userId),
          topic: row.topic.slice(0, 40),
          premium: row.premium,
          title: row.title.slice(0, 80),
          summary: row.summary ? row.summary.slice(0, 200) : null,
          payload: row.payload,
          payload_hash: row.payloadHash,
        }),
      });
      const rows = (await res.json().catch(() => [])) as Array<{ id?: unknown }>;
      const id = Array.isArray(rows) && typeof rows[0]?.id === "string" ? rows[0].id : null;
      return { id, duplicate: id === null };
    },

    /** 내 보관함 목록 (최신순, 본문 제외) */
    async listVault(userId: string, limit = 300): Promise<VaultListRow[]> {
      const res = await call(`vault_items?user_id=eq.${safeId(userId)}&select=id,topic,premium,title,summary,created_at&order=created_at.desc&limit=${Math.min(limit, 500)}`, {
        method: "GET",
        headers: headers(),
      });
      const rows = (await res.json().catch(() => [])) as VaultListRow[];
      return Array.isArray(rows) ? rows : [];
    },

    /** 내 보관함에 있는 개수 */
    async countVault(userId: string): Promise<number> {
      const res = await call(`vault_items?user_id=eq.${safeId(userId)}&select=id&limit=1`, { method: "GET", headers: headers({ Prefer: "count=exact" }) });
      const total = /\/(\d+)$/.exec(res.headers.get("content-range") ?? "");
      return total ? Number(total[1]) : 0;
    },

    /** 보관함에서 하나 꺼내기. 내 것이 아니거나 없으면 null. */
    async getVault(userId: string, id: string): Promise<(VaultListRow & { payload: unknown }) | null> {
      if (!UUID.test(id)) return null;
      const res = await call(`vault_items?id=eq.${id}&user_id=eq.${safeId(userId)}&select=id,topic,premium,title,summary,created_at,payload&limit=1`, { method: "GET", headers: headers() });
      const rows = (await res.json().catch(() => [])) as Array<VaultListRow & { payload: unknown }>;
      return Array.isArray(rows) && rows[0] ? rows[0] : null;
    },

    async deleteVault(userId: string, id: string): Promise<void> {
      if (!UUID.test(id)) throw new DbError("invalid id");
      await call(`vault_items?id=eq.${id}&user_id=eq.${safeId(userId)}`, { method: "DELETE", headers: headers({ Prefer: "return=minimal" }) });
    },

    /** 관리자: 기간 안의 후기 (최신순) */
    listReviews(sinceIso: string, maxRows = 20000): Promise<ReviewRow[]> {
      return fetchAll(
        `reviews?select=id,rating,review_text,reasons,topic,premium,hidden,created_at&created_at=gte.${encodeURIComponent(sinceIso)}&order=id.desc`,
        maxRows,
      );
    },

    /** 관리자: 후기를 숨기거나 다시 보이게 해요 */
    async setReviewHidden(id: number, hidden: boolean): Promise<void> {
      if (!Number.isInteger(id) || id < 1) throw new DbError("invalid id");
      await call(`reviews?id=eq.${id}`, { method: "PATCH", headers: headers({ Prefer: "return=minimal" }), body: JSON.stringify({ hidden }) });
    },

    /** 로그인할 때 회원을 만들거나(처음) 마지막 로그인 시각·닉네임을 갱신해요. */
    async upsertUser(id: string, nickname: string | undefined, now: Date = new Date()): Promise<void> {
      await call("users?on_conflict=id", {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        // 닉네임을 넘기지 않으면(이메일 로그인) 이미 정해 둔 닉네임을 지우지 않아요.
        body: JSON.stringify({ id: safeId(id), ...(nickname !== undefined ? { nickname } : {}), last_login_at: now.toISOString() }),
      });
    },

    /** 저장된 닉네임 (없으면 null) */
    async getNickname(id: string): Promise<string | null> {
      const res = await call(`users?id=eq.${safeId(id)}&select=nickname&limit=1`, { method: "GET", headers: headers() });
      const rows = (await res.json().catch(() => [])) as Array<{ nickname?: unknown }>;
      const v = Array.isArray(rows) ? rows[0]?.nickname : null;
      return typeof v === "string" && v.trim() ? v : null;
    },

    /** 이메일 로그인 회원이 직접 정한 닉네임을 저장해요. (회원 행이 없으면 만들어요) */
    async setNickname(id: string, nickname: string): Promise<void> {
      await call("users?on_conflict=id", {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify({ id: safeId(id), nickname: nickname.slice(0, 20) }),
      });
    },

    /**
     * 회원 행이 없을 때만 만들어요. (이미 있으면 건드리지 않아요)
     * DB 를 연결하기 전에 로그인해 둔 사람처럼 로그인 쿠키만 있는 경우를 바로잡고, 뽑기 기록이 회원 행 없이 실패하는 일을 막아요.
     */
    async ensureUser(id: string, nickname: string | undefined): Promise<void> {
      await call("users?on_conflict=id", {
        method: "POST",
        headers: headers({ Prefer: "resolution=ignore-duplicates,return=minimal" }),
        body: JSON.stringify({ id: safeId(id), nickname: nickname ?? null }),
      });
    },

    /** 남은 뽑기 코인 장수 (없으면 0) */
    async getCoins(userId: string): Promise<number> {
      const res = await call(`user_coins?user_id=eq.${safeId(userId)}&select=balance&limit=1`, { method: "GET", headers: headers() });
      const rows = (await res.json().catch(() => [])) as Array<{ balance?: unknown }>;
      const n = Number(Array.isArray(rows) ? rows[0]?.balance : 0);
      return Number.isInteger(n) && n > 0 ? n : 0;
    },

    /** 지갑 내역용: 최근 조약돌 변동 (delta 0 인 가입 표시는 뺐어요). 최신순 */
    async listCoinLog(userId: string, limit = 200): Promise<Array<{ kind: string; delta: number; created_at: string }>> {
      const res = await call(`coin_log?user_id=eq.${safeId(userId)}&delta=neq.0&select=kind,delta,created_at&order=created_at.desc&limit=${Math.min(limit, 500)}`, { method: "GET", headers: headers() });
      const rows = (await res.json().catch(() => [])) as Array<{ kind?: unknown; delta?: unknown; created_at?: unknown }>;
      if (!Array.isArray(rows)) return [];
      return rows.flatMap((r) => (typeof r.kind === "string" && typeof r.delta === "number" && typeof r.created_at === "string" ? [{ kind: r.kind, delta: r.delta, created_at: r.created_at }] : []));
    },

    /** 코인 지급. 같은 (kind, ref) 는 한 번만 들어가요. 새로 지급됐으면 granted = true. DB 함수(coin_grant) 안에서 한 번에 처리해요. */
    async grantCoin(userId: string, kind: string, ref: string, amount = 1): Promise<{ granted: boolean; balance: number }> {
      const res = await call("rpc/coin_grant", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ p_user: safeId(userId), p_kind: kind.slice(0, 40), p_ref: ref.slice(0, 80), p_amount: amount }),
      });
      const rows = (await res.json().catch(() => null)) as Array<{ out_granted?: unknown; out_balance?: unknown }> | { out_granted?: unknown; out_balance?: unknown } | null;
      const row = Array.isArray(rows) ? rows[0] : rows;
      const balance = Number(row?.out_balance);
      return { granted: row?.out_granted === true, balance: Number.isInteger(balance) && balance > 0 ? balance : 0 };
    },

    /**
     * 처음 로그인한 회원인지 표시해요. 처음이면 true. (신규 가입 집계용이고 조약돌은 주지 않아요)
     * coin_log 에 delta 0 한 줄을 남겨서 두 번째부터는 false 가 돼요.
     */
    async markWelcome(userId: string): Promise<boolean> {
      const id = safeId(userId);
      const found = await call(`coin_log?user_id=eq.${id}&kind=eq.welcome&select=id&limit=1`, { method: "GET", headers: headers() });
      const rows = (await found.json().catch(() => [])) as unknown[];
      if (Array.isArray(rows) && rows.length > 0) return false;
      await call("coin_log", { method: "POST", headers: headers({ Prefer: "return=minimal" }), body: JSON.stringify({ user_id: id, kind: "welcome", ref: "v1", delta: 0 }) });
      return true;
    },

    /** 한 달에 cap 번까지만 지급하는 코인 지급. reason: ok / cap / dup */
    async grantCoinCapped(userId: string, kind: string, ref: string, cap: number, amount = 1): Promise<{ granted: boolean; balance: number; reason: string }> {
      const res = await call("rpc/coin_grant_capped", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ p_user: safeId(userId), p_kind: kind.slice(0, 40), p_ref: ref.slice(0, 80), p_amount: amount, p_cap: cap }),
      });
      const rows = (await res.json().catch(() => null)) as Array<{ out_granted?: unknown; out_balance?: unknown; out_reason?: unknown }> | { out_granted?: unknown; out_balance?: unknown; out_reason?: unknown } | null;
      const row = Array.isArray(rows) ? rows[0] : rows;
      const balance = Number(row?.out_balance);
      return { granted: row?.out_granted === true, balance: Number.isInteger(balance) && balance > 0 ? balance : 0, reason: typeof row?.out_reason === "string" ? row.out_reason : "dup" };
    },

    /** 코인 1장 사용. 남은 장수를 돌려주고, 잔액이 없으면 -1 이에요. */
    async spendCoin(userId: string): Promise<number> {
      const res = await call("rpc/coin_spend", { method: "POST", headers: headers(), body: JSON.stringify({ p_user: safeId(userId) }) });
      const n = await res.json().catch(() => -1);
      return typeof n === "number" && Number.isInteger(n) ? n : -1;
    },

    /** 상담방 남은 질문 수 (처음이면 무료 free 개). DB 함수(chat_quota) */
    async chatQuota(userId: string, scope: string, free: number): Promise<number> {
      const res = await call("rpc/chat_quota", { method: "POST", headers: headers(), body: JSON.stringify({ p_user: safeId(userId), p_scope: scope.slice(0, 120), p_free: free }) });
      const n = await res.json().catch(() => null);
      if (typeof n !== "number" || !Number.isInteger(n)) throw new Error("chat_quota 응답 이상");
      return n;
    },

    /** 질문 1개 사용 → 남은 수. 남은 게 없으면 -1. DB 함수(chat_take) */
    async chatTake(userId: string, scope: string, free: number): Promise<number> {
      const res = await call("rpc/chat_take", { method: "POST", headers: headers(), body: JSON.stringify({ p_user: safeId(userId), p_scope: scope.slice(0, 120), p_free: free }) });
      const n = await res.json().catch(() => null);
      if (typeof n !== "number" || !Number.isInteger(n)) throw new Error("chat_take 응답 이상");
      return n;
    },

    /** AI 가 답하지 못했을 때 질문 1개를 돌려줘요. */
    async chatRefund(userId: string, scope: string): Promise<void> {
      await call("rpc/chat_refund", { method: "POST", headers: headers(), body: JSON.stringify({ p_user: safeId(userId), p_scope: scope.slice(0, 120) }) });
    },

    /** 코인 1장으로 질문 amount 개 더하기. 코인이 없으면 left = -1. DB 함수(chat_buy) */
    async chatBuy(userId: string, scope: string, free: number, amount: number): Promise<{ left: number; coins: number }> {
      const res = await call("rpc/chat_buy", { method: "POST", headers: headers(), body: JSON.stringify({ p_user: safeId(userId), p_scope: scope.slice(0, 120), p_free: free, p_amount: amount }) });
      const rows = (await res.json().catch(() => null)) as Array<{ out_left?: unknown; out_coins?: unknown }> | { out_left?: unknown; out_coins?: unknown } | null;
      const row = Array.isArray(rows) ? rows[0] : rows;
      const left = Number(row?.out_left);
      const coins = Number(row?.out_coins);
      if (!Number.isInteger(left)) throw new Error("chat_buy 응답 이상");
      return { left, coins: Number.isInteger(coins) && coins > 0 ? coins : 0 };
    },

    /** 내 추천 코드 (없으면 DB 에서 만들어요) */
    async referralCode(userId: string): Promise<string | null> {
      const res = await call("rpc/referral_code_get", { method: "POST", headers: headers(), body: JSON.stringify({ p_user: safeId(userId) }) });
      const v = await res.json().catch(() => null);
      return typeof v === "string" && /^[A-Z0-9]{6,12}$/.test(v) ? v : null;
    },

    /** 친구 코드 입력. ok / bad_code / self / already / too_old / used_draw */
    async redeemReferral(userId: string, code: string): Promise<string> {
      const res = await call("rpc/referral_redeem", { method: "POST", headers: headers(), body: JSON.stringify({ p_user: safeId(userId), p_code: code.slice(0, 20) }) });
      const v = await res.json().catch(() => null);
      return typeof v === "string" ? v : "failed";
    },

    /** 초대받은 친구의 첫 풀이가 끝났을 때 호출해요. 보상은 DB 함수 안에서 한 번만 지급돼요. */
    async completeReferral(userId: string): Promise<{ referee: boolean; referrer: boolean }> {
      const res = await call("rpc/referral_complete", { method: "POST", headers: headers(), body: JSON.stringify({ p_user: safeId(userId) }) });
      const rows = (await res.json().catch(() => null)) as Array<{ out_referee?: unknown; out_referrer?: unknown }> | { out_referee?: unknown; out_referrer?: unknown } | null;
      const row = Array.isArray(rows) ? rows[0] : rows;
      return { referee: row?.out_referee === true, referrer: row?.out_referrer === true };
    },

    /** 내가 초대한 친구 수 (첫 풀이를 마친 친구 / 아직 기다리는 친구) */
    async referralStats(userId: string): Promise<{ done: number; pending: number }> {
      const id = safeId(userId);
      const one = async (status: string) => {
        const res = await call(`referrals?referrer_id=eq.${id}&status=eq.${status}&select=referee_id&limit=1`, { method: "GET", headers: headers({ Prefer: "count=exact" }) });
        const n = Number(res.headers.get("content-range")?.split("/")[1]);
        return Number.isInteger(n) && n >= 0 ? n : 0;
      };
      return { done: await one("done"), pending: await one("pending") };
    },

    /** 오늘(한국 시간)·이번 달 뽑기 횟수 */
    async getCounts(userId: string, now: Date = new Date()): Promise<DrawCounts> {
      const id = safeId(userId);
      const today = new URLSearchParams({ user_id: `eq.${id}`, day: `eq.${kstDay(now)}` });
      const range = kstMonthRange(now);
      const month = new URLSearchParams();
      month.append("user_id", `eq.${id}`);
      month.append("day", `gte.${range.start}`);
      month.append("day", `lt.${range.next}`);
      const [t, m] = await Promise.all([count(today), count(month)]);
      return { today: t, month: m };
    },

    /** 뽑기 한 번을 기록해요. (날짜와 주제만 남겨요) */
    async recordDraw(userId: string, topic: string, now: Date = new Date()): Promise<void> {
      await call("draws", {
        method: "POST",
        headers: headers({ Prefer: "return=minimal" }),
        body: JSON.stringify({ user_id: safeId(userId), day: kstDay(now), topic: topic.slice(0, 40) }),
      });
    },

    /**
     * 오늘 AI 호출 한 번을 써도 되는지 확인하고, 되면 1 늘려요. (한도에 닿으면 false)
     * 여러 서버가 동시에 불러도 틀어지지 않게 DB 함수(ai_usage_take) 안에서 한 번에 처리해요.
     */
    async takeAiBudget(day: string, cap: number): Promise<boolean> {
      const res = await call("rpc/ai_usage_take", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ p_day: day, p_cap: cap }),
      });
      return (await res.json().catch(() => null)) === true;
    },

    /** AI 호출 기록 한 줄을 더해요. (calls/hits 는 0 또는 1, 토큰은 실제 사용량) */
    async addAiCost(day: string, model: string, calls: number, hits: number, input: number, output: number): Promise<void> {
      await call("rpc/ai_cost_add", {
        method: "POST",
        headers: headers({ Prefer: "return=minimal" }),
        body: JSON.stringify({ p_day: day, p_model: model.slice(0, 80), p_calls: calls, p_hits: hits, p_in: Math.max(0, Math.round(input)), p_out: Math.max(0, Math.round(output)) }),
      });
    },

    /** since(YYYY-MM-DD) 이후의 날짜·모델별 AI 사용 기록 */
    async listAiCost(since: string): Promise<Array<{ day: string; model: string; calls: number; cacheHits: number; input: number; output: number }>> {
      const q = new URLSearchParams({ select: "day,model,calls,cache_hits,input_tokens,output_tokens", day: `gte.${since}`, order: "day.desc" });
      const res = await call(`ai_cost?${q.toString()}`, { method: "GET", headers: headers() });
      const rows = (await res.json().catch(() => [])) as Array<Record<string, unknown>>;
      if (!Array.isArray(rows)) return [];
      return rows.map((r) => ({ day: String(r.day), model: String(r.model), calls: Number(r.calls) || 0, cacheHits: Number(r.cache_hits) || 0, input: Number(r.input_tokens) || 0, output: Number(r.output_tokens) || 0 }));
    },

    /** 관리자 테스트 캐시 읽기. 없으면 null. */
    async getAiCache(key: string): Promise<string | null> {
      if (!/^[0-9a-f]{64}$/.test(key)) return null;
      const res = await call(`ai_cache?key=eq.${key}&select=payload&limit=1`, { method: "GET", headers: headers() });
      const rows = (await res.json().catch(() => [])) as Array<{ payload?: unknown }>;
      return Array.isArray(rows) && typeof rows[0]?.payload === "string" ? rows[0].payload : null;
    },

    /** 관리자 테스트 캐시 쓰기. (같은 키면 덮어써요) */
    async putAiCache(key: string, model: string, payload: string): Promise<void> {
      if (!/^[0-9a-f]{64}$/.test(key)) return;
      await call("ai_cache?on_conflict=key", {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify({ key, model: model.slice(0, 80), payload }),
      });
    },

    /**
     * 속도 제한(여러 서버 공용). 한도 안이면 0, 넘었으면 다시 시도할 때까지 남은 초를 돌려줘요.
     * DB 함수(rate_limit_take) 안에서 한 번에 세서 동시에 불러도 틀어지지 않아요.
     */
    async takeRateLimit(key: string, windowSec: number, limit: number): Promise<number> {
      const res = await call("rpc/rate_limit_take", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ p_key: key.slice(0, 200), p_window_sec: windowSec, p_limit: limit }),
      });
      const n = await res.json().catch(() => 0);
      return typeof n === "number" && Number.isFinite(n) ? n : 0;
    },

    /** 오늘 방문을 기록하고(vid 는 이미 해시된 값), 오늘·누적 방문자 수를 돌려줘요. DB 함수(visit_hit) 안에서 한 번에 처리해요. */
    async recordVisit(day: string, vid: string): Promise<{ today: number; total: number } | null> {
      const res = await call("rpc/visit_hit", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ p_day: day, p_vid: vid }),
      });
      const rows = (await res.json().catch(() => null)) as Array<{ today?: unknown; total?: unknown }> | { today?: unknown; total?: unknown } | null;
      const row = Array.isArray(rows) ? rows[0] : rows;
      const today = Number(row?.today);
      const total = Number(row?.total);
      return Number.isFinite(today) && Number.isFinite(total) ? { today, total } : null;
    },

    /** 처음 온 경로를 한 번만 기록해요. (이미 있으면 그대로) */
    async setVisitSource(vid: string, src: string): Promise<void> {
      await call("rpc/visit_attr", { method: "POST", headers: headers(), body: JSON.stringify({ p_vid: vid, p_src: src }) });
    },

    /** 핵심 행동을 하루 한 번 기록해요. (vid 는 이미 해시된 값) */
    async recordVisitEvent(day: string, vid: string, event: string): Promise<void> {
      await call("rpc/visit_event", { method: "POST", headers: headers(), body: JSON.stringify({ p_day: day, p_vid: vid, p_event: event }) });
    },

    /** 출처별 방문자 수와 행동별 사람 수. (관리자 화면용) */
    async visitFunnel(sinceDay: string): Promise<Array<{ src: string; event: string; n: number }>> {
      const res = await call("rpc/visit_funnel", { method: "POST", headers: headers(), body: JSON.stringify({ p_since: sinceDay }) });
      const rows = (await res.json().catch(() => [])) as Array<{ src?: unknown; event?: unknown; n?: unknown }>;
      if (!Array.isArray(rows)) return [];
      return rows
        .filter((r) => typeof r.src === "string" && typeof r.event === "string" && Number.isFinite(Number(r.n)))
        .map((r) => ({ src: r.src as string, event: r.event as string, n: Number(r.n) }));
    },

    /** 일별 방문자 수와 처음 온 사람 수. (관리자 화면용) */
    async visitDaily(sinceDay: string): Promise<Array<{ day: string; visitors: number; fresh: number }>> {
      const res = await call("rpc/visit_daily", { method: "POST", headers: headers(), body: JSON.stringify({ p_since: sinceDay }) });
      const rows = (await res.json().catch(() => [])) as Array<{ day?: unknown; visitors?: unknown; fresh?: unknown }>;
      if (!Array.isArray(rows)) return [];
      return rows
        .filter((r) => typeof r.day === "string" && Number.isFinite(Number(r.visitors)))
        .map((r) => ({ day: r.day as string, visitors: Number(r.visitors), fresh: Number(r.fresh) || 0 }));
    },

    /** 저장된 생년월일시를 읽어요. 없으면 null. */
    async getProfile(userId: string): Promise<SavedProfile | null> {
      const res = await call(`profiles?user_id=eq.${safeId(userId)}&select=*&limit=1`, { method: "GET", headers: headers() });
      const rows = (await res.json().catch(() => [])) as unknown[];
      return Array.isArray(rows) && rows.length > 0 ? parseProfileRow(rows[0]) : null;
    },

    /** 생년월일시를 저장해요. (동의한 회원만. 이미 있으면 덮어써요) */
    async upsertProfile(userId: string, p: SavedProfile, now: Date = new Date()): Promise<void> {
      await call("profiles?on_conflict=user_id", {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify({
          user_id: safeId(userId),
          calendar: p.calendar,
          year: p.year,
          month: p.month,
          day: p.day,
          is_leap: p.calendar === "lunar" && p.isLeapMonth === true,
          hour: p.hour ?? null,
          minute: p.hour === null || p.hour === undefined ? null : (p.minute ?? 0),
          gender: p.gender,
          updated_at: now.toISOString(),
          consent_version: CONSENT_VERSION,
          consented_at: now.toISOString(),
        }),
      });
    },

    /** 기억해 둔 다른 사람 목록 (최신순) */
    async listPeople(userId: string): Promise<SavedPerson[]> {
      const res = await call(`saved_people?user_id=eq.${safeId(userId)}&select=*&order=created_at.desc&limit=50`, { method: "GET", headers: headers() });
      const rows = (await res.json().catch(() => [])) as unknown[];
      return (Array.isArray(rows) ? rows : []).map(parsePersonRow).filter((p): p is SavedPerson => p !== null);
    },

    /** 다른 사람 한 명 저장 (동의한 회원만) */
    async insertPerson(userId: string, label: string, p: SavedProfile, now: Date = new Date()): Promise<string | null> {
      const res = await call("saved_people", {
        method: "POST",
        headers: headers({ Prefer: "return=representation" }),
        body: JSON.stringify({
          user_id: safeId(userId),
          label: label.slice(0, 20),
          calendar: p.calendar,
          year: p.year,
          month: p.month,
          day: p.day,
          is_leap: p.calendar === "lunar" && p.isLeapMonth === true,
          hour: p.hour ?? null,
          minute: p.hour === null || p.hour === undefined ? null : (p.minute ?? 0),
          gender: p.gender,
          consent_version: CONSENT_VERSION,
          consented_at: now.toISOString(),
        }),
      });
      const rows = (await res.json().catch(() => [])) as Array<{ id?: unknown }>;
      return Array.isArray(rows) && typeof rows[0]?.id === "string" ? rows[0].id : null;
    },

    async deletePerson(userId: string, id: string): Promise<void> {
      if (!UUID.test(id)) throw new DbError("invalid id");
      await call(`saved_people?id=eq.${id}&user_id=eq.${safeId(userId)}`, { method: "DELETE", headers: headers({ Prefer: "return=minimal" }) });
    },

    /** 저장된 생년월일시만 지워요. (회원 정보는 그대로) */
    async deleteProfile(userId: string): Promise<void> {
      await call(`profiles?user_id=eq.${safeId(userId)}`, { method: "DELETE", headers: headers({ Prefer: "return=minimal" }) });
    },

    /**
     * 고민 통계 한 줄. (동의한 경우에만 호출해요)
     * 생년월일은 담지 않고 나이대·성별만 남겨요. 로그인한 경우에만 userId 를 남겨서 탈퇴 때 함께 지워져요.
     */
    async recordConcern(row: { userId: string | null; topic: string; concern: Concern; gender: string; ageBand: string }, now: Date = new Date()): Promise<void> {
      await call("concern_logs", {
        method: "POST",
        headers: headers({ Prefer: "return=minimal" }),
        body: JSON.stringify({
          user_id: row.userId ? safeId(row.userId) : null,
          day: kstDay(now),
          topic: row.topic.slice(0, 40),
          tags: row.concern.tags,
          concern_text: row.concern.text || null,
          gender: row.gender,
          age_band: row.ageBand,
          consent_version: CONSENT_VERSION,
          consented_at: now.toISOString(),
        }),
      });
    },

    /** 상담실 대화방: 마지막 대화 후 retainMs 가 지난 방을 지우고, 남은 방을 최신순으로 돌려줘요. */
    async listChatRooms(userId: string, retainMs: number, now: Date = new Date()): Promise<Array<{ room_id: string; data: unknown; updated_at: string }>> {
      const cutoff = encodeURIComponent(new Date(now.getTime() - retainMs).toISOString());
      await call(`chat_rooms?user_id=eq.${safeId(userId)}&updated_at=lt.${cutoff}`, { method: "DELETE", headers: headers({ Prefer: "return=minimal" }) });
      const res = await call(`chat_rooms?user_id=eq.${safeId(userId)}&select=room_id,data,updated_at&order=updated_at.desc&limit=10`, { method: "GET", headers: headers() });
      const rows = (await res.json().catch(() => [])) as Array<{ room_id: string; data: unknown; updated_at: string }>;
      return Array.isArray(rows) ? rows : [];
    },

    /** 상담실 대화방을 통째로 맞춰요: 받은 방은 저장(덮어쓰기)하고, 목록에 없는 방은 지워요. */
    async saveChatRooms(userId: string, rooms: Array<{ id: string; data: unknown; updatedAt: number }>): Promise<void> {
      const uid = safeId(userId);
      if (rooms.length > 0) {
        await call("chat_rooms?on_conflict=user_id,room_id", {
          method: "POST",
          headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
          body: JSON.stringify(rooms.map((r) => ({ user_id: uid, room_id: r.id.slice(0, 80), data: r.data, updated_at: new Date(r.updatedAt).toISOString() }))),
        });
      }
      const keep = rooms.map((r) => `"${r.id.slice(0, 80).replace(/["\\]/g, "")}"`).join(",");
      const filter = rooms.length > 0 ? `&room_id=not.in.(${encodeURIComponent(keep)})` : "";
      await call(`chat_rooms?user_id=eq.${uid}${filter}`, { method: "DELETE", headers: headers({ Prefer: "return=minimal" }) });
    },

    /** 회원 탈퇴: 회원 정보와 뽑기 기록을 모두 지워요. (draws·profiles·concern_logs 의 본인 행은 users 삭제 때 함께 삭제돼요) */
    async deleteUser(userId: string): Promise<void> {
      await call(`users?id=eq.${safeId(userId)}`, {
        method: "DELETE",
        headers: headers({ Prefer: "return=minimal" }),
      });
    },
  };
}

export type Db = ReturnType<typeof createDb>;
