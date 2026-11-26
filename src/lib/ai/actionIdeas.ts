/**
 * 상담실 "이번 주에 해 볼 작은 행동" 후보.
 * 프롬프트에 예시 하나(폰 알림 끄고 산책)가 박혀 있으면 모델이 매번 그것만 고르기 때문에,
 * 질문마다 다른 후보 3개를 코드가 골라 넘겨요. (같은 질문이면 같은 후보, 질문이 바뀌면 다른 후보)
 */
/** 사주와 상관없이 쓸 수 있는 일반 후보. (집안 정돈·침구·메뉴 같은 식상한 것은 뺐어요: 11-26 점검) */
const GENERIC: string[] = [
  "가까운 사람 한 명에게 안부 이모티콘 하나 보내기",
  "이번 주 하고 싶은 일 하나를 정해 가까운 사람에게 말로 얘기해 두기",
  "자기 전에 오늘 잘한 일 하나 떠올리기",
  "미뤄 둔 작은 일 하나를 10분만 해서 끝내기",
  "평소 안 가던 카페나 가게 한 곳 들러 보기",
  "이번 주에 한 번은 평소와 다른 길로 귀가해 보기",
  "읽다 만 책 5쪽만 읽기",
  "친구에게 \"요즘 어때?\" 한 줄 보내기",
  "5분 타이머를 맞추고 한 가지에만 집중해 보기",
  "일정표에 '아무것도 안 하는 30분' 한 칸 만들기",
  "해야 할 일 중 가장 쉬운 것부터 하나 체크하기",
  "오늘 한 번 \"고마워\"라고 말해 보기",
  "이번 주 지출 중 줄일 수 있는 것 하나 고르기",
];

/** 내 사주에서 가장 부족한 기운을 채우는 행동. 근거(부족한 기운)와 바로 이어져서 "왜 이걸 하라는지"가 보여요. */
export type LackEl = "wood" | "fire" | "earth" | "metal" | "water";
export const LACK_ACTIONS: Record<LackEl, string[]> = {
  water: ["퇴근길에 강이나 호수가 보이는 길로 돌아가 걷기", "자기 전에 미지근한 물로 천천히 샤워하기", "파란색이나 검은색 물건 하나를 책상 가까이 두기"],
  fire: ["점심때 햇볕 드는 곳에서 10분 걷기", "저녁에 방 조명을 따뜻한 색으로 바꿔 보기", "붉은색이나 주황색 소품 하나를 눈에 띄는 곳에 두기"],
  wood: ["초록 식물 하나를 눈에 보이는 곳에 두기", "공원이나 나무가 있는 길로 10분 걷기", "이번 주에 새로 배워 보고 싶은 것 하나를 검색해 보기"],
  earth: ["하루 중 같은 시각에 하는 작은 루틴 하나 정하기", "이번 주 한 끼는 자리에 앉아 천천히 차려 먹기", "베이지색이나 황토색 소품을 곁에 두기"],
  metal: ["서랍이나 파일 한 칸만 골라 필요 없는 것 비우기", "결정을 미루던 일 하나에 마감 날짜 정하기", "흰색이나 은색 소품 하나를 곁에 두기"],
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
