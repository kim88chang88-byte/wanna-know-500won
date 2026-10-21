/* "도리에게 더 물어보기" 질문 목록. 자유 입력은 받지 않고 미리 정한 질문만 받아요. (비용·안전) 브라우저에서도 쓰는 순수 데이터라 따로 뒀어요. */

export interface AskQuestion {
  id: string;
  label: string;
  focus: string;
}

export const ASK_QUESTIONS: AskQuestion[] = [
  { id: "half", label: "올해 상반기·하반기 흐름은?", focus: "올해월운을 상반기(2~7월경)와 하반기(8월경~)로 나눠, 분위기가 어떻게 달라지는지와 각각 신경 쓸 점 하나씩." },
  { id: "month", label: "이번 달은 어떻게 보내면 좋을까?", focus: "이번달월운과 원국과의 관계를 근거로, 이번 달 분위기와 해 볼 작은 행동 하나." },
  { id: "job", label: "나한테 맞는 일의 방향은?", focus: "일간·격국·십성 분포를 근거로, 잘 맞는 일 방식 두 가지와 조심하면 좋은 점 하나." },
  { id: "money", label: "돈이 새기 쉬운 습관은?", focus: "재성(숨은 재성 포함)과 비겁 분포, 올해 세운을 근거로, 돈이 모이는 방식과 새기 쉬운 습관 하나, 작은 처방 하나." },
  { id: "people", label: "올해 사람·연애에서 신경 쓸 점은?", focus: "세운과원국·원국관계 중 사람 관계(일지·월지 자리)와 닿는 근거를 짚고, 신경 쓸 점 하나와 작은 행동 하나." },
  { id: "daeun", label: "지금 대운에서 챙길 것은?", focus: "지금대운과 지금대운나이, 대운과원국을 근거로, 이 10년의 분위기와 챙기면 좋은 것 하나." },
  { id: "balance", label: "부족한 기운은 어떻게 채워요?", focus: "용신과 오행분포(부족한 기운)를 근거로, 일상에서 해 볼 수 있는 작은 습관 두세 가지." },
  { id: "sum", label: "내 사주를 3줄로 요약하면?", focus: "일간, 신강/신약, 눈에 띄는 오행과 관계를 근거로 딱 3문장으로 요약. 번호 없이 줄바꿈으로 3줄." },
];

export function findQuestion(id: unknown): AskQuestion | null {
  return typeof id === "string" ? (ASK_QUESTIONS.find((q) => q.id === id) ?? null) : null;
}
