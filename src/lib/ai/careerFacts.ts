import type { SajuChart } from "@/lib/saju/types";
import { STEMS } from "@/lib/saju/constants";
import { EL_KO, type Element } from "@/lib/ai/menuHobby";
import { analyzeChart } from "@/lib/saju/analysis";
import { tenGodOf, TEN_GOD_MOOD, type TenGod } from "@/lib/ai/dailyFacts";
import { sewoonBranch } from "@/lib/ai/loveFacts";

/*
 * 성공·일·커리어 질문일 때만 프롬프트에 넣는 "일 재료". 매번 "땅·불 기운" 말만 되풀이하지 않고,
 * 인정받는 결(관성), 재주를 쓰는 결(식상), 배우고 받치는 힘(인성), 직장 자리(월주), 올해·내년 세운의 십성 중 한 가지를 고르게 해요.
 */

export const CAREER_Q = /승진|이직|퇴사|직장|회사|직업|커리어|진로|적성|창업|사업|성공|취업|면접|발표|평가|인정|상사|동료|팀|프로젝트|일이|업무|번아웃|시험|합격|자격증|공부|계약|연봉|협상/;
/** 돈 이야기가 분명히 들어 있으면 재물 쪽 재료를 같이 써요 */
export const MONEY_WORDS = /돈|재물|수입|월급|통장|대출|빚|투자|주식|코인|부업|저축|적금/;

const GENERATES: Record<Element, Element> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CONTROLS: Record<Element, Element> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

const level = (n: number, many: number) => (n >= many ? "많은 편" : n >= 2 ? "보통" : n === 1 ? "적은 편" : "거의 없음");

const GOD_WORK: Partial<Record<TenGod, string>> = {
  정관: "정관 — 규칙·책임 속에서 인정받는 결, 승진·평가에 유리한 흐름",
  편관: "편관 — 압박 속에서 일을 해내는 결, 인정받지만 무리하기 쉬움",
  식신: "식신 — 내 재주·꾸준한 실력이 드러나는 결",
  상관: "상관 — 아이디어·말솜씨가 튀는 결, 윗사람과 부딪히기 쉬움",
  정재: "정재 — 성실한 성과가 쌓이는 결",
  편재: "편재 — 움직이고 넓히는 결, 새 기회·사업 감각",
  정인: "정인 — 배움·자격·윗사람의 도움이 따르는 결",
  편인: "편인 — 새 길을 구상하느라 실행이 늦어지기 쉬운 결",
  비견: "비견 — 내 페이스로 가는 결, 동료·경쟁 구도",
  겁재: "겁재 — 경쟁·나눔이 커지는 결, 공을 나누거나 뺏기기 쉬움",
};

export function careerFacts(chart: SajuChart, now: Date): Record<string, unknown> {
  const f = analyzeChart(chart);
  const me = f.dayMaster.element as Element;
  const gwan = (Object.keys(CONTROLS) as Element[]).find((e) => CONTROLS[e] === me) as Element; // 나를 다스리는 기운 = 관성
  const output = GENERATES[me];
  const seal = (Object.keys(GENERATES) as Element[]).find((e) => GENERATES[e] === me) as Element; // 나를 낳는 기운 = 인성
  const out: Record<string, unknown> = {
    일간: `${f.dayMaster.hangul}(${EL_KO[me]})`,
    인정받는결: `${EL_KO[gwan]} 기운 ${f.elementCounts[gwan]}글자 — ${level(f.elementCounts[gwan], 3)}(관성: 조직·평가·책임, 승진·이직·면접)`,
    재주를쓰는결: `${EL_KO[output]} 기운 ${f.elementCounts[output]}글자 — ${level(f.elementCounts[output], 3)}(식상: 표현·기획·창업·발표)`,
    배우고받치는힘: `${EL_KO[seal]} 기운 ${f.elementCounts[seal]}글자 — ${level(f.elementCounts[seal], 3)}(인성: 공부·자격·윗사람 도움·시험)`,
    내곁의사람: `나와 같은 ${EL_KO[me]} 기운은 동료, 나를 받쳐 주는 ${EL_KO[seal]} 기운은 멘토·후원자, 나를 다스리는 ${EL_KO[gwan]} 기운은 평가하는 상사 같은 결`,
  };
  if (chart.month?.stem) out.직장자리월주 = `${tenGodOf(chart.day.stem, chart.month.stem)} — ${GOD_WORK[tenGodOf(chart.day.stem, chart.month.stem)] ?? "일하는 자리의 결"}`;
  const sw = sewoonBranch(now);
  const stemAt = (y: number) => STEMS[(((y - 4) % 10) + 10) % 10];
  const cur = stemAt(sw.year);
  const nxt = stemAt(sw.year + 1);
  const g1 = tenGodOf(chart.day.stem, cur.hanja);
  const g2 = tenGodOf(chart.day.stem, nxt.hanja);
  out.올해세운 = `${sw.year}년 ${cur.hanja} — ${GOD_WORK[g1] ?? g1}. 올해 분위기: ${TEN_GOD_MOOD[g1]}`;
  out.내년세운 = `${sw.year + 1}년 ${nxt.hanja} — ${GOD_WORK[g2] ?? g2}. 내년 분위기: ${TEN_GOD_MOOD[g2]}`;
  return out;
}
