import type { SajuChart } from "@/lib/saju/types";
import { STEMS } from "@/lib/saju/constants";
import { EL_KO, type Element } from "@/lib/ai/menuHobby";
import { analyzeChart } from "@/lib/saju/analysis";
import { tenGodOf, TEN_GOD_MOOD, type TenGod } from "@/lib/ai/dailyFacts";
import { sewoonBranch } from "@/lib/ai/loveFacts";

/*
 * 돈·재물 질문일 때만 프롬프트에 넣는 "재물 재료". 매번 같은 "땅·불 기운" 말만 되풀이하지 않고,
 * 재성(돈 기운)의 양, 돈을 만드는 힘(식상), 나가는 결(비겁), 올해·내년 세운의 십성 중 한 가지를 골라 쓰게 해요.
 */

export const MONEY_Q = /돈|재물|월급|통장|지출|저축|적금|투자|주식|코인|비트코인|부업|대출|빚|갚|로또|재테크|사업|창업|수입|연봉|부자|빌려|빌려줘|용돈|생활비|소비|쇼핑|편재|정재|재성/;

const GENERATES: Record<Element, Element> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CONTROLS: Record<Element, Element> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

const level = (n: number, many: number) => (n >= many ? "많은 편" : n >= 2 ? "보통" : n === 1 ? "적은 편" : "거의 없음");

const GOD_MONEY: Partial<Record<TenGod, string>> = {
  정재: "정재 — 꾸준히 모으고 지키는 돈의 결",
  편재: "편재 — 움직여서 벌고 쓰는 돈, 기회가 오는 결",
  식신: "식신 — 내 재주·취미로 여유가 생기는 결",
  상관: "상관 — 아이디어·말솜씨로 돈이 되지만 충동 소비 주의",
  겁재: "겁재 — 나눠 쓰고 경쟁하는 결, 빌려주기·충동 지출 한 번 더 생각",
  비견: "비견 — 내 페이스로 버는 결, 동료와 나누는 돈",
  정인: "정인 — 배움·문서·안정에 쓰이는 결",
  편인: "편인 — 새로운 걸 구상하느라 실행이 늦어지기 쉬운 결",
  정관: "정관 — 책임·규칙 속에서 들어오는 월급형 돈",
  편관: "편관 — 압박 속 일을 해내며 버는 결, 무리하기 쉬움",
};

export function moneyFacts(chart: SajuChart, now: Date): Record<string, unknown> {
  const f = analyzeChart(chart);
  const me = f.dayMaster.element as Element;
  const wealth = CONTROLS[me];
  const output = GENERATES[me];
  const out: Record<string, unknown> = {
    일간: `${f.dayMaster.hangul}(${EL_KO[me]})`,
    재성: `${EL_KO[wealth]} 기운 ${f.elementCounts[wealth]}글자 — ${level(f.elementCounts[wealth], 3)}(돈 기운)`,
    돈을만드는힘: `${EL_KO[output]} 기운 ${f.elementCounts[output]}글자 — ${level(f.elementCounts[output], 3)}(재주·표현으로 돈을 만드는 힘)`,
    나눠쓰는결: `${EL_KO[me]} 기운 ${f.elementCounts[me]}글자 — ${level(f.elementCounts[me], 3)}(친구·가족·자기 몫으로 나가는 돈, 경쟁)`,
  };
  const pillars: Array<[string, string | undefined]> = [
    ["연주", chart.year?.stem],
    ["월주", chart.month?.stem],
    ["시주", chart.hour?.stem],
  ];
  const here = pillars
    .filter(([, s]) => s)
    .map(([label, s]) => ({ label, god: tenGodOf(chart.day.stem, s as string) }))
    .filter((x) => x.god === "정재" || x.god === "편재")
    .map((x) => `${x.label} 천간 ${x.god}`);
  out.재성이드러난자리 = here.length ? here.join(", ") : "천간에는 드러나지 않음(지지 속에 있거나 약함, 단정 금지)";
  const sw = sewoonBranch(now);
  const stemAt = (y: number) => STEMS[(((y - 4) % 10) + 10) % 10];
  const cur = stemAt(sw.year);
  const nxt = stemAt(sw.year + 1);
  const g1 = tenGodOf(chart.day.stem, cur.hanja);
  const g2 = tenGodOf(chart.day.stem, nxt.hanja);
  out.올해세운 = `${sw.year}년 ${cur.hanja} — ${GOD_MONEY[g1] ?? g1}. 올해 분위기: ${TEN_GOD_MOOD[g1]}`;
  out.내년세운 = `${sw.year + 1}년 ${nxt.hanja} — ${GOD_MONEY[g2] ?? g2}. 내년 분위기: ${TEN_GOD_MOOD[g2]}`;
  return out;
}
