import { NextResponse } from "next/server";
import { adminIds, isAdmin } from "@/lib/admin/auth";
import { buildStats, sinceDayFor } from "@/lib/admin/stats";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const limiter = createRateLimiter(30, 60_000);
const NO_STORE = { "Cache-Control": "no-store" };

/**
 * 관리자 통계. 로그인한 회원이 ADMIN_USER_IDS 에 있을 때만 줘요.
 * - 로그인 안 함: 401, 관리자 아님: 403 (본인 고유번호를 알려줘서 환경변수에 넣을 수 있게 해요. 남의 번호는 절대 안 줘요)
 */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  if (!isAdmin(session.sub, process.env)) {
    return NextResponse.json(
      { error: "관리자 권한이 없어요.", yourId: session.sub, adminConfigured: adminIds(process.env).length > 0 },
      { status: 403, headers: NO_STORE },
    );
  }
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "admin";
  if (!limiter.check(key).ok) return NextResponse.json({ error: "요청이 너무 빨라요." }, { status: 429, headers: NO_STORE });

  const dbConfig = loadDbConfig(process.env);
  if (!dbConfig) return NextResponse.json({ error: "DB 가 연결되어 있지 않아요. (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" }, { status: 503, headers: NO_STORE });

  const raw = Number(new URL(request.url).searchParams.get("days"));
  const days = [7, 30, 90].includes(raw) ? raw : 30;
  const now = new Date();
  const since = sinceDayFor(days, now);
  const db = createDb(dbConfig);
  try {
    const [totals, draws, signups, concerns] = await Promise.all([
      db.tableCounts(),
      db.listDraws(since),
      db.listSignups(`${since}T00:00:00+09:00`),
      db.listConcernLogs(since),
    ]);
    return NextResponse.json({ stats: buildStats({ days, now, totals, draws, signups, concerns }) }, { headers: NO_STORE });
  } catch (err) {
    console.error("admin stats failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "통계를 불러오지 못했어요. (concern_logs / profiles 테이블을 만들었는지 확인해 주세요)" }, { status: 502, headers: NO_STORE });
  }
}
