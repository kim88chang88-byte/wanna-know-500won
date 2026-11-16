import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { cleanInviteToken, isInviteRelation, parseInviteBirth } from "@/lib/invite";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };

/**
 * 궁합 초대 링크(초대하는 사람 쪽). 로그인한 회원만 써요.
 *  - { action: "create", relation }: 링크용 토큰을 만들어요. (하루 5개, 대기 중 10개까지)
 *  - { action: "list" }: 내 초대 현황이에요. 상대가 넣은 값은 들어 있지 않아요.
 *  - { action: "take", token }: 상대가 넣은 생년월일시를 가져와요. 내 초대일 때만 돼요.
 * 조약돌은 여기서 쓰지 않아요. 가져간 값으로 궁합을 풀 때 기존 궁합 흐름에서 한 번만 써요.
 */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "invite", windowMs: 60_000, ip: 30, user: 20 }));
  if (denied) return denied;

  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });

  const body = (await request.json().catch(() => null)) as { action?: unknown; relation?: unknown; token?: unknown } | null;
  const db = createDb(config);
  try {
    await db.ensureUser(session.sub, session.nick);

    if (body?.action === "list") {
      const items = await db.inviteMine(session.sub);
      return NextResponse.json({ items }, { headers: NO_STORE });
    }

    if (body?.action === "create") {
      if (!isInviteRelation(body.relation)) return NextResponse.json({ result: "bad" }, { status: 400, headers: NO_STORE });
      const token = randomBytes(24).toString("base64url");
      const result = await db.inviteCreate(session.sub, token, session.nick ?? null, body.relation);
      return NextResponse.json(result === "ok" ? { result, token } : { result }, { headers: NO_STORE });
    }

    if (body?.action === "take") {
      const token = cleanInviteToken(body.token);
      if (!token) return NextResponse.json({ result: "not_found" }, { headers: NO_STORE });
      const r = await db.inviteTake(session.sub, token);
      if (r.result !== "ok") return NextResponse.json({ result: r.result }, { headers: NO_STORE });
      const birth = parseInviteBirth(r.birth);
      if (!birth) return NextResponse.json({ result: "expired" }, { headers: NO_STORE });
      return NextResponse.json({ result: "ok", birth, name: r.name, relation: r.relation }, { headers: NO_STORE });
    }

    return NextResponse.json({ error: "요청이 올바르지 않아." }, { status: 400, headers: NO_STORE });
  } catch (err) {
    console.error("invite failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}
