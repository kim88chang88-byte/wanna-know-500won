import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { concernsToCsv } from "@/lib/admin/stats";
import { sinceDayFor } from "@/lib/admin/stats";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

/** 고민 통계 CSV 내려받기 (관리자만). ?days=7|30|90|all */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session || !isAdmin(session.sub, process.env)) {
    return NextResponse.json({ error: session ? "관리자 권한이 없어요." : "로그인이 필요해요." }, { status: session ? 403 : 401, headers: { "Cache-Control": "no-store" } });
  }
  const dbConfig = loadDbConfig(process.env);
  if (!dbConfig) return NextResponse.json({ error: "DB 가 연결되어 있지 않아요." }, { status: 503 });

  const q = new URL(request.url).searchParams.get("days");
  const since = q === "all" ? "2000-01-01" : sinceDayFor([7, 30, 90].includes(Number(q)) ? Number(q) : 30);
  try {
    const rows = await createDb(dbConfig).listConcernLogs(since, 50000);
    return new NextResponse(concernsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="concerns-${q ?? "30"}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("admin concerns csv failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "내려받지 못했어요." }, { status: 502 });
  }
}
