import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { guardOrigin } from "@/lib/guard";
import { deployInfo } from "@/lib/version";

export const runtime = "nodejs";
export const maxDuration = 30;
const NO_STORE = { "Cache-Control": "no-store" };

function adminOr(request: Request): { sub: string } | NextResponse {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  if (!isAdmin(session.sub, process.env)) return NextResponse.json({ error: "관리자 권한이 없어." }, { status: 403, headers: NO_STORE });
  return { sub: session.sub };
}
const dbOr = () => {
  const cfg = loadDbConfig(process.env);
  return cfg ? createDb(cfg) : null;
};
const SETUP = "저장 표가 아직 없어. Supabase SQL Editor 에서 supabase/schema.sql 을 한 번 Run 해 줘.";

/** 관리자: 저장된 점검 기록 목록 (?id=번호 이면 그 기록의 전체 글) */
export async function GET(request: Request) {
  const who = adminOr(request);
  if (who instanceof NextResponse) return who;
  const db = dbOr();
  if (!db) return NextResponse.json({ error: "DB 가 연결되어 있지 않아." }, { status: 503, headers: NO_STORE });
  try {
    const idRaw = new URL(request.url).searchParams.get("id");
    if (idRaw) {
      const book = await db.getEvalBook(Number(idRaw));
      return book === null ? NextResponse.json({ error: "기록이 없어." }, { status: 404, headers: NO_STORE }) : NextResponse.json({ bookText: book }, { headers: NO_STORE });
    }
    return NextResponse.json({ runs: await db.listEvalRuns(30) }, { headers: NO_STORE });
  } catch (err) {
    console.error("premium-eval list failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: SETUP }, { status: 502, headers: NO_STORE });
  }
}

/** 관리자: 점검 결과 저장. 어느 배포 버전에서 만든 결과인지도 함께 남겨요(서버가 직접 채워요). */
export async function POST(request: Request) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const who = adminOr(request);
  if (who instanceof NextResponse) return who;
  const db = dbOr();
  if (!db) return NextResponse.json({ error: "DB 가 연결되어 있지 않아." }, { status: 503, headers: NO_STORE });
  let body: { inputKey?: unknown; label?: unknown; overall?: unknown; score?: unknown; bookText?: unknown } | null;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "요청이 올바르지 않아." }, { status: 400, headers: NO_STORE });
  }
  if (typeof body?.inputKey !== "string" || typeof body.bookText !== "string" || typeof body.overall !== "string" || typeof body.score !== "object" || body.score === null) {
    return NextResponse.json({ error: "요청이 올바르지 않아." }, { status: 400, headers: NO_STORE });
  }
  const v = deployInfo(process.env);
  try {
    const id = await db.insertEvalRun({
      adminId: who.sub,
      inputKey: body.inputKey,
      label: typeof body.label === "string" && body.label.trim() ? body.label.trim() : null,
      version: v.sha,
      versionMessage: v.message || null,
      overall: body.overall,
      score: body.score,
      bookText: body.bookText,
    });
    return NextResponse.json({ id, version: v.sha }, { headers: NO_STORE });
  } catch (err) {
    console.error("premium-eval save failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: SETUP }, { status: 502, headers: NO_STORE });
  }
}
