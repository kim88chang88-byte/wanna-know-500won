import type { SajuChart } from "@/lib/saju/types";
import { STEMS } from "@/lib/saju/constants";
import { EL_KO, type Element } from "@/lib/ai/menuHobby";
import { analyzeChart } from "@/lib/saju/analysis";
import { tenGodOf, type TenGod } from "@/lib/ai/dailyFacts";
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
  정관: "정관 — 승진·평가: 규칙 속 성실함이 인정받아 유리 / 이직·창업: 지금 조직에서 책임이 커지는 때라 옮기기보다 다지기 / 인정·관계: 윗사람이 알아봐 주는 결",
  편관: "편관 — 승진·평가: 압박 속 성과로 눈에 띄지만 무리 주의 / 이직·창업: 부딪히며 돌파하는 힘, 체력 관리 필요 / 인정·관계: 평가가 엄해 인정이 늦게 느껴짐",
  식신: "식신 — 승진·평가: 꾸준한 실력이 쌓여 드러남 / 이직·창업: 내 재주로 시작해 보기 좋음 / 인정·관계: 편하게 어울리며 호감을 얻는 결",
  상관: "상관 — 승진·평가: 말솜씨·아이디어는 튀지만 윗사람과 부딪히기 쉬움 / 이직·창업: 새 판을 벌이고 싶은 마음이 커짐, 충동 주의 / 인정·관계: 표현이 솔직해 오해 가능",
  정재: "정재 — 승진·평가: 성실한 성과가 차곡차곡 쌓임 / 이직·창업: 안정적인 수입 구조를 만들기 좋음 / 인정·관계: 믿음직하다는 평가",
  편재: "편재 — 승진·평가: 활동 범위를 넓혀 성과가 보임 / 이직·창업: 새 기회·사업 감각이 열림 / 인정·관계: 사람 만남이 늘어나는 결",
  정인: "정인 — 승진·평가: 윗사람의 도움·자격이 받쳐 줌 / 이직·창업: 배우고 준비하며 때를 보기 좋음 / 인정·관계: 멘토·후원자 운",
  편인: "편인 — 승진·평가: 성과가 겉으로 드러나기까지 시간이 걸림 / 이직·창업: 구상은 활발하나 실행이 늦어지기 쉬워 서두르면 후회 / 인정·관계: 혼자 깊이 파고들어 알아주는 사람이 적게 느껴짐",
  비견: "비견 — 승진·평가: 동료와 비교·경쟁 구도 / 이직·창업: 내 페이스로 독립하고 싶은 마음 / 인정·관계: 동료와 힘을 합치면 유리",
  겁재: "겁재 — 승진·평가: 공을 나누거나 뺏기기 쉬움 / 이직·창업: 동업·보증은 신중하게 / 인정·관계: 경쟁이 커지는 결",
};

/** 오행별로 어울리는 일하는 분야(단정하지 않고 "이런 쪽이 맞는 편"으로만 써요) */
const FIELD: Record<Element, string> = {
  wood: "교육·기획·콘텐츠·성장하는 조직·사람 키우는 일",
  fire: "표현·방송·마케팅·IT 서비스·강의처럼 드러나고 전하는 일",
  earth: "운영·관리·부동산·상담·신뢰가 중요한 중간 조정 일",
  metal: "금융·법·품질·기술·정밀하게 다듬는 일",
  water: "연구·분석·글쓰기·유통·사람과 정보가 흐르는 일",
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
  const ranked = ([gwan, output, seal] as Element[]).sort((a, b) => f.elementCounts[b] - f.elementCounts[a]);
  out.어울리는분야 = `센 기운 ${EL_KO[ranked[0]]} → ${FIELD[ranked[0]]} / 다음 ${EL_KO[ranked[1]]} → ${FIELD[ranked[1]]} (이런 쪽이 맞는 편이라고만 말하고 단정 금지)`;
  if (chart.month?.stem) out.직장자리월주 = `${tenGodOf(chart.day.stem, chart.month.stem)} — ${GOD_WORK[tenGodOf(chart.day.stem, chart.month.stem)] ?? "일하는 자리의 결"}`;
  const sw = sewoonBranch(now);
  const stemAt = (y: number) => STEMS[(((y - 4) % 10) + 10) % 10];
  const cur = stemAt(sw.year);
  const nxt = stemAt(sw.year + 1);
  const g1 = tenGodOf(chart.day.stem, cur.hanja);
  const g2 = tenGodOf(chart.day.stem, nxt.hanja);
  out.올해세운 = `${sw.year}년 ${cur.hanja} — ${GOD_WORK[g1] ?? g1}`;
  out.내년세운 = `${sw.year + 1}년 ${nxt.hanja} — ${GOD_WORK[g2] ?? g2}`;
  return out;
}
