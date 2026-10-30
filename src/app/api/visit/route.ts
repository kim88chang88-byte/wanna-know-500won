import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { kstDay } from "@/lib/db/kst";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";

/**
 * 랜딩의 방문자 수(Today / Total). 브라우저가 만든 무작위 ID 를 서버에서 해시해서 세요.
 * 이름·IP 는 저장하지 않아요. DB 가 없거나 함수를 아직 안 만들었으면 503 을 돌려주고, 화면은 숫자를 숨겨요.
 */
export async function POST(request: Request) {
  const blocked = guardOrigin(request);
  if (blocked) return blocked;
  const denied = await enforceLimits(request, { name: "visit", windowMs: 60000, ip: 20, user: 20 });
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { vid?: unknown } | null;
  const vid = typeof body?.vid === "string" ? body.vid : "";
  if (!/^[A-Za-z0-9-]{16,64}$/.test(vid)) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const hashed = createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:visit:${vid}`).digest("hex").slice(0, 40);
  try {
    const counts = await createDb(config).recordVisit(kstDay(new Date()), hashed);
    if (!counts) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    return NextResponse.json(counts, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
