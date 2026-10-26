import { NextResponse } from "next/server";
import { guardOrigin } from "@/lib/guard";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const runtime = "nodejs";

/** 저장된 내 생년월일시를 지워요. (로그인한 본인만. 회원 정보와 뽑기 기록은 그대로예요) */
export async function DELETE(request: Request) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const dbConfig = loadDbConfig(process.env);
  if (!dbConfig) return NextResponse.json({ ok: true });
  try {
    await createDb(dbConfig).deleteProfile(session.sub);
  } catch (err) {
    console.error("deleteProfile failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "삭제에 실패했어요. 잠시 뒤에 다시 시도해 주세요." }, { status: 502 });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
