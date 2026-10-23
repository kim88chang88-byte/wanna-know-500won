import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { guardOrigin } from "@/lib/guard";
import { asSnapshot } from "@/lib/vault";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };

function ctx(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  const config = loadDbConfig(process.env);
  return { session, config };
}

/** 보관함에서 하나 꺼내 보기. 본인 것만 줘요. (다시 볼 때는 계산도 AI 도 부르지 않아요) */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, config } = ctx(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  if (!config) return NextResponse.json({ error: "보관함을 아직 쓸 수 없어요." }, { status: 503, headers: NO_STORE });
  const { id } = await params;
  try {
    const row = await createDb(config).getVault(session.sub, id);
    const snapshot = row ? asSnapshot(row.payload) : null;
    if (!row || !snapshot) return NextResponse.json({ error: "찾을 수 없어요." }, { status: 404, headers: NO_STORE });
    return NextResponse.json({ item: { id: row.id, title: row.title, created_at: row.created_at, snapshot } }, { headers: NO_STORE });
  } catch (err) {
    console.error("getVault failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "불러오지 못했어요. 잠시 뒤에 다시 해줘요." }, { status: 502, headers: NO_STORE });
  }
}

/** 보관함에서 지우기 (본인 것만) */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const { session, config } = ctx(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  if (!config) return NextResponse.json({ ok: true });
  const { id } = await params;
  try {
    await createDb(config).deleteVault(session.sub, id);
  } catch (err) {
    console.error("deleteVault failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "지우지 못했어요. 잠시 뒤에 다시 해줘요." }, { status: 502, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
