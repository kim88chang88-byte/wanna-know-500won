import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { MAX_VAULT_BYTES, MAX_VAULT_ITEMS, parseVaultBody } from "@/lib/vault";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };

function who(request: Request) {
  return verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
}

/** 내 보관함 목록 (로그인한 본인만) */
export async function GET(request: Request) {
  const session = who(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "보관함을 아직 쓸 수 없어요." }, { status: 503, headers: NO_STORE });
  try {
    const items = await createDb(config).listVault(session.sub);
    return NextResponse.json({ items }, { headers: NO_STORE });
  } catch (err) {
    console.error("listVault failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "보관함을 불러오지 못했어요. 잠시 뒤에 다시 해줘요." }, { status: 502, headers: NO_STORE });
  }
}

/** 방금 본 풀이를 내 보관함에 저장 (로그인한 본인만) */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "vault", windowMs: 60_000, ip: 20, user: 20 }));
  if (denied) return denied;
  const session = who(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "보관함을 아직 쓸 수 없어요." }, { status: 503, headers: NO_STORE });

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (raw.length > MAX_VAULT_BYTES + 5000) return NextResponse.json({ error: "저장할 내용이 너무 커요." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const parsed = parseVaultBody(body);
  if (!parsed) return NextResponse.json({ error: "저장할 수 없는 내용이에요." }, { status: 400 });

  const db = createDb(config);
  try {
    if ((await db.countVault(session.sub)) >= MAX_VAULT_ITEMS) {
      return NextResponse.json({ error: `보관함이 가득 찼어요. (최대 ${MAX_VAULT_ITEMS}개) 안 보는 것을 지우고 다시 저장해 줘요.`, code: "full" }, { status: 409, headers: NO_STORE });
    }
    await db.ensureUser(session.sub, session.nick);
    const out = await db.insertVault(session.sub, {
      topic: parsed.snapshot.topic,
      premium: parsed.snapshot.premium,
      title: parsed.title,
      summary: parsed.summary,
      payload: parsed.snapshot,
      payloadHash: parsed.payloadHash,
    });
    return NextResponse.json({ ok: true, id: out.id, duplicate: out.duplicate }, { headers: NO_STORE });
  } catch (err) {
    console.error("insertVault failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "보관함에 저장하지 못했어요. 잠시 뒤에 다시 해줘요." }, { status: 502, headers: NO_STORE });
  }
}
