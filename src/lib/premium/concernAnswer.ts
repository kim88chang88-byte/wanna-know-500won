import { CONCERN_CHIPS, concernLabel, hasConcern, type Concern, type ConcernId } from "@/lib/concerns";
import { ELEMENT_INFO } from "./topic";
import { ELEMENT_HABIT, ELEMENT_LACK } from "./book/dict";
import type { ConcernAnswer, ElementView } from "./types";

/*
 * "요즘 고민"에 대한 도리의 답. AI 없이, 고른 고민 + 내 사주의 오행 균형으로 만든 규칙 기반 풀이예요.
 * 같은 입력이면 항상 같은 결과가 나오고, 단정하거나 겁주는 표현은 쓰지 않아요.
 * 직접 적은 글은 서버에서 이 규칙에 쓰지 않고(해석하지 않고) 그대로 되돌려 보여 주기만 해요.
 */

const BODY: Record<ConcernId, { lead: string; tip: string }> = {
  crush: {
    lead: "설레는 마음이 크면 상대의 한마디에 하루가 흔들리기 쉬워요. 결과를 점치기보다, 내가 편안한 속도를 지키는 쪽이 오래 가요.",
    tip: "이번 주에는 확인받으려는 연락 대신, 부담 없는 안부 한 번만 건네 보세요.",
  },
  relationship: {
    lead: "좋은 관계인지는 '설렘'보다 '함께 있을 때 내가 편한가'로 살펴보면 선명해져요. 사주는 방향을 비춰 줄 뿐, 결정은 언제나 내 마음이 해요.",
    tip: "좋았던 순간 3가지와 마음에 걸린 순간 3가지를 적어 나란히 놓고 보세요.",
  },
  breakup: {
    lead: "정리가 안 되는 건 약해서가 아니라 그만큼 진심이었다는 뜻이에요. 마음은 억지로 끊기보다 시간을 두고 천천히 가라앉아요.",
    tip: "연락처를 정리하고, 이번 주 나를 위한 작은 일정 하나를 먼저 잡아 보세요.",
  },
  marriage: {
    lead: "인연은 '언제'보다 '어떤 사람과 어떤 속도로'가 더 중요해요. 서두르기보다 나와 생활 리듬이 맞는 사람을 알아보는 눈을 키우는 시기로 봐도 좋아요.",
    tip: "내가 포기할 수 없는 가치 3가지를 적어 두면 만남의 기준이 또렷해져요.",
  },
  job: {
    lead: "이직이나 퇴사는 '탈출'보다 '다음 단계 준비'가 되어 있을 때 마음이 가벼워요. 지금 흐름을 점검하고 움직일 타이밍을 고르면 후회가 줄어요.",
    tip: "지금 일에서 배운 것 3가지와, 다음에 꼭 갖고 싶은 조건 3가지를 적어 보세요.",
  },
  workpeople: {
    lead: "직장 관계의 스트레스는 사람을 바꾸기보다 '거리와 말투'를 조절할 때 훨씬 줄어요. 내가 지킬 선을 정해 두면 마음이 덜 닳아요.",
    tip: "오늘부터 퇴근 후 업무 생각을 끊는 나만의 의식(산책, 음악 등) 하나를 정해 보세요.",
  },
  career: {
    lead: "방향이 안 보일 땐 정답을 찾기보다 '끌리는 일'을 작게 시험해 보는 게 빨라요. 해 보고 나서야 알게 되는 적성이 많거든요.",
    tip: "한 달 동안 부담 없이 해볼 수 있는 작은 실험(강의, 사이드 프로젝트, 인터뷰) 하나를 골라 보세요.",
  },
  money: {
    lead: "재테크 불안은 '얼마'보다 '흐름이 보이지 않아서' 커지는 경우가 많아요. 내 돈의 들어오고 나가는 길을 눈으로 보면 마음이 한결 가벼워져요.",
    tip: "고정 지출과 새는 지출을 나눠 적고, 자동 저축 금액을 부담 없는 수준에서 먼저 정해 보세요.",
  },
  burnout: {
    lead: "지치는 건 게을러서가 아니라 오래 열심히 해 왔다는 신호예요. 더 해내는 것보다 잘 쉬는 법을 찾는 시기일 수 있어요.",
    tip: "이번 주 하루는 '아무것도 안 해도 되는 시간'을 일정에 먼저 넣어 두세요. 몸이 계속 힘들면 전문가와 이야기해 보는 것도 좋아요.",
  },
  selfesteem: {
    lead: "스스로가 작게 느껴지는 날은 남과 비교하는 시간이 길어진 날일 때가 많아요. 타고난 기질엔 저마다 쓰임이 있고, 지금의 불안도 지나가는 날씨 같은 거예요.",
    tip: "하루 끝에 '오늘 해낸 작은 일' 세 가지를 적어 보세요. 마음이 계속 무겁다면 믿을 만한 사람이나 전문가와 나눠 보세요.",
  },
  exam: {
    lead: "시험 준비는 의지보다 '리듬'이 이겨요. 잘되는 시간대와 방식을 찾아 반복하면 컨디션이 안정되고 집중이 오래 가요.",
    tip: "하루 공부량을 욕심내기보다, 가장 집중되는 시간대 2시간을 꾸준히 지키는 것부터 해 보세요.",
  },
  friends: {
    lead: "가까운 사이일수록 기대가 커져서 서운함도 커져요. 마음을 말로 가볍게 꺼내면 생각보다 쉽게 풀리는 일이 많아요.",
    tip: "서운했던 일을 '나는 ~해서 속상했어' 한 문장으로 정리해 두면 말을 꺼내기 쉬워요.",
  },
};

/** 고른 고민마다 도리의 답을 만들어요. (직접 쓴 글만 있고 고른 버튼이 없으면 답 카드는 만들지 않아요) */
export function buildConcernAnswers(concern: Concern | null | undefined, elements: ElementView[], gradeLabel: string): ConcernAnswer[] {
  if (!hasConcern(concern) || concern.tags.length === 0) return [];
  const lowest = elements.reduce((a, b) => (b.count < a.count ? b : a), elements[0]);
  const info = ELEMENT_INFO[lowest.name];
  const habit = ELEMENT_HABIT[lowest.name];
  const chartLine = `내 사주는 ${gradeLabel} 에너지에 ${lowest.name}(${info.color}) 기운이 가장 적어요. ${ELEMENT_LACK[lowest.name]} 도움이 되는 생활 습관은 '${habit.habit}'이에요.`;
  return concern.tags.map((id) => {
    const chip = CONCERN_CHIPS.find((c) => c.id === id)!;
    const b = BODY[id];
    return { id, emoji: chip.emoji, title: concernLabel(id), body: `${b.lead} ${chartLine} ${b.tip}` };
  });
}
