import type { Group } from "../topic";
import { GOD_PAST_YEAR } from "./insight";
import type { BookSection } from "../types";

/*
 * "내 얘기 같다"고 느끼게 하는 장치들.
 *  - 이런 면, 있지 않나요?: 일간·십성·신강신약이 만드는 구체적인 행동 습관 3가지 (누구에게나 맞는 칭찬이 아니라 '행동')
 *  - 최근 흐름 되짚어 보기: 이미 지나간 해의 주제를 짚어서 본인이 직접 맞는지 확인하게 해요.
 * 단정하지 않고 "~할 수 있어요/~편이에요"로 쓰고, 맞는지는 이용자가 직접 눌러서 확인해요.
 */

/** 일간별로 겉모습과 속마음이 다른 지점 */
export const STEM_INNER: Record<string, string> = {
  甲: "겉으론 굳건해 보여도, 인정받지 못한다고 느끼면 속으로 오래 곱씹는 편이에요.",
  乙: "분위기를 잘 맞추지만, 정작 내 속마음은 한참 뒤에야 꺼내는 편이에요.",
  丙: "처음엔 밝고 적극적이지만, 무시당했다고 느끼면 갑자기 마음이 식어 버리기도 해요.",
  丁: "조용해 보여도 마음에 둔 일은 오래, 깊게 생각하는 편이에요.",
  戊: "말수는 적은데 한 번 한 약속은 끝까지 지키려 해서, 혼자 부담을 떠안는 일이 많아요.",
  己: "남의 일은 잘 챙기면서 내 일은 뒤로 미루다가 지칠 때가 있어요.",
  庚: "결정은 빠른데, 애매한 상황이 길어지면 속이 답답해져서 확실히 정리하고 싶어져요.",
  辛: "겉으론 무심해 보여도 내 노력이 어떻게 평가받는지에는 은근히 예민해요.",
  壬: "자유롭고 유연해 보이지만, 선택지가 막히면 의외로 크게 답답해해요.",
  癸: "생각이 많아서 걱정을 혼자 키우다가도, 말로 꺼내고 나면 의외로 가벼워지는 편이에요.",
};

/** 가장 많은 십성 그룹이 만드는 행동 습관 */
export const GROUP_HABIT: Record<Group, string> = {
  비겁: "시키는 대로 하기보다 내 방식과 페이스로 정할 때 일이 잘 풀리는 편이에요.",
  식상: "머릿속 생각이나 느낌을 말·글·그림으로 풀어내야 마음이 정리되는 편이에요.",
  재성: "눈앞의 현실과 결과를 따지는 감각이 좋아서, 계획 없이 시작하는 일에는 불안해지는 편이에요.",
  관성: "해야 할 일과 책임을 먼저 챙기느라, 쉬는 날에도 마음 한구석이 일에 가 있을 때가 있어요.",
  인성: "새로 시작하기 전에 충분히 알아보고 배우고 싶어서, 준비가 길어지는 편이에요.",
};

export const STRENGTH_HABIT: Record<string, string> = {
  신강: "하고 싶은 방향이 분명해서, 남의 의견보다 내 판단을 더 믿는 편이에요.",
  신약: "주변 분위기와 사람들의 기분에 영향을 많이 받아서, 믿는 사람이 곁에 있을 때 힘이 나요.",
  중화: "상황에 따라 앞에 나서기도, 맞춰 주기도 하는 균형형이라 사람마다 다른 모습을 보게 돼요.",
};

/** 지나간 해의 주제(첫 번째 십성 그룹)별로 '있었을 수 있는 일' */
export const PAST_YEAR_PROMPT: Record<Group, string> = {
  비겁: "경쟁이나 비교가 늘었거나, 내 몫과 방식을 지키려고 애쓴 일이 있었을 수 있어요.",
  식상: "배우고 표현할 일이 많아서 새 취미나 아이디어, 말할 기회가 늘었을 수 있어요.",
  재성: "돈이나 거래, 현실적인 선택이 크게 느껴졌거나 사람을 만나는 일이 늘었을 수 있어요.",
  관성: "책임이나 평가, 규칙 속에서 압박과 성장을 함께 느낀 일이 있었을 수 있어요.",
  인성: "공부·자격·이사·마음의 안식처처럼 '준비하고 쉬어 가는' 주제가 있었을 수 있어요.",
};

export interface TraitInput {
  dayStem: string;
  dayImage: string;
  dominant: Group;
  dominantCount: number;
  gradeLabel: string;
}

export interface Resonance {
  traits: BookSection;
  /** '근거 보기'에 보여줄 줄 */
  traitBasis: Array<{ label: string; value: string }>;
}

/** "이런 면, 있지 않나요?" 섹션 (이용자가 항목마다 맞는지 눌러 볼 수 있어요) */
export function buildTraits(i: TraitInput): Resonance {
  const items = [
    STEM_INNER[i.dayStem] ?? STEM_INNER["甲"],
    GROUP_HABIT[i.dominant],
    STRENGTH_HABIT[i.gradeLabel] ?? STRENGTH_HABIT["중화"],
  ];
  return {
    traits: {
      heading: "이런 면, 있지 않나요?",
      body: "사주에서 읽히는 나의 행동 습관 세 가지예요. 나와 비슷하다고 느껴지는 것만 눌러 보세요.",
      checks: items,
    },
    traitBasis: [
      { label: "① 겉과 속", value: `일간 ${i.dayStem}(${i.dayImage})` },
      { label: "② 행동 습관", value: `${i.dominant} ${i.dominantCount}개로 가장 많음` },
      { label: "③ 에너지", value: `${i.gradeLabel} 사주` },
    ],
  };
}

export interface PastYear {
  year: number;
  ganzhi: string;
  group: Group | null;
  /** 그 해 세운 천간의 십성 (있으면 더 구체적인 문장을 써요) */
  god?: string;
}

/** "최근 흐름 되짚어 보기" 섹션. 지난 해가 없으면 null */
export function buildLookBack(years: PastYear[]): BookSection | null {
  const rows = years.filter((y) => y.group);
  if (rows.length === 0) return null;
  return {
    heading: "최근 흐름 되짚어 보기",
    body: "사주에서는 해마다 중심 주제가 달라요. 이미 지나온 해를 돌아보며, 실제로 떠오르는 일이 있는지 눌러서 확인해 보세요.",
    checks: rows.map((y) => `${y.year}년(${y.ganzhi}): ${(y.god ? GOD_PAST_YEAR[y.god] : undefined) ?? PAST_YEAR_PROMPT[y.group as Group]}`),
  };
}

/** 맞은 개수에 따른 한마디 */
export function checkMessage(hit: number, total: number): string {
  if (total === 0) return "";
  if (hit === 0) return "이번엔 잘 안 맞았나요? 같은 일주라도 사람마다 쓰는 방식이 달라서, 맞는 면만 가져가 주세요.";
  if (hit === total) return "전부 맞았다니, 도리도 깜짝 놀랐어요! 이 흐름을 알고 나면 나를 챙기기 한결 쉬워져요.";
  if (hit * 2 >= total) return "꽤 많이 닿았네요. 맞는 부분을 기준으로 아래 풀이를 읽어 보세요.";
  return "일부만 닿았어요. 맞는 부분부터 가져가 보세요.";
}
