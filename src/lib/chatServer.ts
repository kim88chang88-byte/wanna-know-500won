import { isAdmin } from "@/lib/admin/auth";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import type { ChatKind } from "@/lib/chatContext";
import { freeFor, memQuota, scopeFor } from "@/lib/chatQuota";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { resolveBirth } from "@/lib/saju/birthPlace";
import type { BirthInput } from "@/lib/saju/types";

type Db = ReturnType<typeof createDb>;

export function sessionOf(request: Request) {
  return verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
}

/** 상담방을 열어 줄 사람: 기본은 관리자만. CHAT_OPEN=true 로 바꾸면 로그인한 모든 회원에게 열려요. */
export function canChat(sub: string | null | undefined): boolean {
  if (!sub) return false;
  if (process.env.CHAT_OPEN?.trim().toLowerCase() === "true") return true;
  return isAdmin(sub, process.env);
}

export function validBirth(v: unknown): BirthInput | null {
  if (typeof v !== "object" || v === null) return null;
  try {
    return resolveBirth(v as BirthInput).input;
  } catch {
    return null;
  }
}

export interface ParsedCtx {
  kind: ChatKind;
  summary: string;
  name: string | null;
  partnerName: string | null;
  birth: BirthInput | null;
  partnerBirth: BirthInput | null;
}

export function parseCtx(raw: unknown): ParsedCtx | null {
  const c = (raw ?? {}) as { kind?: unknown; summary?: unknown; birth?: unknown; partnerBirth?: unknown; partnerName?: unknown; name?: unknown };
  const kind: ChatKind | null = c.kind === "daily" || c.kind === "reading" || c.kind === "compat" ? c.kind : null;
  if (!kind) return null;
  return {
    kind,
    summary: typeof c.summary === "string" ? c.summary : "",
    name: typeof c.name === "string" ? c.name.slice(0, 12) : null,
    partnerName: typeof c.partnerName === "string" ? c.partnerName.slice(0, 12) : null,
    birth: validBirth(c.birth),
    partnerBirth: kind === "compat" ? validBirth(c.partnerBirth) : null,
  };
}

export function dbOrNull(): Db | null {
  const cfg = loadDbConfig(process.env);
  return cfg ? createDb(cfg) : null;
}

export interface QuotaTarget {
  user: string;
  scope: string;
  free: number;
}

export function targetOf(user: string, ctx: ParsedCtx, now: Date = new Date()): QuotaTarget {
  return { user, scope: scopeFor(ctx.kind, ctx.birth, ctx.partnerBirth, now), free: freeFor(ctx.kind) };
}

/** DB 가 없거나 함수를 아직 안 만들었으면 서버 메모리로 세요. (그래도 최소한의 제한은 돼요) */
export async function quotaLeft(db: Db | null, t: QuotaTarget): Promise<number> {
  if (db) {
    try {
      return await db.chatQuota(t.user, t.scope, t.free);
    } catch (e) {
      console.error("chatQuota failed:", e instanceof Error ? e.message : "unknown");
    }
  }
  return memQuota.get(t.user, t.scope, t.free);
}

/** 질문 1개 사용. 남은 수를 돌려주고, 남은 게 없으면 -1. */
export async function takeQuestion(db: Db | null, t: QuotaTarget): Promise<{ left: number; via: "db" | "mem" }> {
  if (db) {
    try {
      return { left: await db.chatTake(t.user, t.scope, t.free), via: "db" };
    } catch (e) {
      console.error("chatTake failed:", e instanceof Error ? e.message : "unknown");
    }
  }
  return { left: memQuota.take(t.user, t.scope, t.free), via: "mem" };
}

export async function refundQuestion(db: Db | null, t: QuotaTarget, via: "db" | "mem"): Promise<void> {
  try {
    if (via === "db" && db) await db.chatRefund(t.user, t.scope);
    else memQuota.refund(t.user, t.scope);
  } catch {
    /* 돌려주지 못해도 답을 막지는 않아요 */
  }
}
