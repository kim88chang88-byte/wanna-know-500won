import { NextResponse } from "next/server";
import { partnerImageKey, partnerImageExists, partnerPublicUrl, variantFor, variantOrder } from "@/lib/ai/partnerStore";
import { AI_IMAGE_NOTICE, ageOn, estimateCostUsd, generateImage, partnerAgeFor, spousePrompt, type Element5 } from "@/lib/ai/image";
import { takeAiBudget } from "@/lib/ai/budget";
import { isAdmin } from "@/lib/admin/auth";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { requireLogin } from "@/lib/auth/requireLogin";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { hasEntitlement, ENTITLEMENT_COOKIE } from "@/lib/premium/entitlement";
import { isPremiumLocked } from "@/lib/premium/config";
import { buildPremiumReport, validatePremiumInput } from "@/lib/premium/report";
import { chapterName } from "@/lib/ai/bookChapter";
import { partnerProfile, partnerTitle, profileSeed } from "@/lib/premium/partnerProfile";
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
 * 응답: { image: { src, notice, alt, usd } | null, profile, title, reason? } (이미지가 실패해도 프로필은 줘요. 미성년·잠금 등은 { image: null, reason })
 */
export async function POST(request: Request) {
  const originDenied = guardOrigin(request);
  if (originDenied) return originDenied;
  const loginNeeded = requireLogin(request);
  if (loginNeeded) return loginNeeded;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ image: null, reason: "bad_request" }, { status: 400 });
  }
  const parsed = validatePremiumInput(raw);
  if (!parsed.ok) return NextResponse.json({ image: null, reason: "bad_request" }, { status: 400 });
  const none = (reason: string) => NextResponse.json({ image: null, reason });

  const cookieHeader = request.headers.get("cookie");
  const session = verifySessionToken(readCookie(cookieHeader, SESSION_COOKIE), process.env.AUTH_SECRET);
  const admin = isAdmin(session?.sub, process.env);
  const entitled = hasEntitlement(readCookie(cookieHeader, ENTITLEMENT_COOKIE), process.env.AUTH_SECRET, session?.sub ?? null);
  // 결제 오픈 뒤에는 이용권이 있는 요청에만 줘요.
  if (isPremiumLocked(process.env) && !entitled) return none("locked");

  const g = parsed.value.gender;
  if (g !== "male" && g !== "female") return none("gender");
  // 음력 입력은 날짜가 조금 어긋날 수 있어서, 만 나이를 한 살 적게 잡아 미성년자를 걸러내요.
  const age = ageOn(parsed.value, new Date()) - (parsed.value.calendar === "lunar" ? 1 : 0);
  const partnerAge = partnerAgeFor(g, age);
  if (!partnerAge) return none("minor");

  // 프로필 글은 규칙으로 만들어서 비용이 없어요. 그림을 못 만드는 어떤 경우에도 프로필은 보여 줘요.
  const el = elementOf(buildPremiumReport(parsed.value, new Date(), "full", parsed.topic, false, parsed.concern, null).yongsin);
  const partner = g === "male" ? "female" : "male";
  const seed = (parsed.value.year * 400 + parsed.value.month * 31 + parsed.value.day) % 6;
  const variant = variantFor({ year: parsed.value.year, month: parsed.value.month, day: parsed.value.day, hour: parsed.value.hour });
  const profile = partnerProfile(partner, el, profileSeed(parsed.value));
  const title = partnerTitle(chapterName(session?.nick));
  const noImage = (reason: string) => NextResponse.json({ image: null, profile, title, reason });

  // 서버에 저장해 둔 이미지가 있으면 AI 를 부르지 않고 그것을 줘요. (조합 180가지 × 1장, 비용 0원)
  const store = loadDbConfig(process.env);
  if (store) {
    const keys = variantOrder(variant).map((v) => partnerImageKey(partner, partnerAge, el, seed, v));
    const has = await Promise.all(keys.map((k) => partnerImageExists(store.url, k)));
    const idx = has.indexOf(true);
    if (idx >= 0) {
      return NextResponse.json({ image: { src: partnerPublicUrl(store.url, keys[idx]), notice: AI_IMAGE_NOTICE, alt: title, usd: 0 }, profile, title });
    }
  }
  // 저장된 이미지만 쓰기로 했다면(PARTNER_IMAGE_STORED_ONLY=true) 없는 조합은 글 프로필만 보여 줘요.
  if (process.env.PARTNER_IMAGE_STORED_ONLY?.trim().toLowerCase() === "true") return noImage("not_stored");

  // 그림은 비용이 드니까 요청 횟수를 제한해요. (관리자는 테스트하기 쉽게 제외)
  if (!admin) {
    const limited = await enforceLimits(request, { name: "partner-image", windowMs: 600_000, ip: 4, user: 8 }, "이미지 요청이 너무 많아. 잠시 뒤에 다시 시도해 줘.");
    if (limited) return noImage("rate");
  }
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return noImage("no_key");
  // AI 게이트가 켜져 있으면 그림은 이용권·관리자에게만 줘요.
  if (process.env.PREMIUM_AI_GATE?.trim().toLowerCase() === "true" && !entitled && !admin) return noImage("gated");

  try {
    const dbCfg = loadDbConfig(process.env);
    const gate = await takeAiBudget(process.env, dbCfg ? createDb(dbCfg) : null);
    if (gate !== "ok") return noImage("budget");
    const r = await generateImage(spousePrompt(partner, el, partnerAge, seed, variant), apiKey, { model: process.env.GEMINI_IMAGE_MODEL?.trim() || undefined, timeoutMs: 45_000 });
    if (!r.ok) {
      console.error("partner image failed:", r.error.slice(0, 200));
      return noImage("failed");
    }
    const usd = estimateCostUsd(r.usage);
    return NextResponse.json({
      image: { src: `data:${r.mime};base64,${r.base64}`, notice: AI_IMAGE_NOTICE, alt: title, usd },
      profile,
      title,
    });
  } catch (err) {
    console.error("partner image error:", err instanceof Error ? err.message : "unknown");
    return noImage("failed");
  }
}
