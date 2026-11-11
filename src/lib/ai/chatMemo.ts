import type { CivilDate, SajuChart } from "@/lib/saju/types";
import { buildMonthTimeline, elKoOfStem } from "@/lib/premium/book/timeline";
import { branchRelation, tenGodOf, TEN_GOD_MOOD, type DailyFacts, type TenGod } from "./dailyFacts";
import type { CoreFacts } from "./coreFacts";

/*
 * 도리 상담의 "도리 메모" 카드: 들어온 곳(오늘의 한마디·풀이·궁합)에 맞춰, 사주가 만나는 모습을 코드로 계산해 답 앞에 붙여요. (AI 호출 없음)
 * 지수는 높낮이를 보는 참고용이에요. 단정하거나 겁주는 표현은 쓰지 않아요.
 */

export interface ChatMemo {
  /** 카드 제목 (예: "오늘의 흐름") */
  title: string;
  rows: Array<[string, string]>;
  scoreLabel: string;
  score: number;
  tone: string;
  /** 한 줄 결론 */
  line: string;
}

const GOD_SCORE: Record<TenGod, number> = { 비견: 4, 겁재: -2, 식신: 8, 상관: 2, 편재: 6, 정재: 10, 편관: -2, 정관: 10, 편인: 2, 정인: 10 };
const GOD_LINE: Record<TenGod, string> = {
  비견: "내 페이스를 지키면 편안한",
  겁재: "활기차게, 지출은 한 번 더 생각하는",
  식신: "가볍게 즐기면 기분이 풀리는",
  상관: "말은 부드럽게 고르면 반짝이는",
  편재: "움직일수록 재미가 생기는",
  정재: "차곡차곡 챙기면 잘 맞는",
  편관: "하나씩 끝내면 뿌듯해지는",
  정관: "약속을 지키면 믿음이 쌓이는",
  편인: "혼자 생각을 정리하기 좋은",
  정인: "쉬거나 배우며 든든해지는",
};
const REL_WORD = { 합: "어울림", 충: "자극", 해: "서운함이 쌓이기 쉬움" } as const;
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const clamp = (n: number) => Math.max(20, Math.min(95, n));

type Unit = "날" | "해";
export function toneOfScore(score: number, unit: Unit = "날"): string {
  return score >= 72 ? `힘이 붙는 ${unit}` : score >= 58 ? `순항하는 ${unit}` : score >= 44 ? `차분히 점검하는 ${unit}` : `쉬어 가는 ${unit}`;
}

/** 오늘의 한마디에서 들어왔을 때: 오늘 일진과 내 사주 */
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
  score = clamp(score);

  return {
    title: "오늘의 흐름",
    rows: [
      ["보는 날", `${today.year}-${p2(today.month)}-${p2(today.day)} (${dow})`],
      ["오늘 일진", daily.오늘일진],
      ["나와의 관계", `${god} · ${TEN_GOD_MOOD[god].split(". ")[0]}`],
      ["내 글자와 만나면", meets.length ? meets.slice(0, 2).join(", ") : "눈에 띄는 합충은 없어"],
    ],
    scoreLabel: "오늘의 흐름 지수",
    score,
    tone: toneOfScore(score),
    line: `${GOD_LINE[god]} 날`,
  };
}

