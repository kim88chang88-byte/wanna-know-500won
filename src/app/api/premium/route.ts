import { NextResponse } from "next/server";
import { hasEntitlement, ENTITLEMENT_COOKIE } from "@/lib/premium/entitlement";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { isPremiumLocked } from "@/lib/premium/config";
import { buildPremiumReport, validatePremiumInput } from "@/lib/premium/report";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { addBookNotes } from "@/lib/ai/bookNotes";
import { chapterName, rewriteChapters } from "@/lib/ai/bookChapter";
import { takeAiBudget } from "@/lib/ai/budget";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "premium", windowMs: 60000, ip: 20, user: 40 }, "요청이 너무 빨라요. 잠시 뒤에 다시 시도해 주세요."));
  if (denied) return denied;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request", error: "잘못된 요청입니다." }, { status: 400 });
  }
  const parsed = validatePremiumInput(raw);
  if (!parsed.ok) return NextResponse.json({ code: "bad_request", error: parsed.error }, { status: 400 });

  try {
    // 잠금이 켜진 상태(결제 오픈)에서는 서버가 확인한 이용권 쿠키가 있는 요청에만 잠금 없는 전체 풀이를 줘요.
    // 요청 본문의 level 은 "무엇을 보고 싶은지"일 뿐 권한이 아니에요.
    const cookieHeader = request.headers.get("cookie");
    const session = verifySessionToken(readCookie(cookieHeader, SESSION_COOKIE), process.env.AUTH_SECRET);
    const entitled = hasEntitlement(readCookie(cookieHeader, ENTITLEMENT_COOKIE), process.env.AUTH_SECRET, session?.sub ?? null);
    const lock = isPremiumLocked(process.env) && !entitled;
    const report = buildPremiumReport(parsed.value, new Date(), parsed.level, parsed.topic, lock, parsed.concern, parsed.partner);
    // 프리미엄(전체) 리포트에는 쪽마다 AI 가 쓴 '도리의 한 줄'을 붙이고, 재물운 장은 AI 가 이 사람 이야기로 다시 써요.
    // 키가 없거나 한도를 넘거나 실패하면 그 부분만 빠지고 기존 풀이가 그대로 나가요.
    let chapterNote = "skip";
    if (parsed.level === "full" && report.book.length > 0 && process.env.ANTHROPIC_API_KEY) {
      const dbCfg = loadDbConfig(process.env);
      const db = dbCfg ? createDb(dbCfg) : null;
      const book0 = report.book;
      const notesJob = (async () => {
        try {
          const gate = await takeAiBudget(process.env, db);
          if (gate === "ok") return await addBookNotes(book0, { kind: parsed.partner ? "compat" : "personal", concern: parsed.concern });
        } catch (err) {
          console.error("book notes failed:", err instanceof Error ? err.message : "unknown");
        }
        return book0;
      })();
      const chapterJob = (async () => {
        if (parsed.partner) return null;
        try {
          const gate = await takeAiBudget(process.env, db);
          if (gate !== "ok") return null;
          return await rewriteChapters(book0, { name: chapterName(session?.nick), concern: parsed.concern });
        } catch (err) {
          console.error("book chapter failed:", err instanceof Error ? err.message : "unknown");
          return null;
        }
      })();
      const [withNotes, chapter] = await Promise.all([notesJob, chapterJob]);
      report.book = withNotes;
      if (chapter) {
        chapterNote = chapter.note;
        const rep = chapter.replaced;
        if (Object.keys(rep).length > 0) report.book = report.book.map((p) => (rep[p.no] ? { ...p, sections: rep[p.no] } : p));
      }
    }
    return NextResponse.json({ report, chapterNote });
  } catch (err) {
    // 없는 날짜(예: 윤달이 없는 해의 윤달)처럼 계산할 수 없는 입력이에요.
    console.error("premium report failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { code: "bad_request", error: "입력한 날짜로는 리포트를 만들 수 없어요. 생년월일(음력·윤달 포함, 궁합이면 상대방 것도)을 다시 확인해 주세요." },
      { status: 400 },
    );
  }
}
