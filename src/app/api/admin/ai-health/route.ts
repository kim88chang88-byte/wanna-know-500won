import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { activeProvider, aiKey, callLlm, modelFor, type Tier } from "@/lib/ai/llm";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";
export const maxDuration = 60;
const NO_STORE = { "Cache-Control": "no-store" };

const SCHEMA = { type: "object", properties: { ok: { type: "string" } }, required: ["ok"], additionalProperties: false };

/**
 * 관리자 전용: AI 연결 점검. 일반 풀이·프리미엄·상담실 모델에 짧게 한 번씩 물어보고,
 * 어디서 막혔는지(키 없음·모델 이름 오류·한도·서버 오류)를 알려 줘요. (키 값은 보여 주지 않아요)
 */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  if (!isAdmin(session.sub, process.env)) return NextResponse.json({ error: "관리자 권한이 없어." }, { status: 403, headers: NO_STORE });
  const provider = activeProvider(process.env);
  const apiKey = aiKey(process.env);
  if (!apiKey) return NextResponse.json({ provider, keySet: false, hint: `${provider === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY"} 가 비어 있어.` }, { headers: NO_STORE });
  const tiers: Tier[] = ["free", "paid", "chat"];
  const results = await Promise.all(
    tiers.map(async (tier) => {
      const model = modelFor(tier, process.env);
      const t0 = Date.now();
      try {
        const r = await callLlm({ system: "JSON 으로만 답해.", user: '{"ok":"yes"} 로 답해.', schema: SCHEMA, maxTokens: 50, model, apiKey, signal: AbortSignal.timeout(25000) }, process.env);
        const ms = Date.now() - t0;
        if (r.kind === "ok") return { tier, model, status: "ok", ms };
        if (r.kind === "fatal") return { tier, model, status: "fatal", ms, detail: r.detail };
        if (r.kind === "retry") return { tier, model, status: "retry", ms, detail: r.reason };
        return { tier, model, status: "blocked", ms, detail: r.reason };
      } catch (err) {
        return { tier, model, status: "error", ms: Date.now() - t0, detail: err instanceof Error ? err.message.slice(0, 120) : "unknown" };
      }
    }),
  );
  return NextResponse.json({ provider, keySet: true, results }, { headers: NO_STORE });
}
