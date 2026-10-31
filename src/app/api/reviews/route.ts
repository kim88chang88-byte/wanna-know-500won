import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeTopic } from "@/lib/ai/reading";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { parseReview } from "@/lib/reviews";
import { isRewardableText, REWARD_KIND, REWARD_MONTH_CAP, rewardRef, type RewardResult } from "@/lib/reviewReward";

export const runtime = "nodejs";

/** 사용후기 저장. 로그인하지 않아도 남길 수 있고, 로그인했다면 회원과 연결해서 탈퇴 때 함께 지워요. */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "reviews", windowMs: 3600000, ip: 10, user: 10 }, "후기를 너무 자주 남기고 있어요. 잠시 뒤에 다시 시도해 주세요."));
  if (denied) return denied;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const review = parseReview(body);
  if (!review) return NextResponse.json({ error: "별점을 골라 주세요." }, { status: 400 });

  const dbConfig = loadDbConfig(process.env);
  if (!dbConfig) return NextResponse.json({ error: "지금은 후기를 받을 수 없어요." }, { status: 503 });

  const o = body as Record<string, unknown>;
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  const db = createDb(dbConfig);
  try {
    if (session) await db.ensureUser(session.sub, session.nick);
    await db.insertReview({ userId: session?.sub ?? null, review, topic: normalizeTopic(o.topic), premium: o.premium === true });
  } catch (err) {
    console.error("insertReview failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "후기를 저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요." }, { status: 502 });
  }

  // 정성 후기 보상: 로그인한 회원이 40자 이상 정성껏 쓴 후기면 500원 뽑기 코인 1장을 바로 줘요. (보상이 안 돼도 후기는 이미 저장됐어요)
  let reward: RewardResult = "none";
  if (session) {
    if (!isRewardableText(review.text)) {
      reward = "short";
    } else {
      try {
        const r = await db.grantCoinCapped(session.sub, REWARD_KIND, rewardRef(review.text, (v) => createHash("sha256").update(v).digest("hex")), REWARD_MONTH_CAP, 1);
        reward = r.granted ? "granted" : r.reason === "cap" ? "cap" : "dup";
      } catch (err) {
        console.error("review reward failed:", err instanceof Error ? err.message : "unknown");
      }
    }
  }
  return NextResponse.json({ ok: true, reward });
}
