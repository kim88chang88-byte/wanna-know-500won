import { STEMS } from "@/lib/saju/constants";
import type { SajuChart } from "@/lib/saju/types";
import { analyzeChart } from "@/lib/saju/analysis";
import type { ChatMsg } from "@/lib/chatContext";
import type { DailyFacts } from "./dailyFacts";
import { artFor } from "@/lib/foodArt";

/*
 * 상담실 "오늘 뭐 먹지 / 취미 추천": 후보는 코드가 오행으로 정하고, AI 는 그 안에서 골라 말투로 풀어요.
 * 표에 없는 음식·취미를 사주 근거로 말하지 않게 하려는 거예요. 참고용이고, 건강·치료·다이어트 말은 하지 않아요.
 * (표 내용은 재홍님 검토 대상: 프로젝트 문서 "상담실-메뉴-취미-추천-본격안")
 */

export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export type Meal = "아침" | "점심" | "저녁" | "야식";

export const EL_KO: Record<Element, string> = { wood: "나무", fire: "불", earth: "땅", metal: "쇠", water: "물" };
const ORDER: Element[] = ["wood", "fire", "earth", "metal", "water"];

export const MENU: Record<Element, { 아침: string[]; 점심: string[]; 저녁: string[]; 결: string }> = {
  wood: { 아침: ["샐러드", "과일 요거트", "나물 비빔밥"], 점심: ["쌈밥", "비빔국수", "나물 정식"], 저녁: ["채소 샤브샤브", "보쌈과 쌈 채소", "오이·부추 반찬 한 상"], 결: "푸르고 신선한 결로 쑥쑥 자라는 기운을 채워 주는 쪽" },
  fire: { 아침: ["따뜻한 죽", "토스트와 따뜻한 차"], 점심: ["불향 볶음밥", "매콤한 덮밥", "닭갈비"], 저녁: ["삼겹살 구이", "카레", "마라 계열 요리"], 결: "뜨겁고 생기 있는 결로 열정 기운을 데워 주는 쪽" },
  earth: { 아침: ["고구마", "단호박죽", "곡물 시리얼"], 점심: ["비빔밥", "곡물밥 정식", "감자 요리"], 저녁: ["찜닭", "수육", "카레"], 결: "든든하고 구수한 결로 중심을 잡아 주는 쪽" },
  metal: { 아침: ["배나 사과", "흰죽", "두부 요리"], 점심: ["흰살생선 구이", "두부 정식", "닭가슴살 샐러드"], 저녁: ["담백한 생선구이", "닭백숙", "무 요리"], 결: "담백하고 깔끔한 결로 정리하는 기운을 살리는 쪽" },
  water: { 아침: ["미역국", "따뜻한 두유"], 점심: ["국물 칼국수", "순두부찌개", "해물탕"], 저녁: ["해산물 요리", "전복죽", "검은콩 요리"], 결: "촉촉하고 깊은 국물 결로 유연한 기운을 채워 주는 쪽" },
};

export const HOBBY: Record<Element, { 혼자: string[]; 함께: string[]; 밖: string[]; 결: string }> = {
  wood: { 혼자: ["화분 가꾸기", "스트레칭·요가", "독서"], 함께: ["독서 모임", "원데이 클래스"], 밖: ["가벼운 등산", "공원 산책"], 결: "자라고 뻗는 기운을 쓰는 활동" },
  fire: { 혼자: ["노래나 악기", "그림", "영상 만들기"], 함께: ["공연 보러 가기", "댄스 수업", "친구 모임"], 밖: ["캠핑 불멍", "야외 공연"], 결: "표현하고 반짝이는 기운을 쓰는 활동" },
  earth: { 혼자: ["베이킹·요리", "도예", "방 정리"], 함께: ["가족·친구와 같이 요리"], 밖: ["텃밭 가꾸기", "느긋한 걷기"], 결: "차분히 쌓고 가꾸는 기운을 쓰는 활동" },
  metal: { 혼자: ["캘리그라피", "퍼즐", "악기 연주"], 함께: ["보드게임", "스터디 모임"], 밖: ["실내 클라이밍", "수영"], 결: "다듬고 정리하는 기운을 쓰는 활동" },
  water: { 혼자: ["일기·글쓰기", "음악 감상", "명상"], 함께: ["깊은 대화 모임", "영화 모임"], 밖: ["물가 산책", "온천·찜질"], 결: "깊이 흐르고 스며드는 기운을 쓰는 활동" },
};

const MEAL_WORDS: Array<[RegExp, Meal]> = [
  [/아침|브런치|조식/, "아침"],
  [/점심|런치|낮에/, "점심"],
  [/저녁|디너|석식/, "저녁"],
  [/야식|간식|출출|밤에/, "야식"],
];

/** 질문에 끼니가 있으면 그것, 없으면 한국 시각으로 추정해요 */
export function mealFor(question: string, now: Date): Meal {
  for (const [re, m] of MEAL_WORDS) if (re.test(question)) return m;
  const h = new Date(now.getTime() + 9 * 3600_000).getUTCHours();
  if (h >= 5 && h < 10) return "아침";
  if (h >= 10 && h < 15) return "점심";
  if (h >= 15 && h < 21) return "저녁";
  return "야식";
}

