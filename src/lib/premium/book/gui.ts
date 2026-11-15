import type { SajuResult } from "ssaju";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import type { BookSection } from "../types";
import type { PosKey } from "./insight";
import { buildMonthTimeline } from "./timeline";

/*
 * 제6장 귀인(인복) 확장. 모두 코드로만 계산해요(AI 호출 없음, 같은 입력이면 같은 결과).
 * - 천을귀인: 일간 기준 두 지지(띠). 원국에 있으면 "이미 가진 귀인", 없으면 "밖에서 만나며 만들어 가는 귀인".
 * - 귀인이 되어 주기 쉬운 사람: 용신 오행을 채워 주는 띠와 사람의 결.
 * - 도움을 청하기 좋은 시기: 올해·내년 세운과 앞으로 12개월 중 용신 기운이 들어오는 해·달. "이때 나타난다"가 아니라 "이때 도움을 청하기 좋아".
 * 단정하지 않고 겁주지 않아요.
 */

const EL_KO: Record<string, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

const ZODIAC: Record<string, string> = { 子: "쥐", 丑: "소", 寅: "호랑이", 卯: "토끼", 辰: "용", 巳: "뱀", 午: "말", 未: "양", 申: "원숭이", 酉: "닭", 戌: "개", 亥: "돼지" };
const ELEMENT_BRANCHES: Record<string, string[]> = { 목: ["寅", "卯"], 화: ["巳", "午"], 토: ["丑", "辰", "未", "戌"], 금: ["申", "酉"], 수: ["子", "亥"] };
/** 일간 → 천을귀인 지지 두 개 */
const CHEONEUL: Record<string, [string, string]> = {
  甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"],
  乙: ["子", "申"], 己: ["子", "申"],
  丙: ["亥", "酉"], 丁: ["亥", "酉"],
  壬: ["巳", "卯"], 癸: ["巳", "卯"],
  辛: ["寅", "午"],
};
/** 용신 오행별 "도움이 되어 주기 쉬운 사람의 결" */
const PERSON: Record<string, string> = {
  목: "새로운 걸 배우게 해 주고 성장을 응원해 주는 사람(선생님·멘토·잘 따르는 후배 같은 결)",
  화: "분위기를 밝혀 주고 마음에 불을 붙여 주는 사람(칭찬과 응원을 아끼지 않는 결)",
  토: "믿고 맡길 수 있는 든든한 중재자(차분하고 약속을 잘 지키는 큰언니·큰형 같은 결)",
  금: "정리와 결단을 도와주는 사람(말이 정확하고 일 처리가 깔끔한 결)",
  수: "지혜롭게 길을 알려 주는 사람(정보가 많고 흐름을 읽어 주는 결)",
};

const zodiacOf = (branches: string[]) => branches.map((b) => `${ZODIAC[b]}띠`).join("·");
const elOfStem = (h: string) => EL_KO[STEMS.find((s) => s.hanja === h)?.element ?? ""] ?? "";
const elOfBranch = (h: string) => EL_KO[BRANCHES.find((b) => b.hanja === h)?.element ?? ""] ?? "";

