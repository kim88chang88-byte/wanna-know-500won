import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { parsePersonBody, samePerson } from "@/lib/people";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };

/** 기억해 둔 사람 고치기 (본인 것만). 이름·생년월일시·성별을 통째로 바꿔요. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "people", windowMs: 60_000, ip: 20, user: 20 }));
  if (denied) return denied;
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "아직 고칠 수 없어." }, { status: 503, headers: NO_STORE });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청이 올바르지 않아. 다시 한 번 확인해 줘." }, { status: 400 });
  }
  const parsed = parsePersonBody(body);
  if (!parsed) return NextResponse.json({ error: "저장할 수 없는 내용이야." }, { status: 400, headers: NO_STORE });
  const { id } = await params;
  const db = createDb(config);
  try {
    const list = await db.listPeople(session.sub);
    if (!list.some((p) => p.id === id)) return NextResponse.json({ error: "고칠 사람을 찾지 못했어." }, { status: 404, headers: NO_STORE });
    if (list.some((p) => p.id !== id && samePerson(p, parsed.birth))) {
      return NextResponse.json({ error: "이미 기억해 둔 다른 사람과 생년월일시·성별이 똑같아. 확인해 줘." }, { status: 409, headers: NO_STORE });
    }
    await db.updatePerson(session.sub, id, parsed.label, parsed.birth);
  } catch (err) {
    console.error("updatePerson failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "저장하지 못했어. 잠시 뒤에 다시 시도해 줘." }, { status: 502, headers: NO_STORE });
  }
  return NextResponse.json({ person: { id, label: parsed.label, birth: parsed.birth } }, { headers: NO_STORE });
}

/** 기억해 둔 사람 지우기 (본인 것만) */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ ok: true });
  const { id } = await params;
  try {
    await createDb(config).deletePerson(session.sub, id);
  } catch (err) {
    console.error("deletePerson failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "지우지 못했어. 잠시 뒤에 다시 시도해 줘." }, { status: 502, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
