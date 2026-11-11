import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { dropExpired, parseRooms, RETENTION_DAYS } from "@/lib/chatRooms";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BYTES = 600_000;

function who(request: Request) {
  return verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
}

/** 내 상담실 대화방 (로그인한 본인만). 마지막 대화 후 30일이 지난 방은 이때 함께 지워요. */
export async function GET(request: Request) {
  const session = who(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "지금은 쓸 수 없어." }, { status: 503, headers: NO_STORE });
  try {
    const rows = await createDb(config).listChatRooms(session.sub, RETENTION_DAYS * 86_400_000);
    const rooms = parseRooms(rows.map((r) => r.data));
    return NextResponse.json({ rooms }, { headers: NO_STORE });
  } catch (err) {
    console.error("listChatRooms failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "대화방을 불러오지 못했어." }, { status: 502, headers: NO_STORE });
  }
}

/** 내 대화방을 서버에 맞춰요: 보낸 방은 저장하고, 보내지 않은 방은 지워요. */
export async function PUT(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "chatrooms", windowMs: 60_000, ip: 40, user: 40 }));
  if (denied) return denied;
  const session = who(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "지금은 쓸 수 없어." }, { status: 503, headers: NO_STORE });

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "요청이 올바르지 않아." }, { status: 400 });
  }
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "저장할 내용이 너무 커." }, { status: 413 });
  let body: { rooms?: unknown } | null;
  try {
    body = JSON.parse(raw) as { rooms?: unknown } | null;
  } catch {
    return NextResponse.json({ error: "요청이 올바르지 않아." }, { status: 400 });
  }
  if (!body || !Array.isArray(body.rooms)) return NextResponse.json({ error: "요청이 올바르지 않아." }, { status: 400 });

  // 모양을 다시 검사하고, 30일 지난 방은 저장하지 않아요
  const rooms = dropExpired(parseRooms(body.rooms));
  try {
    const db = createDb(config);
    await db.ensureUser(session.sub, session.nick);
    await db.saveChatRooms(
      session.sub,
      rooms.map((r) => ({ id: r.id, data: r, updatedAt: r.updatedAt > 0 ? r.updatedAt : Date.now() })),
    );
    return NextResponse.json({ ok: true, count: rooms.length }, { headers: NO_STORE });
  } catch (err) {
    console.error("saveChatRooms failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "대화방을 저장하지 못했어요." }, { status: 502, headers: NO_STORE });
  }
}
