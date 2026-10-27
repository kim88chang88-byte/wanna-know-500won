import { NextResponse } from "next/server";
import { TOPIC_LABEL, normalizeTopic } from "@/lib/ai/reading";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const revalidate = 300;

/** 메인 화면에 보여 줄 후기. 이용자가 공개에 동의한 후기만, 이름 없이 별점·글·주제만 내려보내요. 못 읽으면 빈 목록이에요. */
export async function GET() {
  const dbConfig = loadDbConfig(process.env);
  if (!dbConfig) return NextResponse.json({ reviews: [] });
  try {
    const rows = await createDb(dbConfig).listPublicReviews(12);
    const reviews = rows.map((r) => ({ id: r.id, rating: r.rating, text: r.review_text, topic: TOPIC_LABEL[normalizeTopic(r.topic)] }));
    return NextResponse.json({ reviews }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch (err) {
    console.error("public reviews failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ reviews: [] });
  }
}
