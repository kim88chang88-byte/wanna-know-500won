/** MBTI 16유형을 한 줄로 (프리미엄 결과서에서 사주와 나란히 보여 줄 때 써요. 같은 글이라 AI 를 쓰지 않아요) */
export const MBTI_BRIEF: Record<string, string> = {
  INTJ: "혼자 멀리 내다보고 계획을 세우는 쪽이에요",
  INTP: "궁금한 걸 끝까지 파고들어 원리를 이해하는 쪽이에요",
  ENTJ: "목표를 세우면 사람과 일을 이끌어 가는 쪽이에요",
  ENTP: "새로운 아이디어를 던지고 부딪히며 즐기는 쪽이에요",
  INFJ: "조용히 사람 마음을 헤아리고 의미를 찾는 쪽이에요",
  INFP: "내 가치관에 맞는 일에 깊이 마음을 쓰는 쪽이에요",
  ENFJ: "주변 사람을 챙기고 함께 나아가게 하는 쪽이에요",
  ENFP: "사람과 가능성에 호기심이 많고 에너지가 넘치는 쪽이에요",
  ISTJ: "책임감 있게 차근차근 약속을 지키는 쪽이에요",
  ISFJ: "곁의 사람을 세심하게 돌보며 안정을 만드는 쪽이에요",
  ESTJ: "현실적으로 정리하고 일을 굴러가게 하는 쪽이에요",
  ESFJ: "분위기를 살피며 사람들을 따뜻하게 이어 주는 쪽이에요",
  ISTP: "말보다 손으로, 상황을 침착하게 풀어 내는 쪽이에요",
  ISFP: "조용하지만 내 취향과 감각을 소중히 지키는 쪽이에요",
  ESTP: "눈앞의 기회를 빠르게 잡고 몸으로 부딪히는 쪽이에요",
  ESFP: "지금 이 순간을 즐기고 주변을 환하게 만드는 쪽이에요",
};

/** 일간 오행(목화토금수)별로 사주가 말하는 모습 한 줄 */
export const DAYMASTER_BRIEF: Record<string, string> = {
  wood: "곧게 자라나려는 성장의 기운이 중심이에요",
  fire: "밝고 뜨겁게 표현하려는 기운이 중심이에요",
  earth: "묵직하게 품고 중심을 잡는 기운이 중심이에요",
  metal: "맺고 끊음이 분명하고 단단한 기운이 중심이에요",
  water: "깊이 생각하고 유연하게 흘러가는 기운이 중심이에요",
};

export function cleanMbti(v: unknown): string {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(MBTI_BRIEF, v.toUpperCase()) ? v.toUpperCase() : "";
}
