import { hasAiKey } from "@/lib/ai/llm";
import { NextResponse } from "next/server";
import { takeAiBudget } from "@/lib/ai/budget";
import { buildCoreFacts } from "@/lib/ai/coreFacts";
import { kstToday } from "@/lib/ai/dailyFacts";
import { interpretDetail } from "@/lib/ai/detail";
import { interpretSaju, ReadingUnavailableError } from "@/lib/ai/interpret";
import { hasEntitlement, ENTITLEMENT_COOKIE } from "@/lib/premium/entitlement";
import { isPremiumLocked } from "@/lib/premium/config";
import { normalizeTopic, toPublicReading, type PublicReading } from "@/lib/ai/reading";
import { hasConcern, parseConcern } from "@/lib/concerns";
import { ageBand } from "@/lib/profile";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { FREE_PER_DAY, isDailyLimitEnforced } from "@/lib/db/config";
import { createDb, loadDbConfig, type DrawCounts } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { adjustNote, boundaryNote, resolveBirth, type BirthAdjust } from "@/lib/saju/birthPlace";
import { calculateSaju } from "@/lib/saju/calculate";
import { SajuInputError } from "@/lib/saju/errors";
import type { BirthInput, SajuChart } from "@/lib/saju/types";

// 풀이(AI 호출)는 오래 걸릴 수 있어서 배포 환경(Vercel)의 함수 제한 시간을 늘려 둬요.
export const maxDuration = 60;

type ReadingStatus = "ok" | "unavailable" | "failed";

/** 글 속에서 부를 이름. 글자·숫자·공백만 남기고 10자까지만 써요. (닉네임은 이용자가 정한 값이라 지시문처럼 쓰이지 않게 걸러요) */
function callName(nick: string | undefined | null): string | null {
  const t = (nick ?? "").replace(/[^0-9A-Za-z가-힣 ]/g, "").trim().slice(0, 10);
  return t || null;
}

