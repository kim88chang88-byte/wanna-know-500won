import type { PublicReading } from "@/lib/ai/reading";

export const CARD_W = 360;
export const CARD_H = 640;
/** 화면 크기(360×640)를 3배로 그려서 인스타 스토리 규격(1080×1920)으로 저장해요. */
export const CARD_SCALE = 3;

export interface CardData {
  keyword: string;
  totalScore: number;
  totalSummary: string;
  kkotgeoji: string;
  /** 점수만. 잠긴 풀이 문장은 카드에 절대 넣지 않아요. */
  indicators: Array<{ label: string; score: number }>;
  topicLabel: string;
  /** 예: "2026.10.16" */
  dateLabel: string;
}

export function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export function buildCardData(reading: PublicReading, topicLabel: string, date: Date): CardData {
  return {
    keyword: reading.keyword,
    totalScore: reading.total.score,
    totalSummary: reading.total.summary,
    kkotgeoji: reading.kkotgeoji,
    indicators: reading.indicators.map((i) => ({ label: i.label, score: i.score })),
    topicLabel,
    dateLabel: formatDate(date),
  };
}

/** 캔버스는 글자를 읽을 수 없으니, 같은 내용을 화면 읽기 프로그램용 설명으로도 만들어 둡니다. */
export function cardAltText(c: CardData): string {
  const inds = c.indicators.map((i) => `${i.label} ${i.score}점`).join(", ");
  return `${c.topicLabel} 캡슐 결과지. 오늘의 키워드 ${c.keyword}. 총운 5점 만점에 ${c.totalScore}점, ${c.totalSummary} ${inds}. 꽃거지의 한마디: ${c.kkotgeoji}`;
}

/** 파일 이름은 영문으로 해요. 일부 브라우저/환경에서 한글 이름이 "download" 로 바뀌는 경우가 있어서요. */
export function cardFileName(date: Date): string {
  return `kkotgeoji-capsule-${formatDate(date).replace(/\./g, "")}.png`;
}
