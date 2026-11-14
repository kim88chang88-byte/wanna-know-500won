import { cleanMbti } from "./mbtiBrief";

/*
 * 10년 카드에 붙이는 MBTI 한 줄. 입력한 MBTI 네 글자를 풀어서, 사주가 말하는 그 시기의 주제(십성 묶음)와 만나는 모습으로 이어 줘요.
 * 같은 입력이면 같은 문장이라 AI 를 쓰지 않아요. MBTI 는 곁에 놓고 보는 참고예요.
 */

const EI: Record<string, string> = { E: "사람 속에서 에너지를 얻는", I: "혼자 있는 시간에 힘을 모으는" };
const NS: Record<string, string> = { N: "가능성을 먼저 보는", S: "눈앞의 현실을 먼저 챙기는" };
const FT: Record<string, string> = { F: "마음을 먼저 헤아리는", T: "원리와 이치를 따져 보는" };
const PJ: Record<string, string> = { P: "열어 두고 움직이는", J: "계획을 세워 나가는" };

const PAST: Record<string, string> = {
  비겁: "내 방식을 고집하며 부딪히기도 했을 수 있어",
  식상: "하고 싶은 말과 끼를 이리저리 꺼내 보기도 했을 수 있어",
  재성: "돈과 현실을 처음 배우며 시행착오를 겪기도 했을 수 있어",
  관성: "규칙과 책임 앞에서 갈등하기도 했을 수 있어",
  인성: "배움과 보호 속에서 내공을 쌓기도 했을 수 있어",
};
const NOW: Record<string, string> = {
  비겁: "내 길을 당당히 여는 데 쓰면 힘이 돼",
  식상: "아이디어를 작게 먼저 보여 주는 데 쓰면 힘이 돼",
  재성: "계획을 숫자로 옮기는 데 쓰면 힘이 돼",
  관성: "역할을 정리하고 신뢰를 쌓는 데 쓰면 힘이 돼",
  인성: "배운 것을 정리하고 깊이를 만드는 데 쓰면 힘이 돼",
};
const FUTURE: Record<string, string> = {
  비겁: "내 이름으로 해 보고 싶은 일을 준비하는 데 쓰면 좋아",
  식상: "재능을 꺼내 연습해 두는 데 쓰면 좋아",
  재성: "기반을 다지고 판을 준비하는 데 쓰면 좋아",
  관성: "실력과 신뢰를 쌓는 데 쓰면 좋아",
  인성: "관심 있는 공부를 천천히 준비하는 데 쓰면 좋아",
};

/** MBTI 가 없거나 모르는 값이면 빈 문장 */
export function mbtiDecadeLine(rawMbti: unknown, group: string, tense: "past" | "now" | "future"): string {
  const m = cleanMbti(rawMbti);
  if (!m || !PAST[group]) return "";
  const trait = `${EI[m[0]]} ${NS[m[1]]} ${FT[m[2]]} ${PJ[m[3]]}`;
  const tail = tense === "past" ? PAST[group] : tense === "now" ? NOW[group] : FUTURE[group];
  return tense === "past"
    ? `${m}답게 ${trait} 기질이 이 시기의 주제와 만나서, ${tail}.`
    : `${m}의 ${trait} 기질은 이 시기에 ${tail}.`;
}
