import type { ElementView } from "../types";

/*
 * 장 제목(익살 제목). "[건강운] 삐걱삐걱, 내 몸 사용 설명서"처럼 분야 이름을 앞에 두고 재미있는 제목을 붙여요.
 * 형식은 "제N장 · 부제 - 큰 제목"(PremiumBook titleParts 가 작은 글씨/큰 제목/부제로 나눠요).
 * 건강운은 가장 약한 오행에 따라 달라지는 "한 줄 제목"을 따로 한 줄 더 보여 줘요. 계산만 쓰고 AI 호출은 없어요.
 */
export const CHAPTER_TITLES = {
  money: "제7장 · 오행으로 보는 돈 그릇. 새는 곳을 막으면 차곡차곡 차올라 - [재물운] 통장아, 오늘은 좀 쌓여 줄래?",
  love: "제8장 · 사주로 보는 사랑의 결. 서두르지 않아도 인연은 제 속도로 와 - [연애·결혼운] 두근두근, 내 마음 번역기",
  career: "제9장 · 사주로 보는 일의 결. 맞는 자리에 서면 가장 빛나 - [직업운] 출근하는 나, 어디에 쓰일 사람일까",
  health: "제10장 · 오행으로 보는 몸. 아껴 쓰면 오래 가 - [건강운] 삐걱삐걱, 내 몸 사용 설명서",
} as const;

/** 가장 약한 오행별 건강운 한 줄 제목 */
const HEALTH_BY_WEAK: Record<string, { title: string; why: string }> = {
  목: { title: "뻣뻣한 나무토막, 스트레칭 한 번만", why: "목 기운이 얇은 편이라 간·눈·근육을 풀어 주면 좋아" },
  화: { title: "손끝발끝 얼음 모드", why: "화 기운이 얇은 편이라 심장과 혈액순환을 따뜻하게 챙기면 좋아" },
  토: { title: "소화기관이 먼저 파업 중", why: "토 기운이 얇은 편이라 위장과 식사 리듬을 챙기면 좋아" },
  금: { title: "환절기마다 오는 콜록 알림", why: "금 기운이 얇은 편이라 호흡기와 피부를 챙기면 좋아" },
  수: { title: "허리와 무릎의 작은 항의", why: "수 기운이 얇은 편이라 신장·허리와 수면을 챙기면 좋아" },
};

/** 오행 분포에서 가장 약한 오행의 한 줄 제목. 모두 고르게 있으면 null. */
export function healthMiniTitle(elements: ElementView[]): string | null {
  const order = ["목", "화", "토", "금", "수"];
  const list = order.map((n) => ({ n, c: elements.find((e) => e.name === n)?.count ?? 0 }));
  if (list.every((x) => x.c === 0)) return null;
  const min = Math.min(...list.map((x) => x.c));
  const max = Math.max(...list.map((x) => x.c));
  if (max - min < 2) return null;
  const weak = list.find((x) => x.c === min);
  const h = weak ? HEALTH_BY_WEAK[weak.n] : null;
  return h ? `네 몸의 한 줄 제목은 “${h.title}”야. ${h.why}.` : null;
}
