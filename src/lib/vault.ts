import { createHash } from "node:crypto";
import type { PremiumReportView } from "@/lib/premium/types";
import { normalizeTopic, TOPIC_LABEL } from "@/lib/ai/reading";

/*
 * 내 보관함: 로그인한 회원이 본 풀이를 그대로 저장해 두고 다시 봐요. (다시 볼 때는 계산도 AI 도 부르지 않아요)
 * 저장하는 건 화면에 보였던 결과(사주 리포트 + 도리 한마디/이유)뿐이에요. 생년월일 원본 입력은 담지 않아요.
 */

export const MAX_VAULT_ITEMS = 300;
export const MAX_VAULT_BYTES = 700_000;

export interface VaultCard {
  keyword: string;
  score: number;
  summary: string;
  indicators: Array<{ label: string; score: number; comment: string }>;
}

export interface VaultSnapshot {
  v: 1;
  topic: string;
  premium: boolean;
  report: PremiumReportView;
  /** 도리의 풀이 카드(키워드·총운·세 지표). 없으면 null */
  card: VaultCard | null;
  /** 도리 한마디/이유 (없으면 null) */
  kkotgeoji: string | null;
  reason: string | null;
  /** "요약하자면" 문단 (없으면 null) */
  story?: string | null;
  /** 접이식 풀이 글 */
  folds?: Record<string, string> | null;
  /** 접이식 항목 한 줄 제목 */
  heads?: Record<string, string> | null;
  /** 출생지·절기 경계 안내 문구 */
  note: string | null;
}

export interface ParsedVault {
  snapshot: VaultSnapshot;
  title: string;
  summary: string | null;
  payloadHash: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max: number): string | null => (typeof v === "string" && v.trim() ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max) : null);

const stars = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5 ? v : null);

/** 화면에 보였던 도리의 풀이 카드를 저장용으로 간추려요. 모양이 이상하면 null. */
function parseCard(raw: unknown): VaultCard | null {
  if (!isRecord(raw) || !isRecord(raw.total)) return null;
  const keyword = text(raw.keyword, 40);
  const summary = text(raw.total.summary, 300);
  const score = stars(raw.total.score);
  if (!keyword || !summary || score === null) return null;
  const indicators = (Array.isArray(raw.indicators) ? raw.indicators : [])
    .map((i) => (isRecord(i) && stars(i.score) !== null && text(i.label, 20) && text(i.comment, 300) ? { label: text(i.label, 20)!, score: stars(i.score)!, comment: text(i.comment, 300)! } : null))
    .filter((i): i is NonNullable<typeof i> => i !== null)
    .slice(0, 3);
  return { keyword, score, summary, indicators };
}

const FOLD_KEYS = ["elements", "self", "praise", "lack", "flow", "improve", "lucky"] as const;

function parseFolds(raw: unknown, max = 900): Record<string, string> | null {
  if (!isRecord(raw)) return null;
  const out: Record<string, string> = {};
  for (const k of FOLD_KEYS) {
    const t = text(raw[k], max);
    if (t) out[k] = t;
  }
  return Object.keys(out).length ? out : null;
}

/** 요청 본문을 검사해 저장할 모양으로 바꿔요. 이상하면 null. (본인 보관함에만 들어가는 값이라 모양만 확인해요) */
export function parseVaultBody(raw: unknown, now: Date = new Date()): ParsedVault | null {
  if (!isRecord(raw) || !isRecord(raw.report)) return null;
  const r = raw.report;
  if (!Array.isArray(r.pillars) || r.pillars.length !== 4 || !isRecord(r.strength) || !isRecord(r.topic) || !Array.isArray(r.elements)) return null;
  const topic = normalizeTopic(raw.topic);
  const card = parseCard(raw.reading);
  const snapshot: VaultSnapshot = {
    v: 1,
    topic,
    premium: raw.premium === true,
    report: r as unknown as PremiumReportView,
    card,
    kkotgeoji: text(raw.kkotgeoji, 300),
    reason: text(raw.reason, 400),
    story: text(raw.story, 1200),
    folds: parseFolds(raw.folds),
    heads: parseFolds(raw.heads, 80),
    note: text(raw.note, 400),
  };
  const body = JSON.stringify(snapshot);
  if (body.length > MAX_VAULT_BYTES) return null;
  const kst = new Date(now.getTime() + 9 * 3600_000);
  const date = `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`;
  const label = (r as { compat?: unknown }).compat ? "둘의 궁합" : TOPIC_LABEL[topic];
  return {
    snapshot,
    title: `${label}${snapshot.premium ? " · 프리미엄" : ""} · ${date}`,
    summary: snapshot.kkotgeoji ?? text(r.summary, 200),
    // 하루 안에 같은 결과를 또 저장하지 않게, 날짜(KST 일 단위)를 섞어요. 다른 날 다시 본 결과는 따로 남아요.
    payloadHash: createHash("sha256").update(date).update(body).digest("hex"),
  };
}

/** 보관함에서 꺼낸 값이 화면에 그릴 수 있는 모양인지 확인해요. */
export function asSnapshot(v: unknown): VaultSnapshot | null {
  if (!isRecord(v) || v.v !== 1 || !isRecord(v.report) || !Array.isArray((v.report as Record<string, unknown>).pillars)) return null;
  return v as unknown as VaultSnapshot;
}
