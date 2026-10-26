import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { MAX_PEOPLE, parsePersonBody, samePerson } from "@/lib/people";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };

function who(request: Request) {
  return verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
}

/** 내가 기억해 둔 다른 사람 목록 (로그인한 본인만). 표가 아직 없으면 빈 목록 + enabled:false */
export async function GET(request: Request) {
  const session = who(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ people: [], enabled: false }, { headers: NO_STORE });
  try {
    const people = await createDb(config).listPeople(session.sub);
    return NextResponse.json({ people, enabled: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("listPeople failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ people: [], enabled: false }, { headers: NO_STORE });
  }
}

/** 다른 사람 한 명 기억해 두기 (로그인한 본인이 동의했을 때만) */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "people", windowMs: 60_000, ip: 20, user: 20 }));
  if (denied) return denied;
  const session = who(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "아직 기억해 둘 수 없어요." }, { status: 503, headers: NO_STORE });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const parsed = parsePersonBody(body);
  if (!parsed) return NextResponse.json({ error: "저장할 수 없는 내용이에요." }, { status: 400 });

  const db = createDb(config);
  try {
    const existing = await db.listPeople(session.sub);
    const dup = existing.find((p) => samePerson(p, parsed.birth));
    if (dup) return NextResponse.json({ person: dup, duplicate: true }, { headers: NO_STORE });
    if (existing.length >= MAX_PEOPLE) {
      return NextResponse.json({ error: `기억해 둔 사람이 가득 찼어요. (최대 ${MAX_PEOPLE}명) 안 쓰는 사람을 지우고 다시 저장해 줘요.`, code: "full" }, { status: 409, headers: NO_STORE });
    }
    await db.ensureUser(session.sub, session.nick);
    const id = await db.insertPerson(session.sub, parsed.label, parsed.birth);
    return NextResponse.json({ person: id ? { id, label: parsed.label, birth: parsed.birth } : null }, { headers: NO_STORE });
  } catch (err) {
    console.error("insertPerson failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요." }, { status: 502, headers: NO_STORE });
  }
}
