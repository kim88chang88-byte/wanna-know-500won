import type { BirthInput } from "@/lib/saju/types";

/*
 * "도리에게 더 물어보기" 대화방으로 넘기는 맥락. 들어온 곳(오늘 카드·500원 결과서·궁합 결과서)에 따라
 * 도리가 미리 아는 내용이 달라져요. 브라우저의 세션 저장소(탭을 닫으면 사라져요)에만 잠깐 두고 서버에 저장하지 않아요.
 */

export type ChatKind = "daily" | "reading" | "compat";

export interface ChatCtx {
  kind: ChatKind;
  /** 방금 본 풀이의 핵심 요약 (서버가 다시 한 번 길이를 줄여요) */
  summary: string;
  /** 결과서에서 들어올 때만: 풀이를 본 사람의 생년월일시. 오늘 카드는 저장된 내 정보를 서버가 읽어요. */
  birth?: BirthInput;
  /** 궁합에서만 */
  partnerBirth?: BirthInput;
  partnerName?: string;
  /** 부르는 이름 */
  name?: string | null;
}

export interface ChatMsg {
  role: "user" | "dori";
  text: string;
}

export const CHAT_CTX_KEY = "wanna500:chat:ctx:v1";
export const CHAT_LOG_KEY = "wanna500:chat:log:v1";
export const SUMMARY_MAX = 1500;
export const MSG_MAX = 400;
export const HISTORY_MAX = 8;
/** 한 대화에서 사용자가 보낼 수 있는 질문 수(처음 열 때 관리자 한정, 이후 무료·유료 횟수로 대체) */
export const TURN_CAP = 12;

export function saveChatCtx(ctx: ChatCtx): void {
  try {
    sessionStorage.setItem(CHAT_CTX_KEY, JSON.stringify(ctx));
    sessionStorage.removeItem(CHAT_LOG_KEY);
  } catch {
    /* 저장 실패는 무시: 대화방이 맥락 없이 열려요 */
  }
}

export function readChatCtx(): ChatCtx | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(CHAT_CTX_KEY) ?? "null") as Partial<ChatCtx> | null;
    if (v && (v.kind === "daily" || v.kind === "reading" || v.kind === "compat") && typeof v.summary === "string") return v as ChatCtx;
  } catch {
    /* 깨진 값은 없는 것으로 */
  }
  return null;
}

/** 결과(PremiumReportView 와 같은 모양에서 필요한 것만)를 짧은 요약글로 줄여요. AI 에게는 데이터로만 가요. */
export function summarizeReport(r: {
  topic?: { label?: string; headline?: string; points?: { title: string; body: string }[] } | null;
  concern?: { text?: string } | null;
  compat?: { score: number; headline: string; relation?: string | null; summary?: string; ai?: { answer?: string } } | null;
}): string {
  const lines: string[] = [];
  if (r.concern?.text) lines.push(`고민: ${r.concern.text.slice(0, 200)}`);
  if (r.topic?.label) lines.push(`주제: ${r.topic.label}`);
  if (r.topic?.headline) lines.push(`한 줄 결론: ${r.topic.headline}`);
  for (const p of (r.topic?.points ?? []).slice(0, 3)) lines.push(`- ${p.title}: ${p.body.slice(0, 120)}`);
  if (r.compat) {
    lines.push(`궁합 점수: ${r.compat.score}점${r.compat.relation ? ` (${r.compat.relation})` : ""}`);
    lines.push(`궁합 한 줄: ${r.compat.headline}`);
    const t = r.compat.ai?.answer ?? r.compat.summary;
    if (t) lines.push(`궁합 요약: ${t.slice(0, 400)}`);
  }
  return lines.join("\n").slice(0, SUMMARY_MAX);
}
