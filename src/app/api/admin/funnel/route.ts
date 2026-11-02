import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { sinceDayFor } from "@/lib/admin/stats";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;
const NO_STORE = { "Cache-Control": "no-store" };

/** 관리자 전용: 최근 N일 방문→행동 퍼널(전체와 출처별). */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  if (!isAdmin(session.sub, process.env)) return NextResponse.json({ error: "관리자 권한이 없어요." }, { status: 403, headers: NO_STORE });
  const cfg = loadDbConfig(process.env);
  if (!cfg) return NextResponse.json({ error: "DB 가 연결되어 있지 않아요." }, { status: 503, headers: NO_STORE });
  const raw = Number(new URL(request.url).searchParams.get("days"));
  const days = [7, 30, 90].includes(raw) ? raw : 30;
  try {
    const rows = await createDb(cfg).visitFunnel(sinceDayFor(days, new Date()));
    return NextResponse.json({ days, rows }, { headers: NO_STORE });
  } catch (err) {
    console.error("admin funnel failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "퍼널을 불러오지 못했어요. (supabase/schema.sql 을 다시 Run 해야 기록이 쌓여요)" }, { status: 502, headers: NO_STORE });
  }
}
