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

  return {
    /** 로그인할 때 회원을 만들거나(처음) 마지막 로그인 시각·닉네임을 갱신해요. */
    async upsertUser(id: string, nickname: string | undefined, now: Date = new Date()): Promise<void> {
      await call("users?on_conflict=id", {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify({ id: safeId(id), nickname: nickname ?? null, last_login_at: now.toISOString() }),
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

    /** 회원 탈퇴: 회원 정보와 뽑기 기록을 모두 지워요. (draws 는 users 삭제 때 함께 삭제돼요) */
    async deleteUser(userId: string): Promise<void> {
      await call(`users?id=eq.${safeId(userId)}`, {
        method: "DELETE",
        headers: headers({ Prefer: "return=minimal" }),
      });
    },
  };
}

export type Db = ReturnType<typeof createDb>;
