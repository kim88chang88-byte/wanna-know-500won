import type { BookSection, PremiumReportView } from "./types";

/** 두 번째 요청으로 받은 새 본문을 쪽 번호에 맞춰 리포트에 끼워 넣어요. */
export function mergeChapters(report: PremiumReportView, replaced: Record<string, BookSection[]> | undefined): PremiumReportView {
  if (!replaced || Object.keys(replaced).length === 0) return report;
  return { ...report, book: report.book.map((p) => (replaced[String(p.no)] ? { ...p, sections: replaced[String(p.no)] } : p)) };
}

/** 나머지 장을 이어서 받아요. 실패하면 null (이미 보이는 리포트는 그대로 둬요). */
export async function fetchRestChapters(body: unknown, signal?: AbortSignal): Promise<Record<string, BookSection[]> | null> {
  try {
    const res = await fetch("/api/premium", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...(body as object), chapterBatch: 2 }),
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { replaced?: Record<string, BookSection[]> } | null;
    return data?.replaced ?? null;
  } catch {
    return null;
  }
}
