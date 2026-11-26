/**
 * 상담실 "이번 주에 해 볼 작은 행동" 후보.
 * 프롬프트에 예시 하나(폰 알림 끄고 산책)가 박혀 있으면 모델이 매번 그것만 고르기 때문에,
 * 질문마다 다른 후보 3개를 코드가 골라 넘겨요. (같은 질문이면 같은 후보, 질문이 바뀌면 다른 후보)
 */
/** 사주와 상관없이 쓸 수 있는 일반 후보. (집안 정돈·침구·메뉴 같은 식상한 것은 뺐어요: 11-26 점검) */
const GENERIC: string[] = [
  "미루던 연락 한 통을 이번 주 안에 보내기(오랜 친구·선배·가족 중 한 명)",
  "퇴근길에 한 정거장 먼저 내려 걸어가 보기",
  "이번 주 하고 싶은 일 하나를 정해 가까운 사람에게 말로 얘기해 두기",
  "고마운 사람 한 명에게 \"그때 이게 고마웠어\"라고 구체적으로 말하기",
  "불편했던 일 하나를 감정은 빼고 사실만 한 문장으로 상대에게 말해 보기",
  "다음 달에 가고 싶은 곳 하나를 정해 날짜까지 잡아 두기",
  "이번 주말에 가 보고 싶던 전시나 동네 한 곳을 일정에 넣기",
  "이번 주 저녁 약속 하나를 줄이고 그 시간을 좋아하는 취미에 쓰기",
  "평소 안 가던 동네 가게나 식당에 한 곳 가 보기",
  "이번 주에 하루는 평소와 다른 길로 귀가해 보기",
  "오늘 한 번 \"고마워\"라고 말해 보기",
  "이번 주 지출 중 줄일 수 있는 것 하나 고르기",
  "친구에게 \"요즘 어때?\" 한 줄 보내기",
];

/** 내 사주에서 가장 부족한 기운을 채우는 행동. 근거(부족한 기운)와 바로 이어져서 "왜 이걸 하라는지"가 보여요. */
export type LackEl = "wood" | "fire" | "earth" | "metal" | "water";
export const LACK_ACTIONS: Record<LackEl, string[]> = {
  water: ["이번 주말에 강·호수·바다 중 한 곳에 가 볼 약속 잡기", "수영이나 온천처럼 물과 닿는 활동을 이번 달에 한 번 예약하기", "퇴근길에 강이나 호수가 보이는 길로 돌아가 걷기"],
  fire: ["이번 주에 웃고 떠들 수 있는 모임이나 식사 약속 하나 잡기", "땀이 나는 운동(러닝·클라이밍·배드민턴) 한 번을 친구와 약속해 두기", "점심때 햇볕 드는 곳에서 10분 걷기"],
  wood: ["이번 달에 원데이 클래스나 체험 하나를 골라 신청하기", "공원이나 나무가 있는 길로 10분 걷기", "초록 식물 하나를 눈에 보이는 곳에 두기"],
  earth: ["가장 믿는 사람 한 명에게 요즘 고민을 먼저 털어놓기", "일정이 많은 날 하루는 약속 하나를 줄여 쉬는 시간 만들기", "이번 주 한 끼는 약속 없이 집에서 직접 차려 먹기"],
  metal: ["거절하지 못해 끌려가던 부탁이나 약속 하나를 정중하게 거절해 보기", "미루던 결정 하나에 마감 날짜를 정해 상대에게 알리기", "흰색이나 은색 소품 하나를 곁에 두기"],
};

export const ACTION_POOL: string[] = [...GENERIC, ...Object.values(LACK_ACTIONS).flat()];
const LACK_SET = new Set(Object.values(LACK_ACTIONS).flat());
export const LACK_LABEL: Record<LackEl, string> = { wood: "나무", fire: "불", earth: "땅", metal: "쇠", water: "물" };

/* 노트·메모·쪽지·가계부·기록처럼 "적어 보라"는 계열은 후보에서 뺐어요. (이용자가 싫어해요) */

/** 일·돈·투자·시험처럼 "무거운 주제" 질문에는 집안 정돈·몸 돌봄 후보가 엉뚱해 보여서 빼요. (11-25 점검: "목숨 걸고 일할 해야?"에 방 환기·침구 정리) */
const SERIOUS_TOPIC = /투자|주식|코인|펀드|부동산|재물|월급|빚|대출|돈|이직|퇴사|승진|회사|직장|업무|창업|부업|시험|합격|프로젝트|목숨|살\s?가치|가치가/;
const HOME_CARE = /환기|침구|핸드크림|디퓨저|일찍 자리에|스트레칭|음미|입기 편한|물 한 컵|메뉴|요리|배경화면|카페|귀가|치우기|샤워|식물|조명|소품|햇볕|공원|강이나|한 끼|서랍|루틴/;

/** 이미 권한 종류와 겹치는 후보는 빼고, 부족한 기운을 채우는 행동 2개 + 일반 1개를 질문·대화 길이·날짜로 흩어서 골라요. */
export function actionIdeas(question: string, turn: number, dayOfYear: number, skip: RegExp[] = [], lack?: LackEl): string[] {
  let h = turn * 7 + dayOfYear;
  for (const ch of question) h = (h * 31 + ch.charCodeAt(0)) % 100003;
  const ok = (item: string) => !skip.some((re) => re.test(item)) && !(SERIOUS_TOPIC.test(question) && HOME_CARE.test(item));
  const pick = (list: string[], want: number, out: string[]) => {
    const n = list.length;
    const start = h % n;
    for (let k = 0; k < n && out.length < want; k++) {
      const item = list[(start + k * 7) % n];
      if (!out.includes(item) && ok(item)) out.push(item);
    }
  };
  const out: string[] = [];
  if (lack) pick(LACK_ACTIONS[lack], 2, out);
  pick(GENERIC, 3, out);
  if (out.length < 3) pick(ACTION_POOL.filter((x) => !LACK_SET.has(x)), 3, out);
  return out;
}
