import type { PremiumReportView, TopicKey } from "@/lib/premium/types";

/** 화면 크기(360×640)를 3배로 그려서 인스타 스토리 규격(1080×1920)으로 저장해요. */
export const CARD_W = 360;
export const CARD_H = 640;
export const CARD_SCALE = 3;

/** 프리미엄 카드에만 들어가는 사주 정보 */
export interface LuxeData {
  /** 연·월·일·시 순서의 간지 두 글자. 시간을 모르면 null */
  pillars: [string | null, string | null, string | null, string | null];
  /** 예: "己卯 일주" */
  dayLabel: string;
  /** 예: "신강 · 종왕격" */
  structure: string;
}

export interface PhotoCardData {
  /** basic: 파스텔 폴라로이드 / premium: 럭셔리 골드 카드 */
  tier: "basic" | "premium";
  luxe: LuxeData | null;
  topic: TopicKey;
  topicLabel: string;
  headline: string;
  /** 도리의 한마디(AI 풀이가 있으면 그 문장, 없으면 주제별 기본 문구) */
  quote: string;
  tags: string[];
  lucky: { color: string; hex: string; direction: string };
  /** 예: "2026.10.18" */
  dateLabel: string;
  /** 카드 아래에 작게 넣는 주소 (예: wanna-know-500won.vercel.app) */
  siteLabel: string;
}

export function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

/** 카드에 들어가는 한마디 길이 제한. 너무 길면 카드가 답답해져서 자연스러운 곳에서 잘라요. */
export const MAX_QUOTE = 64;

export function clipQuote(s: string, max = MAX_QUOTE): string {
  const t = s.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/\s+/g, " ").trim();
  if (Array.from(t).length <= max) return t;
  const cut = Array.from(t).slice(0, max).join("");
  const end = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"), cut.lastIndexOf("요"));
  return (end >= max * 0.5 ? cut.slice(0, end + 1) : cut.trimEnd() + "…").trim();
}

export function buildPhotoCardData(report: PremiumReportView, opts: { date: Date; siteLabel: string; aiQuote?: string | null }): PhotoCardData {
  const t = report.topic;
  const ai = opts.aiQuote ? clipQuote(opts.aiQuote) : "";
  const premium = report.level === "full" && report.book.length > 0;
  const byKey = (k: string) => report.pillars.find((p) => p.key === k)?.full ?? null;
  return {
    tier: premium ? "premium" : "basic",
    luxe: premium
      ? {
          pillars: [byKey("year"), byKey("month"), byKey("day"), byKey("hour")],
          dayLabel: `${byKey("day") ?? ""} 일주`,
          structure: [report.strength.grade, report.geukguk].filter(Boolean).join(" · "),
        }
      : null,
    topic: t.key,
    topicLabel: t.label,
    headline: t.headline,
    quote: ai || t.quote,
    tags: t.tags,
    lucky: { color: t.lucky.color, hex: t.lucky.hex, direction: t.lucky.direction },
    dateLabel: formatDate(opts.date),
    siteLabel: opts.siteLabel,
  };
}

/** 캔버스는 글자를 읽을 수 없으니, 같은 내용을 화면 읽기 프로그램용 설명으로도 만들어 둡니다. */
export function photoAltText(c: PhotoCardData): string {
  return `${c.tier === "premium" ? "프리미엄 " : ""}${c.topicLabel} 포토카드. ${c.headline}. 도리의 한마디: ${c.quote}. 행운 컬러 ${c.lucky.color}, 행운 방향 ${c.lucky.direction}. ${c.tags.join(" ")}`;
}

/** SNS에 같이 올릴 문구(해시태그 포함) */
export function shareCaption(c: PhotoCardData, url: string): string {
  return `${c.topicLabel} · ${c.headline}\n“${c.quote}”\n${c.tags.join(" ")} #도리운세사주 ${c.tier === "premium" ? "#프리미엄사주" : "#오늘의운세"}\n${url}`;
}

/** 파일 이름은 영문으로 해요. 일부 브라우저/환경에서 한글 이름이 "download" 로 바뀌는 경우가 있어서요. */
export function photoFileName(topic: TopicKey, date: Date): string {
  return `dori-photocard-${topic}-${formatDate(date).replace(/\./g, "")}.png`;
}