export function guiSections(r: SajuResult, opts: { hourUnknown: boolean; now: Date }): BookSection[] {
  const natal: Partial<Record<PosKey, string>> = { year: r.pillars.year, month: r.pillars.month, day: r.pillars.day };
  if (!opts.hourUnknown) natal.hour = r.pillars.hour;
  const natalBranches = Object.values(natal).map((p) => p?.[1] ?? "");
  const yong = [...new Set(r.advanced.yongsin.map((y) => elOfStem(y)).filter(Boolean))];
  const out: BookSection[] = [];

  // ① 천을귀인
  const ce = CHEONEUL[r.dayStem];
  if (ce) {
    const has = ce.filter((b) => natalBranches.includes(b));
    const names = zodiacOf(ce);
    out.push({
      heading: `내 천을귀인 · ${names}`,
      body: has.length
        ? `네 일간 기준 천을귀인은 ${names}야. 원국에 ${zodiacOf(has)}의 글자가 이미 있어서, 어려울 때 도움을 청하면 답이 오기 쉬운 결을 타고난 편이야. 주변에 ${zodiacOf(has)} 또는 그와 비슷한 결의 사람이 있다면 조언을 한 번 들어 봐.`
        : `네 일간 기준 천을귀인은 ${names}야. 원국에는 이 글자가 없어서 거저 쥐어진 귀인은 아니지만, 복이 없다는 뜻은 전혀 아니야. 이런 경우는 밖에서 사람을 만나고 부대끼는 가운데 귀인을 직접 만들어 가는 결이라고 보는 게 정확해.`,
    });
  }

  // ② 귀인이 되어 주기 쉬운 사람
  if (yong.length) {
    const lines = yong.map((el) => `- **${el} 기운**을 채워 주는 ${zodiacOf(ELEMENT_BRANCHES[el])}의 사람: ${PERSON[el]}`).join("\n");
    out.push({
      heading: "내게 귀인이 되어 주기 쉬운 사람",
      body: `네 사주에서 부족한 결을 채워 주는 용신 오행은 ${yong.join("·")}이야. 그래서 아래 같은 결의 사람이 곁에서 힘이 되어 주기 쉬워. 띠는 참고일 뿐이라 다른 띠에서도 같은 결의 사람은 얼마든지 있어.\n${lines}`,
    });
  }

  // ③ 도움을 청하기 좋은 시기 (해·달)
  if (yong.length) {
    const ys = r.seyun.filter((s) => s.year >= r.currentYear && s.year <= r.currentYear + 1);
    const yearHits = ys.filter((s) => yong.includes(elOfStem(s.ganzhi[0])) || yong.includes(elOfBranch(s.ganzhi[1])));
    const plans = buildMonthTimeline({ natal, dayStem: r.dayStem, yongsinEls: yong, now: opts.now, count: 12 });
    const monthHits = plans.filter((p) => p.yongsinIn.length > 0).slice(0, 4);
    const yText = yearHits.length ? `${yearHits.map((s) => `${s.year}년`).join("·")}은 세운에 네 용신 기운이 들어와서, 새로운 사람에게 먼저 다가가거나 조언을 청하기 좋은 해야.` : `올해와 내년 세운에는 용신 기운이 뚜렷하게 들어오진 않아. 그래도 아래 달들을 눈여겨봐.`;
    const mText = monthHits.length ? `앞으로 12개월 중에는 ${monthHits.map((p) => `${p.month}월경`).join(", ")}에 용신 기운이 월운으로 들어와. 이 달들에는 소개를 부탁하거나 선배·동료에게 도움을 청해 보기 좋아.` : "";
    out.push({
      heading: "도움을 청하기 좋은 시기",
      body: `${yText} ${mText} ‘이때 귀인이 나타난다’는 뜻은 아니고, 내가 먼저 손을 내밀기 좋은 흐름이라는 뜻이야.`.replace(/\s+/g, " ").trim(),
    });
  }

  // ④ 스스로 귀인이 되는 법
  out.push({
    heading: "귀인이 곁에 오면, 이렇게 해 봐",
    body: "귀인은 가만히 기다린다고 오는 게 아니라, 내가 먼저 사람을 만나고 마음을 열 때 곁에 오는 경우가 많아. 조언을 들었을 때는 바로 반박하기보다 한 번 적어 두고 하루 뒤에 다시 생각해 봐. 도움을 받은 뒤에는 감사 인사와 작은 보답을 잊지 않으면, 그 인연이 오래 가는 든든한 뒷배가 되기 쉬워. 그리고 어느 날은 네가 누군가의 귀인이 되어 있을 거야.",
  });
  return out;
}
