import type { BookSection, PartnerImageView, PremiumReportView } from "./types";

/** 두 번째 요청으로 받은 새 본문을 쪽 번호에 맞춰 리포트에 끼워 넣어요. */
/** 1쪽(먼저 결론부터)의 결론 글. 뒤 묶음의 19쪽 풀이가 같은 방향으로 쓰이게 넘겨 줘요. */
export function conclusionOf(report: PremiumReportView | null | undefined): string | undefined {
  const body = report?.book.find((p) => p.key === "concernTop")?.sections.find((x) => x.heading === "먼저 결론부터")?.body;
  return body ? body.slice(0, 1400) : undefined;
}

export function mergeChapters(report: PremiumReportView, replaced: Record<string, BookSection[]> | undefined): PremiumReportView {
  if (!replaced || Object.keys(replaced).length === 0) return report;
  return { ...report, book: report.book.map((p) => (replaced[String(p.no)] ? { ...p, sections: replaced[String(p.no)] } : p)) };
}

/** 나머지 장 묶음(2~4번)을 쪽 순서대로 이어서 받아요. 묶음이 올 때마다 onPart 로 알려 줘서 화면에 바로 끼워 넣을 수 있어요. 실패한 묶음은 건너뛰고(이미 보이는 리포트는 그대로), aiNotice 만 켜요. */
export async function fetchRestChapters(
  body: unknown,
  signal?: AbortSignal,
  onPart?: (replaced: Record<string, BookSection[]>) => void,
  batches: number[] = [2, 3, 4],
): Promise<{ replaced: Record<string, BookSection[]> | null; aiNotice: boolean }> {
  const all: Record<string, BookSection[]> = {};
  let aiNotice = false;
  for (const chapterBatch of batches) {
    if (signal?.aborted) break;
    try {
      const res = await fetch("/api/premium", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...(body as object), chapterBatch }),
        signal,
      });
      if (!res.ok) {
        aiNotice = true;
        continue;
      }
      const data = (await res.json().catch(() => null)) as { replaced?: Record<string, BookSection[]>; aiNotice?: boolean } | null;
      if (!data) {
        aiNotice = true;
        continue;
      }
      if (data.aiNotice === true) aiNotice = true;
      if (data.replaced && Object.keys(data.replaced).length > 0) {
        Object.assign(all, data.replaced);
        onPart?.(data.replaced);
      }
    } catch {
      aiNotice = true;
    }
  }
  return { replaced: Object.keys(all).length > 0 ? all : null, aiNotice };
}

/** 연애·결혼운 쪽에 붙일 "운명의 짝" 이미지와 프로필을 받아요. 만 20세 미만·잠금이면 null, 이미지만 실패하면 프로필만 와요. (풀이는 그대로 나가요) */
export async function fetchPartnerImage(body: unknown, signal?: AbortSignal): Promise<PartnerImageView | null> {
  try {
    const res = await fetch("/api/premium/partner-image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as {
      image?: { src?: string; notice?: string; alt?: string } | null;
      profile?: Array<{ label?: unknown; tags?: unknown }>;
      title?: unknown;
    } | null;
    if (!data || typeof data.title !== "string" || !Array.isArray(data.profile)) return null;
    const profile = data.profile
      .filter((r): r is { label: string; tags: string[] } => typeof r.label === "string" && Array.isArray(r.tags) && r.tags.every((t) => typeof t === "string"))
      .map((r) => ({ label: r.label, tags: r.tags.slice(0, 4) }));
    const img = data.image;
    const src = img && typeof img.src === "string" && img.src.startsWith("data:image/") ? img.src : null;
    if (!src && profile.length === 0) return null;
    return { src, notice: img?.notice ?? "AI가 만든 가상의 인물, 참고용 상상도", alt: data.title, title: data.title, profile };
  } catch {
    return null;
  }
}
