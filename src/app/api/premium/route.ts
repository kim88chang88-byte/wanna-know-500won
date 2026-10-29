import { hasAiKey } from "@/lib/ai/llm";
import { NextResponse } from "next/server";
import { hasEntitlement, ENTITLEMENT_COOKIE } from "@/lib/premium/entitlement";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { isPremiumLocked } from "@/lib/premium/config";
import { readingFirstDeep } from "@/lib/hanjaReading";
import { buildPremiumReport, validatePremiumInput } from "@/lib/premium/report";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { addBookNotes } from "@/lib/ai/bookNotes";
import { CHAPTER_BATCH_2, CHAPTER_BATCHES, chapterName, rewriteChapters } from "@/lib/ai/bookChapter";
import { takeAiBudget } from "@/lib/ai/budget";
import { isAdmin } from "@/lib/admin/auth";
import { previewBlank } from "@/lib/premium/book/lock";
import { PREVIEW_OPEN_PAGES } from "@/lib/premium/config";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const maxDuration = 60;

/** 기둥 글자처럼 한자 그대로 그려야 하는 칸은 바꾸지 않아요. */
const KEEP_HANJA: ReadonlySet<string> = new Set(["pillars", "dayPillar", "full"]);

export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "premium", windowMs: 60000, ip: 20, user: 40 }, "요청이 너무 빨라요. 잠시 뒤에 다시 시도해 주세요."));
  if (denied) return denied;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request", error: "잘못된 요청입니다." }, { status: 400 });
  }
  // 두 번째 요청: 나머지 장만 AI 로 다시 써서 받아 가요. (장을 두 번에 나눠야 AI 요청 한도에 안 걸려요)
  // chapterBatch: 2~4 이면 그 묶음의 장만 써서 받아 가요. (1은 첫 요청이라 따로 지정하지 않아요)
  const batchRaw = typeof raw === "object" && raw !== null ? (raw as { chapterBatch?: unknown }).chapterBatch : undefined;
  const batchNo = typeof batchRaw === "number" && Number.isInteger(batchRaw) && batchRaw >= 2 && batchRaw <= CHAPTER_BATCHES.length ? batchRaw : 1;
  const second = batchNo >= 2;
  const batchKeys = CHAPTER_BATCHES[batchNo - 1];
  // 미리 보기 요청: 앞 몇 쪽만 풀이하고 나머지는 서버에서 비워서 내려보내요. (이 값은 내용을 줄이기만 하므로 요청자가 정해도 안전해요)
  const preview = typeof raw === "object" && raw !== null && (raw as { preview?: unknown }).preview === true;
  const parsed = validatePremiumInput(raw);
  if (!parsed.ok) return NextResponse.json({ code: "bad_request", error: parsed.error }, { status: 400 });

  if (preview && second) return NextResponse.json({ replaced: {}, chapterNote: "preview", chapterUsage: { in: 0, out: 0, calls: 0 }, aiNotice: false });

  try {
    // 잠금이 켜진 상태(결제 오픈)에서는 서버가 확인한 이용권 쿠키가 있는 요청에만 잠금 없는 전체 풀이를 줘요.
    // 요청 본문의 level 은 "무엇을 보고 싶은지"일 뿐 권한이 아니에요.
    const cookieHeader = request.headers.get("cookie");
    const session = verifySessionToken(readCookie(cookieHeader, SESSION_COOKIE), process.env.AUTH_SECRET);
    const entitled = hasEntitlement(readCookie(cookieHeader, ENTITLEMENT_COOKIE), process.env.AUTH_SECRET, session?.sub ?? null);
    const lock = isPremiumLocked(process.env) && !entitled;
    // PREMIUM_AI_GATE=true 이면 AI 장 풀이(비용이 드는 부분)는 이용권이 있거나 관리자(ADMIN_USER_IDS)인 요청에만 줘요. 꺼 두면 지금처럼 모두에게 줘요.
    const aiGated = process.env.PREMIUM_AI_GATE?.trim().toLowerCase() === "true" && !entitled && !isAdmin(session?.sub, process.env);
    const report = buildPremiumReport(parsed.value, new Date(), parsed.level, parsed.topic, lock, parsed.concern, parsed.partner);
    // 프리미엄(전체) 리포트에는 쪽마다 AI 가 쓴 '도리의 한 줄'을 붙이고, 재물운 장은 AI 가 이 사람 이야기로 다시 써요.
    // 키가 없거나 한도를 넘거나 실패하면 그 부분만 빠지고 기존 풀이가 그대로 나가요.
    report.viewerName = chapterName(session?.nick);
    let chapterNote = "skip";
    const usage = { in: 0, out: 0, calls: 0 };
    if (parsed.level === "full" && report.book.length > 0 && hasAiKey() && !aiGated) {
      const dbCfg = loadDbConfig(process.env);
      const db = dbCfg ? createDb(dbCfg) : null;
      const book0 = report.book;
      // 미리 보기는 열려 있는 쪽만 AI 로 써요. (가려질 쪽에는 AI 비용을 쓰지 않아요)
      const openKeys = new Set(book0.filter((p) => p.no < PREVIEW_OPEN_PAGES).map((p) => p.key));
      const notesJob = (async () => {
        if (second) return book0;
        try {
          const gate = await takeAiBudget(process.env, db);
          if (gate === "ok") {
            if (!preview) return await addBookNotes(book0, { kind: parsed.partner ? "compat" : "personal", concern: parsed.concern, name: chapterName(session?.nick) });
            const head = book0.filter((p) => p.no < PREVIEW_OPEN_PAGES);
            const done = await addBookNotes(head, { kind: parsed.partner ? "compat" : "personal", concern: parsed.concern, name: chapterName(session?.nick) });
            return book0.map((p) => done.find((d) => d.no === p.no) ?? p);
          }
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
          return await rewriteChapters(book0, { keys: batchKeys.filter((k) => !preview || openKeys.has(k)), name: chapterName(session?.nick), concern: parsed.concern, onUsage: (u) => { usage.in += u.input; usage.out += u.output; usage.calls++; } });
        } catch (err) {
          console.error("book chapter failed:", err instanceof Error ? err.message : "unknown");
          return null;
        }
      })();
      const [withNotes, chapter] = await Promise.all([notesJob, chapterJob]);
      report.book = withNotes;
      if (chapter) {
        chapterNote = chapter.note;
        if (chapter.note.includes("fail")) console.error("book chapters:", chapter.note.slice(0, 300));
        const rep = chapter.replaced;
        if (Object.keys(rep).length > 0) report.book = report.book.map((p) => (rep[p.no] ? { ...p, sections: rep[p.no] } : p));
      }
    }
    if (preview && parsed.level === "full") {
      report.book = previewBlank(report.book, PREVIEW_OPEN_PAGES);
      // 가려진 쪽의 그림·표에 쓰이는 계산 값도 함께 비워요.
      report.yongsin = [];
      report.gilsin = [];
      report.hyungsin = [];
      report.summary = "";
      report.daeun = null;
      report.concern = null;
    }
    // 프리미엄(개인) 리포트인데 AI 장 풀이를 하나도 못 받았거나 일부 실패했으면 안내 문구를 띄워요.
    const aiDown = !aiGated && parsed.level === "full" && !parsed.partner && !lock && (chapterNote === "skip" || chapterNote.includes("fail"));
    if (second) {
      // 두 번째 요청은 새로 쓴 장의 본문만 돌려줘요.
      const replaced: Record<number, unknown> = {};
      const base = buildPremiumReport(parsed.value, new Date(), parsed.level, parsed.topic, lock, parsed.concern, parsed.partner).book;
      report.book.forEach((p, i) => {
        if (batchKeys.includes(p.key) && JSON.stringify(p.sections) !== JSON.stringify(base[i]?.sections)) replaced[p.no] = p.sections;
      });
      return NextResponse.json(readingFirstDeep({ replaced, chapterNote, chapterUsage: usage, aiNotice: aiDown }, KEEP_HANJA));
    }
    const pendingChapters = !preview && chapterNote !== "skip" && !parsed.partner && parsed.level === "full" && !lock ? CHAPTER_BATCH_2 : [];
    return NextResponse.json(readingFirstDeep({ report, chapterNote, chapterUsage: usage, pendingChapters, aiNotice: aiDown, aiGated: aiGated && parsed.level === "full" && !parsed.partner }, KEEP_HANJA));
  } catch (err) {
    // 없는 날짜(예: 윤달이 없는 해의 윤달)처럼 계산할 수 없는 입력이에요.
    console.error("premium report failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { code: "bad_request", error: "입력한 날짜로는 리포트를 만들 수 없어요. 생년월일(음력·윤달 포함, 궁합이면 상대방 것도)을 다시 확인해 주세요." },
      { status: 400 },
    );
  }
}
