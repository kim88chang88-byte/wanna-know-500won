import type { SajuResult } from "ssaju";
import { STEMS } from "@/lib/saju/constants";
import { ELEMENT_INFO } from "../topic";
import type { BookSection, ElementView } from "../types";

/*
 * 마지막 쪽 "마지막 당부": [슬로건 한 줄] → [개운 부적 카드(색·숫자·방향·물건)] → (AI 편지).
 * 슬로건과 부적은 계산만 써요(AI 없음). 기준 오행은 가장 얇은 오행, 고르게 있으면 용신 오행이에요.
 * 숫자는 하도(河圖)의 생수·성수(목 3·8, 화 2·7, 토 5·10, 금 4·9, 수 1·6)를 따랐어요. 재미로 보는 참고예요.
 */

const EL_OF: Record<string, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
const ORDER = ["목", "화", "토", "금", "수"];

export const TALISMAN: Record<string, { numbers: string; items: string[] }> = {
  목: { numbers: "3 · 8", items: ["작은 화분", "나무 소재 필기구", "초록빛 손수건"] },
  화: { numbers: "2 · 7", items: ["은은한 무드등", "향초", "붉은빛 키링"] },
  토: { numbers: "5 · 10", items: ["도자기 머그컵", "베이지색 파우치", "손에 쥐는 작은 돌"] },
  금: { numbers: "4 · 9", items: ["금속 텀블러", "은빛 액세서리", "하얀 손수건"] },
  수: { numbers: "1 · 6", items: ["물병", "푸른빛 노트", "투명한 유리 소품"] },
};

export const SLOGAN: Record<string, string> = {
  목: "천천히 자라도 괜찮아, 뿌리는 이미 내렸으니까.",
  화: "불씨는 작아도 돼. 꺼지지만 않으면 길이 밝아져.",
  토: "서두르지 않아도 땅은 단단해. 네 자리를 믿고 가.",
  금: "다듬을수록 빛나는 사람이야. 오늘은 한 가지만 정리해 봐.",
  수: "막히면 돌아서 흐르면 돼. 물은 늘 길을 찾으니까.",
};

/** 부적의 기준 오행: 가장 얇은 오행(차이가 2 이상일 때) → 용신 오행 → 가장 얇은 오행 */
export function focusElement(r: SajuResult, elements: ElementView[]): string {
  const list = ORDER.map((n) => ({ n, c: elements.find((e) => e.name === n)?.count ?? 0 }));
  const min = Math.min(...list.map((x) => x.c));
  const max = Math.max(...list.map((x) => x.c));
  const lowest = list.find((x) => x.c === min)?.n ?? "토";
  if (max - min >= 2) return lowest;
  const yong = r.advanced.yongsin.map((y) => EL_OF[STEMS.find((s) => s.hanja === y)?.element ?? ""]).find(Boolean);
  return yong ?? lowest;
}

export function talismanBody(focus: string): string {
  const info = ELEMENT_INFO[focus];
  const t = TALISMAN[focus];
  return [
    `- 색: ${info.color}`,
    `- 숫자: ${t.numbers}`,
    `- 방향: ${info.direction}`,
    `- 물건: ${t.items.join(", ")}`,
    `${focus} 기운을 곁에 두는 작은 부적이야. 전부 할 필요 없이 마음 가는 하나만 가방이나 책상에 두면 충분해. 재미로 보는 참고야.`,
  ].join("\n");
}

/** 마지막 쪽 앞머리 두 토막 */
export function closingCardSections(r: SajuResult, elements: ElementView[]): BookSection[] {
  const f = focusElement(r, elements);
  return [
    { heading: "한 줄 슬로건", body: SLOGAN[f] },
    { heading: "개운 부적 카드", body: talismanBody(f) },
  ];
}
