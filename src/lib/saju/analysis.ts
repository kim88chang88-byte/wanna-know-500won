import { BRANCHES, ELEMENT_LABEL_KO, STEMS, type Element, type YinYang } from "./constants";
import type { Pillar, SajuChart } from "./types";

/** 풀이 프롬프트에 근거로 넘길 "계산된 사실"만 모읍니다. (AI 가 직접 계산하지 않도록) */
export interface ChartFacts {
  /** 일간: 사주에서 "나"를 뜻하는 글자 (일주의 천간) */
  dayMaster: { hanja: string; hangul: string; element: Element; elementKo: string; yinYang: YinYang };
  /** 천간·지지 글자 수로 센 오행 분포 (시간을 모르면 6글자, 알면 8글자) */
  elementCounts: Record<Element, number>;
  /** 예: { label: "연주", text: "庚午(경오)" } */
  pillars: Array<{ label: string; text: string }>;
  hourKnown: boolean;
}

function pillarText(p: Pillar): string {
  const stem = STEMS.find((s) => s.hanja === p.stem);
  const branch = BRANCHES.find((b) => b.hanja === p.branch);
  return `${p.stem}${p.branch}(${stem?.hangul ?? "?"}${branch?.hangul ?? "?"})`;
}

export function analyzeChart(chart: SajuChart): ChartFacts {
  const dayStem = STEMS.find((s) => s.hanja === chart.day.stem);
  if (!dayStem) throw new Error(`알 수 없는 일간: ${chart.day.stem}`);

  const elementCounts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const entries: Array<[string, Pillar | null]> = [
    ["연주", chart.year],
    ["월주", chart.month],
    ["일주", chart.day],
    ["시주", chart.hour],
  ];
  for (const [, p] of entries) {
    if (!p) continue;
    const s = STEMS.find((x) => x.hanja === p.stem);
    const b = BRANCHES.find((x) => x.hanja === p.branch);
    if (s) elementCounts[s.element]++;
    if (b) elementCounts[b.element]++;
  }

  return {
    dayMaster: {
      hanja: dayStem.hanja,
      hangul: dayStem.hangul,
      element: dayStem.element,
      elementKo: ELEMENT_LABEL_KO[dayStem.element],
      yinYang: dayStem.yinYang,
    },
    elementCounts,
    pillars: entries.filter((e): e is [string, Pillar] => e[1] !== null).map(([label, p]) => ({ label, text: pillarText(p) })),
    hourKnown: chart.hour !== null,
  };
}
