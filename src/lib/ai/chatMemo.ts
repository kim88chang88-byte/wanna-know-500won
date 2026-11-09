import type { CivilDate } from "@/lib/saju/types";
import { TEN_GOD_MOOD, type DailyFacts, type TenGod } from "./dailyFacts";

/*
 * 도리 상담의 "도리 메모" 카드: 오늘 일진과 내 사주가 만나는 모습을 코드로 계산해 답 앞에 붙여요. (AI 호출 없음)
 * 지수는 하루의 높낮이를 보는 참고용이에요. 단정하거나 겁주는 표현은 쓰지 않아요.
 */

export interface ChatMemo {
  date: string;
  ilJin: string;
  relation: string;
  meet: string;
  score: number;
  tone: string;
  line: string;
}

const GOD_SCORE: Record<TenGod, number> = { 비견: 4, 겁재: -2, 식신: 8, 상관: 2, 편재: 6, 정재: 10, 편관: -2, 정관: 10, 편인: 2, 정인: 10 };
const GOD_LINE: Record<TenGod, string> = {
  비견: "내 페이스를 지키면 편안한 날",
  겁재: "활기차게, 지출은 한 번 더 생각하는 날",
  식신: "가볍게 즐기면 기분이 풀리는 날",
  상관: "말은 부드럽게 고르면 반짝이는 날",
  편재: "움직일수록 재미가 생기는 날",
  정재: "차곡차곡 챙기면 잘 맞는 날",
  편관: "하나씩 끝내면 뿌듯해지는 날",
  정관: "약속을 지키면 믿음이 쌓이는 날",
  편인: "혼자 생각을 정리하기 좋은 날",
  정인: "쉬거나 배우며 든든해지는 날",
};
const REL_WORD = { 합: "어울림", 충: "자극", 해: "서운함이 쌓이기 쉬움" } as const;
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export function toneOfScore(score: number): string {
  return score >= 72 ? "힘이 붙는 날" : score >= 58 ? "순항하는 날" : score >= 44 ? "차분히 점검하는 날" : "쉬어 가는 날";
}

export function buildChatMemo(daily: DailyFacts, today: CivilDate): ChatMemo {
  const god = daily.일간과의관계.십성;
  const p2 = (n: number) => String(n).padStart(2, "0");
  const dow = DOW[new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay()];

  let score = 50 + GOD_SCORE[god];
  const meets: string[] = [];
  if (daily.일간합충) {
    const harmony = daily.일간합충.includes("합");
    score += harmony ? 6 : -6;
    meets.push(harmony ? "일간과 합(어울림)" : "일간과 충(자극)");
  }
  let combines = 0;
  for (const r of daily.지지관계) {
    const m = /내 (일지|월지) (\S+): (합|충|해)/.exec(r);
    if (!m) continue;
    const kind = m[3] as "합" | "충" | "해";
    if (kind === "합") {
      if (combines < 2) score += 8;
      combines += 1;
    } else score -= kind === "충" ? 8 : 4;
    meets.push(`${m[1]} ${m[2]}와 ${kind}(${REL_WORD[kind]})`);
  }
  score = Math.max(20, Math.min(95, score));

  return {
    date: `${today.year}-${p2(today.month)}-${p2(today.day)} (${dow})`,
    ilJin: daily.오늘일진,
    relation: `${god} · ${TEN_GOD_MOOD[god].split(". ")[0]}`,
    meet: meets.length ? meets.slice(0, 2).join(", ") : "눈에 띄는 합충은 없어요",
    score,
    tone: toneOfScore(score),
    line: GOD_LINE[god],
  };
}