export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "reading", windowMs: 60000, ip: 6, user: 12 }, "뽑기가 너무 빨라요. 잠시 뒤에 다시 시도해줘요."));
  if (denied) return denied;

  let body: (BirthInput & { topic?: unknown; concern?: unknown; saveProfile?: unknown; shareConcern?: unknown; premium?: unknown }) | null;
  try {
    body = (await request.json()) as BirthInput & { topic?: unknown; concern?: unknown; saveProfile?: unknown; shareConcern?: unknown; premium?: unknown };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { topic: rawTopic, concern: rawConcern, saveProfile, shareConcern, premium: rawPremium, ...input } = body;
  // 프리미엄 책은 "긴 풀이"(요약하자면·접이식)를 화면에 쓰지 않아서, 그 호출 4번은 건너뛰어 비용을 아껴요.
  const skipDetail = rawPremium === true;
  const concern = parseConcern(rawConcern);

  // 로그인한 회원이고 DB 가 연결되어 있으면, 뽑기 횟수를 서버에서 세요. (아니면 브라우저 카운터만 써요)
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  const dbConfig = loadDbConfig(process.env);
  const db = dbConfig ? createDb(dbConfig) : null;
  const userId = session && db ? session.sub : null;
  let counts: DrawCounts | null = null;
  if (userId && db) {
    try {
      counts = await db.getCounts(userId);
    } catch (err) {
      // DB 가 잠깐 안 되어도 서비스는 계속돼요. (횟수 제한만 건너뛰어요)
      console.error("getCounts failed:", err instanceof Error ? err.message : "unknown");
    }
    if (counts && isDailyLimitEnforced(process.env) && counts.today >= FREE_PER_DAY) {
      return NextResponse.json(
        { error: "오늘의 무료 뽑기는 이미 사용했어요. 결제는 아직 준비 중이에요. 내일 다시 만나요 🫧", code: "free_used", counts },
        { status: 402 },
      );
    }
  }

  // TODO: 결제 확인(500원)을 통과한 요청만 전체 풀이를 주도록 연결. 지금은 항상 무료 공개 범위만 내려가요.

  // 출생지 보정: 보정한 입력으로 계산하고, 저장용 input 에는 birthPlace 를 넣지 않아요.
  const resolved = resolveBirth(input as BirthInput);
  const birthAdjust: BirthAdjust | null = resolved.adjust;
  const profileInput = { ...(input as BirthInput) };
  delete profileInput.birthPlace;
  delete profileInput.lateZi;
  let chart: SajuChart;
  try {
    chart = calculateSaju(resolved.input);
  } catch (err) {
    if (err instanceof SajuInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("calculateSaju failed", err);
    return NextResponse.json({ error: "사주 계산 중 오류가 발생했어요." }, { status: 500 });
  }

  // 이용자가 직접 동의(선택)한 경우에만 저장해요. 둘 다 풀이와 별개라서, 저장이 실패해도 풀이는 그대로 나가요.
  //  - saveProfile: 로그인한 회원의 생년월일시를 기억 (다음부터 다시 입력하지 않게)
  //  - shareConcern: 고민 내용을 통계에 사용 (로그인 여부와 상관없이, 나이대·성별만 함께 남김)
  let profileSaved = false;
  if (db && userId && saveProfile === true) {
    try {
      await db.ensureUser(userId, session?.nick);
      await db.upsertProfile(userId, { ...profileInput, hour: input.hour ?? null, minute: input.hour == null ? null : (input.minute ?? 0), isLeapMonth: input.calendar === "lunar" && input.isLeapMonth === true });
      profileSaved = true;
    } catch (err) {
      console.error("upsertProfile failed:", err instanceof Error ? err.message : "unknown");
    }
  }
  if (db && shareConcern === true && hasConcern(concern)) {
    try {
      if (userId) await db.ensureUser(userId, session?.nick);
      await db.recordConcern({ userId, topic: normalizeTopic(rawTopic), concern, gender: input.gender, ageBand: ageBand(input.year) });
    } catch (err) {
      console.error("recordConcern failed:", err instanceof Error ? err.message : "unknown");
    }
  }

  // 풀이가 실패해도 계산된 명식은 돌려줘서, 화면이 완전히 비지 않게 해요.
  let reading: PublicReading | null = null;
  let readingStatus: ReadingStatus = "ok";
  let detailInfo: string | null = null;
  try {
    // 키가 있을 때만 비용 한도를 확인해요. 한도를 넘었거나 비상 차단 중이면 AI 한마디만 빼고 사주 리포트는 그대로 나가요.
    if (hasAiKey()) {
      const gate = await takeAiBudget(process.env, db);
      if (gate !== "ok") {
        if (gate === "cap") console.warn("AI daily cap reached");
        throw new ReadingUnavailableError();
      }
    }
    // 오늘의 일진과 사주 핵심(신강/신약·용신 등)을 더해 풀이의 근거를 풍부하게 해요. 계산이 실패해도 풀이는 기본 재료로 나가요.
    const now = new Date();
    const extra = { today: kstToday(now), core: buildCoreFacts(input, now) };
    const topic = normalizeTopic(rawTopic);
    // 긴 "요약하자면" 글은 같은 시간에 따로 써요. 한도를 한 번 더 쓰고, 실패해도 풀이는 그대로 나가요.
    const detailGate = skipDetail ? "premium" : await takeAiBudget(process.env, db);
    let detailStatus = detailGate === "ok" ? "ok" : `skipped:${detailGate}`;
    const detailPromise = detailGate === "ok"
      ? interpretDetail(chart, { topic, gender: input.gender, concern, extra: { ...extra, core: buildCoreFacts(input, now, true), name: callName(session?.nick) } }).catch((err) => {
          console.error("interpretDetail failed:", err instanceof Error ? err.message : "unknown");
          detailStatus = err instanceof Error ? err.message.slice(0, 160) : "failed";
          return null;
        })
      : Promise.resolve(null);
    const [full, detail] = await Promise.all([interpretSaju(chart, { topic, gender: input.gender, concern, extra }), detailPromise]);
    // 세 지표의 풀이 문장은 베타(잠금 꺼짐)에서는 열어 두고, 결제를 연 뒤(PREMIUM_LOCK)에는 이용권이 있는 요청에만 열어요.
    const cookieHeader = request.headers.get("cookie");
    const entitled = hasEntitlement(readCookie(cookieHeader, ENTITLEMENT_COOKIE), process.env.AUTH_SECRET, session?.sub ?? null);
    reading = toPublicReading(full, "free", !isPremiumLocked(process.env) || entitled);
    detailInfo = detail?.warn ? `partial:${detail.warn}` : detailStatus;
    if (detail) reading = { ...reading, ...(detail.story ? { story: detail.story } : {}), folds: detail.folds, heads: detail.heads };
  } catch (err) {
    if (err instanceof ReadingUnavailableError) {
      readingStatus = "unavailable";
    } else {
      readingStatus = "failed";
      console.error("interpretSaju failed:", err instanceof Error ? err.message : "unknown");
    }
  }

  // 뽑기 1회로 기록하는 경우:
  //  - AI 한마디가 정상으로 나갔을 때
  //  - AI 키가 없어서 한마디를 아예 안 쓰는 상태(unavailable)일 때: 이때는 사주 리포트가 서비스 본체라서 그대로 센다
  // AI 호출이 일시적으로 실패한 요청(failed)은 세지 않아요.
  const countable = readingStatus === "unavailable" || (readingStatus === "ok" && reading !== null);
  if (userId && db && countable) {
    try {
      await db.ensureUser(userId, session?.nick);
      await db.recordDraw(userId, normalizeTopic(rawTopic));
      counts = counts ? { today: counts.today + 1, month: counts.month + 1 } : null;
    } catch (err) {
      console.error("recordDraw failed:", err instanceof Error ? err.message : "unknown");
    }
  }

  return NextResponse.json({ chart, reading, readingStatus, detailInfo, counts, profileSaved, birthAdjust, birthAdjustNote: birthAdjust ? adjustNote(birthAdjust) : null, boundaryNote: boundaryNote(input as BirthInput) });
}
