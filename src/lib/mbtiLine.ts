import { cleanMbti } from "./mbtiBrief";
import { josa } from "./premium/josa";

/*
 * 10년 카드에 붙이는 MBTI 한 줄. 입력한 MBTI 네 글자를 풀어서, 사주가 말하는 그 시기의 주제(십성 묶음)와 만나는 모습으로 이어 줘요.
 * 같은 입력이면 같은 문장이라 AI 를 쓰지 않아요. MBTI 는 곁에 놓고 보는 참고예요.
 */

/** "○○ 특유의 ○○ ○○" 형용사 조합: 가능성/현실(N·S) × 열어 둠/계획(P·J), 사람/속마음(E·I) × 마음/이치(F·T) */
const ADJ: Record<string, string> = { NP: "번뜩이는", NJ: "멀리 내다보는", SP: "현장감 있는", SJ: "꼼꼼한" };
const NOUN: Record<string, string> = { EF: "다정함", ET: "추진력", IF: "섬세함", IT: "분석력" };

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

/** MBTI 가 없거나 모르는 값이면 빈 문장. 카드 본문 속 한 문장으로 들어가요("○○ 특유의 …"). */
export function mbtiDecadeLine(rawMbti: unknown, group: string, tense: "past" | "now" | "future"): string {
  const m = cleanMbti(rawMbti);
  if (!m || !PAST[group]) return "";
  const adj = ADJ[`${m[1]}${m[3]}`];
  const noun = NOUN[`${m[0]}${m[2]}`];
  const sub = `${m} 특유의 ${adj} ${noun}`;
  const tail = tense === "past" ? PAST[group] : tense === "now" ? NOW[group] : FUTURE[group];
  return tense === "past" ? `${josa(sub, "이/가")} 이 시기의 주제와 만나서, ${tail}.` : `${josa(sub, "은/는")} 이 시기에 ${tail}.`;
}
