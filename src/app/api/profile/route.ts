import { NextResponse } from "next/server";
import { guardOrigin } from "@/lib/guard";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { parseProfileRow } from "@/lib/profile";

export const runtime = "nodejs";

/** 저장된 내 생년월일시를 고쳐요. (로그인한 본인만) */
export async function PUT(request: Request) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401 });
  const dbConfig = loadDbConfig(process.env);
  if (!dbConfig) return NextResponse.json({ error: "아직 고칠 수 없어." }, { status: 503 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청이 올바르지 않아. 다시 한 번 확인해 줘." }, { status: 400 });
  }
  const birth = parseProfileRow((body as { birth?: unknown } | null)?.birth);
  if (!birth || birth.year < 1900 || birth.year > 2100 || birth.month < 1 || birth.month > 12 || birth.day < 1 || birth.day > 31) {
    return NextResponse.json({ error: "저장할 수 없는 내용이야." }, { status: 400 });
  }
  try {
    await createDb(dbConfig).upsertProfile(session.sub, birth);
  } catch (err) {
    console.error("upsertProfile failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "저장하지 못했어. 잠시 뒤에 다시 시도해 줘." }, { status: 502 });
  }
  return NextResponse.json({ profile: birth }, { headers: { "Cache-Control": "no-store" } });
}

/** 저장된 내 생년월일시를 지워요. (로그인한 본인만. 회원 정보와 뽑기 기록은 그대로예요) */
export async function DELETE(request: Request) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401 });

  const dbConfig = loadDbConfig(process.env);
  if (!dbConfig) return NextResponse.json({ ok: true });
  try {
    await createDb(dbConfig).deleteProfile(session.sub);
  } catch (err) {
    console.error("deleteProfile failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "삭제에 실패했어. 잠시 뒤에 다시 시도해 줘." }, { status: 502 });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
