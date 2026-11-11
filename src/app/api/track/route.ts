import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { kstDay } from "@/lib/db/kst";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { isTrackEvent } from "@/lib/visitTrack";

export const runtime = "nodejs";

/**
 * 핵심 행동(한마디 열람·뽑기·로그인 클릭 등)을 익명 ID 로 하루 한 번만 세요. 정해진 이름만 받고, 입력값은 받지 않아요.
 * 실패해도 화면엔 영향이 없어요.
 */
export async function POST(request: Request) {
  const blocked = guardOrigin(request);
  if (blocked) return blocked;
  const denied = await enforceLimits(request, { name: "track", windowMs: 60000, ip: 60, user: 60 });
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { vid?: unknown; event?: unknown } | null;
  const vid = typeof body?.vid === "string" ? body.vid : "";
  const event = body?.event;
  if (!/^[A-Za-z0-9-]{16,64}$/.test(vid) || !isTrackEvent(event)) return NextResponse.json({ error: "요청이 올바르지 않아. 다시 한 번 확인해 줘." }, { status: 400 });

  const config = loadDbConfig(process.env);
  if (config) {
    const hashed = createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:visit:${vid}`).digest("hex").slice(0, 40);
    try {
      await createDb(config).recordVisitEvent(kstDay(new Date()), hashed, event);
    } catch {
      // 함수를 아직 안 만들었어도 서비스엔 영향 없어요
    }
  }
  return new NextResponse(null, { status: 204 });
}