const shorten = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** 풀이(결과서)에서 들어왔을 때: 그 풀이가 보는 해와 앞으로 12개월의 흐름 */
export function buildReadingMemo(chart: SajuChart, core: CoreFacts | null, at: Date): ChatMemo {
  const natal: Record<string, string> = { year: `${chart.year.stem}${chart.year.branch}`, month: `${chart.month.stem}${chart.month.branch}`, day: `${chart.day.stem}${chart.day.branch}` };
  if (chart.hour) natal.hour = `${chart.hour.stem}${chart.hour.branch}`;
  const yongsinEls = [...new Set((core?.용신 ?? []).map((y) => elKoOfStem(y[0])).filter(Boolean))];
  const plans = buildMonthTimeline({ natal, dayStem: chart.day.stem, yongsinEls, now: at, count: 12 });
  const score = Math.round(plans.reduce((a, p) => a + p.score, 0) / plans.length);
  const ranked = [...plans].sort((a, b) => b.score - a.score || a.index - b.index);
  const good = ranked.slice(0, 3).sort((a, b) => a.index - b.index).map((p) => `${p.month}월경`);
  const slow = ranked.slice(-2).sort((a, b) => a.index - b.index).map((p) => `${p.month}월경`);
  const k = new Date(at.getTime() + 9 * 3600 * 1000);
  const sy = core?.올해세운;
  const god = (sy?.천간십성 ?? "") as TenGod;
  const meet = (core?.세운과원국 ?? []).slice(0, 2).map((m) => shorten(m, 30));
  const rows: Array<[string, string]> = [["보는 해", `${k.getUTCFullYear()}년${sy?.간지 ? ` ${sy.간지}` : ""}`]];
  if (god && TEN_GOD_MOOD[god]) rows.push(["나와의 관계", `${god} · ${TEN_GOD_MOOD[god].split(". ")[0]}`]);
  rows.push(["내 글자와 만나면", meet.length ? meet.join(", ") : "눈에 띄는 합충은 없어"]);
  rows.push(["힘이 붙는 달", good.join(" · ")], ["천천히 가는 달", slow.join(" · ")]);
  return {
    title: `${k.getUTCFullYear()}년의 흐름`,
    rows,
    scoreLabel: "앞으로 12개월 흐름 지수",
    score,
    tone: toneOfScore(score, "해"),
    line: god && GOD_LINE[god] ? `${GOD_LINE[god]} 해` : `${good[0]} 무렵부터 힘이 붙는 해`,
  };
}

/** 궁합에서 들어왔을 때: 두 사람의 일간·일지가 만나는 모습 */
export function buildCompatMemo(me: SajuChart, partner: SajuChart, names: { me?: string | null; partner?: string | null }): ChatMemo {
  const a = names.me?.trim() || "나";
  const b = names.partner?.trim() || "상대";
  const godAB = tenGodOf(me.day.stem, partner.day.stem);
  const godBA = tenGodOf(partner.day.stem, me.day.stem);
  const rel = branchRelation(me.day.branch, partner.day.branch);
  const GOOD: TenGod[] = ["정재", "정관", "정인", "식신"];
  let score = 56;
  if (rel === "합") score += 14;
  else if (rel === "충") score -= 8;
  else if (rel === "해") score -= 4;
  if (GOOD.includes(godAB)) score += 6;
  if (GOOD.includes(godBA)) score += 6;
  score = clamp(score);
  const relText = rel ? `${me.day.branch}${partner.day.branch} ${rel}(${REL_WORD[rel]})` : "눈에 띄는 합충은 없어";
  const tone = score >= 72 ? "아주 잘 어울리는 편" : score >= 58 ? "편안하게 맞는 편" : score >= 44 ? "맞춰 가며 어울리는 편" : "서로 배려가 더 필요한 편";
  return {
    title: "두 사람의 흐름",
    rows: [
      ["두 사람의 일간", `${a} ${me.day.stem} · ${b} ${partner.day.stem}`],
      [`${a} 기준 ${b}`, `${godAB} · ${TEN_GOD_MOOD[godAB].split(". ")[0]}`],
      [`${b} 기준 ${a}`, `${godBA} · ${TEN_GOD_MOOD[godBA].split(". ")[0]}`],
      ["일지끼리 만나면", relText],
    ],
    scoreLabel: "둘의 어울림 지수",
    score,
    tone,
    line: rel === "합" ? "가까운 자리에서 손발이 잘 맞는 사이" : rel === "충" ? "서로 다른 점이 자극이 되니, 속도를 맞추면 좋은 사이" : "서로를 알아 가며 맞춰 가기 좋은 사이",
  };
}