const MEAL_Q = /메뉴|(뭐|뭘|무엇|어떤).{0,8}(먹|시켜|해\s?먹)|먹(을까|지|고\s?싶)|뭐\s?먹|아침\s?뭐|점심\s?뭐|저녁\s?뭐|야식|간식|식사/;
const HOBBY_Q = /취미|할\s?만한\s?(거|것|일)|배워\s?볼|뭐\s?하고\s?(놀|지내)|주말에\s?뭐|쉬는\s?날\s?뭐|심심/;
const FOLLOW_Q = /다른\s?(거|것|건|걸)|또\s?(추천|알려)|말고|더\s?(추천|알려)|비슷한/;

/** 질문이 메뉴/취미 추천이면 종류를, 아니면 null. "다른 거 추천해줘" 같은 이어 묻기는 직전 질문을 따라가요. */
export function recommendKind(question: string, history: ChatMsg[] = []): "meal" | "hobby" | null {
  if (HOBBY_Q.test(question)) return "hobby";
  if (MEAL_Q.test(question)) return "meal";
  if (FOLLOW_Q.test(question)) {
    const prev = [...history].reverse().filter((m) => m.role === "user").map((m) => m.text).find((t) => t !== question);
    if (prev) return HOBBY_Q.test(prev) ? "hobby" : MEAL_Q.test(prev) ? "meal" : null;
  }
  return null;
}

function stemElement(hanja: string | undefined): Element | null {
  const e = STEMS.find((s) => s.hanja === hanja)?.element;
  return e && ORDER.includes(e as Element) ? (e as Element) : null;
}

/** 기준 오행: 사주에서 가장 얇은 오행. (같으면 목화토금수 순서) */
export function lowestElement(chart: SajuChart): { el: Element; balanced: boolean } {
  const c = analyzeChart(chart).elementCounts;
  const counts = ORDER.map((e) => c[e] ?? 0);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  return { el: ORDER[counts.indexOf(min)], balanced: max - min < 2 };
}

function pick(list: string[], seen: string): string[] {
  const fresh = list.filter((x) => !seen.includes(x));
  return fresh.length > 0 ? fresh : list;
}

export interface RecommendFacts {
  종류: "메뉴" | "취미";
  끼니?: Meal;
  기준기운: string;
  오늘일진기운?: string;
  후보: string[];
  결: string;
  규칙: string[];
}

/** 답에 실제로 나온 후보만 골라 그림 카드로 만들어요(AI 가 카드를 정하지 않아요). 1~3개, 없으면 null */
export function recommendVisual(rec: RecommendFacts, answer: string): { kind: "food" | "hobby"; title: string; items: Array<{ icon: string; label: string; sub: string; best: boolean }> } | null {
  const kind = rec.종류 === "메뉴" ? "food" : "hobby";
  const flat = answer.replace(/\s+/g, "");
  const items = rec.후보
    .filter((c) => flat.includes(c.replace(/\s+/g, "")) && artFor(kind, c))
    .slice(0, 3)
    .map((label) => ({ icon: "", label, sub: "", best: false }));
  if (items.length === 0) return null;
  return { kind, title: kind === "food" ? `${rec.끼니 ?? "오늘"} 메뉴 후보` : "어울리는 취미", items };
}

const RULES = [
  "후보 안에서만 1~3가지를 골라. 이름은 후보에 적힌 그대로 써. 후보에 없는 음식·취미를 사주 근거로 말하지 마.",
  "근거는 한 줄만(예: 물 기운이 얇은 편이라 국물 있는 걸로). 병이나 몸을 낫게 한다, 살이 빠진다 같은 말은 절대 쓰지 마. 참고용이고 기분 좋게 가볍게.",
  "대화에서 이미 못 먹는 음식·싫다고 한 것·이미 하는 취미를 말했으면 그건 빼.",
  "특정 가게·브랜드 이름은 말하지 마.",
];

/** 메뉴/취미 추천 질문이면 AI 에게 줄 재료를, 아니면 null */
export function recommendFacts(question: string, history: ChatMsg[], chart: SajuChart, daily: DailyFacts | null | undefined, now: Date): RecommendFacts | null {
  const kind = recommendKind(question, history);
  if (!kind) return null;
  const { el, balanced } = lowestElement(chart);
  const todayEl = daily ? stemElement(daily.오늘일진.charAt(0)) : null;
  const seen = history.filter((m) => m.role === "dori").map((m) => m.text).join(" ");
  const base = `${EL_KO[el]} 기운(내 사주에서 가장 얇은 편${balanced ? ", 전체적으로는 고른 편" : ""})`;
  const todayNote = todayEl ? `${EL_KO[todayEl]} 기운` : undefined;
  if (kind === "meal") {
    const meal = mealFor(question, now);
    const key = meal === "야식" ? "저녁" : meal;
    const main = pick(MENU[el][key], seen);
    const extra = todayEl && todayEl !== el ? pick(MENU[todayEl][key], seen).slice(0, 1) : [];
    return { 종류: "메뉴", 끼니: meal, 기준기운: base, ...(todayNote ? { 오늘일진기운: todayNote } : {}), 후보: [...main, ...extra], 결: MENU[el].결, 규칙: meal === "야식" ? [...RULES, "야식·간식은 부담 없이 가볍게라고만 말해."] : RULES };
  }
  const h = HOBBY[el];
  return { 종류: "취미", 기준기운: base, ...(todayNote ? { 오늘일진기운: todayNote } : {}), 후보: [...pick(h.혼자, seen).slice(0, 2), ...pick(h.함께, seen).slice(0, 1), ...pick(h.밖, seen).slice(0, 1)], 결: h.결, 규칙: [...RULES, "혼자 보내는 편인지 사람들과 함께하는 편인지 한 번만 가볍게 물어도 돼. 안 물어도 답은 해."] };
}
