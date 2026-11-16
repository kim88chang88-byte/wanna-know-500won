import { NextResponse } from "next/server";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { cleanInviteName, cleanInviteToken, parseInviteBirth } from "@/lib/invite";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };

/**
 * 궁합 초대 링크(받는 사람 쪽). 로그인 없이 써요.
 *  - GET: 링크 상태와 초대한 사람의 호칭·관계만 알려줘요. (초대한 사람의 생년월일 등은 아예 없어요)
 *  - POST { birth, name?, consent: true }: 내 생년월일시를 한 번만 보내요. 동의 체크가 없으면 받지 않아요.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const denied = await enforceLimits(request, { name: "invite_peek", windowMs: 60_000, ip: 30, user: 30 });
  if (denied) return denied;
  const token = cleanInviteToken((await params).token);
  if (!token) return NextResponse.json({ status: "not_found" }, { headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  try {
    const p = await createDb(config).invitePeek(token);
    return NextResponse.json({ status: p.status, nick: p.nick, relation: p.relation }, { headers: NO_STORE });
  } catch (err) {
    console.error("invite peek failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "invite_fill", windowMs: 10 * 60_000, ip: 10, user: 10 }));
  if (denied) return denied;
  const token = cleanInviteToken((await params).token);
  if (!token) return NextResponse.json({ result: "not_found" }, { headers: NO_STORE });

  const body = (await request.json().catch(() => null)) as { birth?: unknown; name?: unknown; consent?: unknown } | null;
  if (body?.consent !== true) return NextResponse.json({ result: "no_consent" }, { status: 400, headers: NO_STORE });
  const birth = parseInviteBirth(body.birth);
  if (!birth) return NextResponse.json({ result: "bad" }, { status: 400, headers: NO_STORE });

  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  try {
    const result = await createDb(config).inviteFill(token, birth, cleanInviteName(body.name));
    return NextResponse.json({ result }, { headers: NO_STORE });
  } catch (err) {
    console.error("invite fill failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}
