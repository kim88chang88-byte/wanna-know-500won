import type { PremiumReportView } from "@/lib/premium/types";
import type { BirthInput } from "@/lib/saju/types";

/** 생년월일시 한 줄 요약 (예: "1988.12.29 (양력) 시간 모름 · 남성") */
export function birthSummary(b: BirthInput): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const cal = b.calendar === "lunar" ? `음력${b.isLeapMonth ? " 윤달" : ""}` : "양력";
  const time = b.hour !== null && b.hour !== undefined ? `${pad(b.hour)}:${pad(b.minute ?? 0)}` : "시간 모름";
  return `${b.year}.${pad(b.month)}.${pad(b.day)} (${cal}) ${time} · ${b.gender === "female" ? "여성" : "남성"}`;
}

/** 이야기 순서로 보여 줄 풀이인가 (프리미엄 10쪽 책은 기존 화면 그대로) */
export function isStoryReport(r: PremiumReportView): boolean {
  return !(r.level === "full" && r.book.length > 0);
}

/** "~예요." 까지 첫 문장만 (접어 둔 제목 아래 미리보기용). 없으면 통째로. */
export function firstSentence(s: string): string {
  const m = /^[\s\S]*?[.!?](?=\s|$)/.exec(s.trim());
  return (m ? m[0] : s).trim();
}


/**
 * 긴 글을 문단으로 나눠요. AI 가 빈 줄(\n\n)로 나눠 줬으면 그대로 쓰고,
 * 한 덩어리로 왔으면 문장 2~3개씩 묶어서 읽기 편하게 끊어요.
 */
export function toParagraphs(text: string): string[] {
  const t = text.replace(/\r/g, "").trim();
  if (!t) return [];
  const given = t.split(/\n{2,}/).map((x) => x.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  if (given.length > 1 || t.length <= 130) return given;
  const sentences = t.match(/[^.!?…~]+[.!?…~]+(?:\s*[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]+)?|[^.!?…~]+$/gu)?.map((x) => x.trim()).filter(Boolean) ?? [t];
  const out: string[] = [];
  let cur: string[] = [];
  let len = 0;
  for (const sen of sentences) {
    cur.push(sen);
    len += sen.length;
    if (cur.length >= 3 || len >= 110) {
      out.push(cur.join(" "));
      cur = [];
      len = 0;
    }
  }
  if (cur.length) {
    if (out.length > 0 && cur.join(" ").length < 40) out[out.length - 1] += " " + cur.join(" ");
    else out.push(cur.join(" "));
  }
  return out;
}

/** 받침 있으면 "이에요", 없으면 "예요" */
export function iyeyo(word: string): string {
  const c = word.trim().slice(-1).charCodeAt(0);
  const batchim = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  return batchim ? "이에요" : "예요";
}

const escapeRe = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 글 맨 앞에 화면 제목을 그대로 따라 쓴 경우("그렇지만 이건 조금 부족해요. …")만 떼어 내요. */
export function stripTitleEcho(text: string, title: string): string {
  const chars = Array.from(title.replace(/[\s?!.~]/g, ""));
  if (chars.length === 0) return text;
  const re = new RegExp(`^\\s*${chars.map(escapeRe).join("\\s*")}\\s*[?!.~,:·—-]*\\s*`);
  const out = text.replace(re, "");
  return out.length >= 20 ? out : text;
}

/** 끝이 끊긴 문장("그래서 친구들 사이에서도")은 마지막 완성 문장까지만 남겨요. 완성 문장이 없으면 그대로. */
export function trimToLastSentence(text: string): string {
  const t = text.trim();
  const tail = "[\\u{1F300}-\\u{1FAFF}\\u2600-\\u27BF\\uFE0F\\s\"'”’)]*";
  if (new RegExp(`[.!?…~]${tail}$`, "u").test(t)) return t;
  const m = new RegExp(`^[\\s\\S]*[.!?…~]${tail}`, "u").exec(t);
  return m ? m[0].trim() : t;
}

/** 요약 문단 맨 앞의 "요약하자면," 같은 말머리를 떼어요. (제목에 이미 있어요) */
export function stripSummaryLead(text: string): string {
  const out = text.replace(/^\s*요약하자면\s*[,:.·]?\s*/, "");
  return out.length >= 20 ? out : text;
}

export const FOLD_TITLES = {
  elements: "오행으로 보는 사주",
  self: "나는 어떤 사람인가?",
  praise: "이건 정말 칭찬해요",
  lack: "그렇지만 이건 조금 부족해요",
  flow: "올해와 이번 달의 흐름",
  improve: "이렇게 개선해 보아요",
} as const;

/** 접이식 글 한 편을 화면에 맞게 다듬어요. */
export function tidyFold(key: keyof typeof FOLD_TITLES | "lucky", text: string): string {
  const base = key === "lucky" ? text : stripTitleEcho(text, FOLD_TITLES[key]);
  return trimToLastSentence(base);
}
