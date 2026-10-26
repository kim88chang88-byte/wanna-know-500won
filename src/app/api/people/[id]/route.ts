import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };

/** 기억해 둔 사람 지우기 (본인 것만) */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ ok: true });
  const { id } = await params;
  try {
    await createDb(config).deletePerson(session.sub, id);
  } catch (err) {
    console.error("deletePerson failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "지우지 못했어요. 잠시 뒤에 다시 해줘요." }, { status: 502, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
