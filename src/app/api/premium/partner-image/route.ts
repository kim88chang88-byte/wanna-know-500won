import { NextResponse } from "next/server";
import { AI_IMAGE_NOTICE, ageOn, estimateCostUsd, generateImage, partnerAgeFor, spousePrompt, type Element5 } from "@/lib/ai/image";
import { takeAiBudget } from "@/lib/ai/budget";
import { isAdmin } from "@/lib/admin/auth";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { hasEntitlement, ENTITLEMENT_COOKIE } from "@/lib/premium/entitlement";
import { isPremiumLocked } from "@/lib/premium/config";
import { buildPremiumReport, validatePremiumInput } from "@/lib/premium/report";
import { STEMS } from "@/lib/saju/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

/** 용신(첫 글자의 천간)의 오행. 없으면 사주에서 힘이 모자란 쪽 대신 물로 둬요. */
function elementOf(yongsin: string[]): Element5 {
  const s = STEMS.find((x) => x.hanja === yongsin[0]?.[0]);
  return (s?.element as Element5 | undefined) ?? "water";
}

/**
 * 프리미엄 연애·결혼운 쪽에 붙는 "상상 속 인연" 이미지. 글과 따로 받아서, 실패해도 풀이는 그대로 나가요.
 * 규칙(docs/PARTNER_IMAGE.md): 만 20세 미만에게는 만들지 않고, 인물은 항상 성인이에요. 서버의 GEMINI_API_KEY 만 써요.
 * 응답: { image: { src, notice, alt, usd } } 또는 { image: null, reason }
 */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "partner-image", windowMs: 600_000, ip: 4, user: 8 }, "이미지 요청이 너무 많아요. 잠시 뒤에 다시 시도해 주세요."));
  if (denied) return denied;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ image: null, reason: "bad_request" }, { status: 400 });
  }
  const parsed = validatePremiumInput(raw);
  if (!parsed.ok) return NextResponse.json({ image: null, reason: "bad_request" }, { status: 400 });
  const none = (reason: string) => NextResponse.json({ image: null, reason });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return none("no_key");

  const cookieHeader = request.headers.get("cookie");
  const session = verifySessionToken(readCookie(cookieHeader, SESSION_COOKIE), process.env.AUTH_SECRET);
  const entitled = hasEntitlement(readCookie(cookieHeader, ENTITLEMENT_COOKIE), process.env.AUTH_SECRET, session?.sub ?? null);
  // 결제 오픈 뒤에는 이용권이 있는 요청에만, AI 게이트가 켜져 있으면 이용권·관리자에게만 줘요.
  if (isPremiumLocked(process.env) && !entitled) return none("locked");
  if (process.env.PREMIUM_AI_GATE?.trim().toLowerCase() === "true" && !entitled && !isAdmin(session?.sub, process.env)) return none("gated");

  const g = parsed.value.gender;
  if (g !== "male" && g !== "female") return none("gender");
  // 음력 입력은 날짜가 조금 어긋날 수 있어서, 만 나이를 한 살 적게 잡아 미성년자를 걸러내요.
  const age = ageOn(parsed.value, new Date()) - (parsed.value.calendar === "lunar" ? 1 : 0);
  const partnerAge = partnerAgeFor(g, age);
  if (!partnerAge) return none("minor");

  try {
    const dbCfg = loadDbConfig(process.env);
    const gate = await takeAiBudget(process.env, dbCfg ? createDb(dbCfg) : null);
    if (gate !== "ok") return none("budget");
    const report = buildPremiumReport(parsed.value, new Date(), "full", parsed.topic, false, parsed.concern, null);
    const el = elementOf(report.yongsin);
    const partner = g === "male" ? "female" : "male";
    const seed = (parsed.value.year * 400 + parsed.value.month * 31 + parsed.value.day) % 6;
    const r = await generateImage(spousePrompt(partner, el, partnerAge, seed), apiKey, { model: process.env.GEMINI_IMAGE_MODEL?.trim() || undefined, timeoutMs: 45_000 });
    if (!r.ok) {
      console.error("partner image failed:", r.error.slice(0, 200));
      return none("failed");
    }
    const usd = estimateCostUsd(r.usage);
    return NextResponse.json({
      image: { src: `data:${r.mime};base64,${r.base64}`, notice: AI_IMAGE_NOTICE, alt: "사주로 그려 본 상상 속 인연", usd },
    });
  } catch (err) {
    console.error("partner image error:", err instanceof Error ? err.message : "unknown");
    return none("failed");
  }
}
