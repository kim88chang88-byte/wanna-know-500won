import { NextResponse } from "next/server";
import { guardOrigin } from "@/lib/guard";
import { isAdmin } from "@/lib/admin/auth";
import { reviewsToCsv, sinceDayFor } from "@/lib/admin/stats";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

const NO_STORE = { "Cache-Control": "no-store" };

function adminOnly(request: Request): NextResponse | null {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  if (!isAdmin(session.sub, process.env)) return NextResponse.json({ error: "관리자 권한이 없어요." }, { status: 403, headers: NO_STORE });
  return null;
}

/** 후기 CSV 내려받기 (관리자만). ?days=7|30|90|all */
export async function GET(request: Request) {
  const denied = adminOnly(request);
  if (denied) return denied;
  const dbConfig = loadDbConfig(process.env);
  if (!dbConfig) return NextResponse.json({ error: "DB 가 연결되어 있지 않아요." }, { status: 503, headers: NO_STORE });
  const q = new URL(request.url).searchParams.get("days");
  const since = q === "all" ? "2000-01-01" : sinceDayFor([7, 30, 90].includes(Number(q)) ? Number(q) : 30);
  try {
    const rows = await createDb(dbConfig).listReviews(`${since}T00:00:00+09:00`, 50000);
    return new NextResponse(reviewsToCsv(rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="reviews-${q ?? "30"}.csv"`, ...NO_STORE },
    });
  } catch (err) {
    console.error("admin reviews csv failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "내려받지 못했어요." }, { status: 502, headers: NO_STORE });
  }
}

/** 후기 숨기기/되살리기 (관리자만). 본문: { id: number, hidden: boolean } */
export async function POST(request: Request) {
  const badOrigin = guardOrigin(request);
  if (badOrigin) return badOrigin;
  const denied = adminOnly(request);
  if (denied) return denied;
  let body: { id?: unknown; hidden?: unknown } | null;
  try {
    body = (await request.json()) as { id?: unknown; hidden?: unknown };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400, headers: NO_STORE });
  }
  if (typeof body?.id !== "number" || !Number.isInteger(body.id) || body.id < 1 || typeof body.hidden !== "boolean") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400, headers: NO_STORE });
  }
  const dbConfig = loadDbConfig(process.env);
  if (!dbConfig) return NextResponse.json({ error: "DB 가 연결되어 있지 않아요." }, { status: 503, headers: NO_STORE });
  try {
    await createDb(dbConfig).setReviewHidden(body.id, body.hidden);
  } catch (err) {
    console.error("admin review hide failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "처리하지 못했어요." }, { status: 502, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
