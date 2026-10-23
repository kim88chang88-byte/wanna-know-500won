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

