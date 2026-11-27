/*
 * 프리미엄 리포트가 처음부터 끝까지 하나의 이야기처럼 읽히게 하는 "이음 문장".
 * 장 끝마다 앞 내용을 받아서 다음 장으로 건네요. (키는 현재 쪽의 key → [앞 내용을 받는 말, 다음으로 건네는 말])
 */
export const BRIDGES: Record<string, [string, string]> = {
  preface: ["사주가 ‘태어난 순간의 날씨 지도’라는 걸 알았으니,", "이제 네 지도를 직접 펼쳐 볼 차례야. 먼저 네 사주를 한눈에 볼게."],
  overview: ["네 사주의 큰 그림이 그려졌어.", "이제 이 그림이 네가 가장 궁금해한 것에 뭐라고 답하는지, 결론부터 들려줄게."],
  concernTop: ["네 고민에 대한 사주풀이 결론부터 말했으니,", "이제 그 결론이 어디서 나왔는지 뿌리를 볼 차례야. 네 기둥 네 개를 하나씩 세워 볼게."],
  pillars: ["네 기둥을 세웠으니,", "그 한가운데 앉은 일주(나를 뜻하는 기둥)가 어떤 사람인지 들여다볼게."],
  nature: ["일주로 네 중심을 봤다면,", "이번에는 네 사주 전체에 어떤 기운이 많고 적은지(오행), 그 중심이 어떤 날씨 속에 있는지 볼게."],
  elements: ["기운의 양을 알았으니,", "그 기운으로 세상과 어떻게 만나는지(십성), 네가 살아가는 방식을 볼 차례야."],
  tengods: ["타고난 성향과 방식을 봤으니,", "이제 그 힘이 인생의 시기마다 어떻게 오르내리는지(십이운성) 흐름을 볼게."],
  stage12: ["시기마다 힘이 달라진다는 걸 알았으니,", "그 흐름 속에서 위기도 기회도 되는 특별한 기운(신살)을 짚어 볼게."],
  sinsal: ["위기가 될 수 있는 기운도 봤으니, 이번엔 반대로", "힘들 때 곁에서 널 받쳐 줄 기운(귀인)을 찾아볼게."],
  gui: ["여기까지가 네 사주의 바탕이야.", "이제 이 바탕이 삶의 분야마다 어떻게 나타나는지 볼게. 먼저 돈(재물)부터."],
  "topic:money": ["돈의 그릇을 봤으니,", "마음의 그릇 이야기로 넘어가 볼게. 사랑의 결이야."],
  "topic:love": ["마음의 결을 봤으니,", "하루의 대부분을 쓰는 일의 결(직업)은 어떤지 볼게."],
  "topic:career": ["일하는 힘은 결국 몸에서 나와.", "마지막 분야로 네 몸의 결(건강)을 살펴볼게."],
  "topic:health": ["분야별 이야기는 여기까지야.", "이제부터는 부록으로, 지금까지 읽은 이야기를 받치는 뼈대(격국과 용신)를 한 번 정리해 볼게."],
  geukguk: ["뼈대를 알았으니,", "이 뼈대 위로 10년마다 계절이 바뀌는 큰 흐름(대운)을 볼 차례야."],
  daeun: ["10년의 큰 계절을 봤으니,", "그 안에서 올해와 내년은 어떤 날씨인지 가까이 들여다볼게."],
  years: ["올해와 내년의 큰 분위기를 봤다면,", "이번에는 달마다 날씨가 어떻게 바뀌는지 볼게."],
  "years:2": ["흐름을 다 읽었으니,", "마지막으로 처음에 네가 들고 온 고민으로 돌아가 볼게."],
  concern: ["고민에 대한 답까지 왔어.", "이 모든 이야기를 한 줄로 챙겨 갈 수 있게, 슬로건과 부적, 그리고 편지를 건넬게."],
};

/** 같은 “이어서 ○○ 이야기를 들려줄게”가 반복되지 않게 돌려 쓰는 문장틀 */
const SECTION_LINKS = [
  (h: string) => `이어서 ‘${h}’ 이야기를 들려줄게.`,
  (h: string) => `이 흐름 그대로 ‘${h}’도 살펴보자.`,
  (h: string) => `여기서 한 걸음 더, ‘${h}’ 이야기로 넘어가 볼게.`,
  (h: string) => `자, 다음은 ‘${h}’야.`,
];

export function sectionLink(heading: string, groupIndex: number): string {
  const h = heading.replace(/ · .*$/, "");
  return SECTION_LINKS[(Math.max(1, groupIndex) - 1) % SECTION_LINKS.length](h);
}

/** 장을 열 때 앞에서 본 내 사주를 한 줄로 받아 오는 "이어받기"에 필요한 값만 담은 모양 */
export interface OpeningFacts {
  dayFull: string | null;
  dayReading: string | null;
  elements: Array<{ name: string; count: number }>;
  grade: string;
  geukguk: string;
  yongsin: string[];
  daeunNow: string | null;
  year: number | null;
  yearGanzhi: string | null;
}

const EL_DISPLAY: Record<string, string> = { 목: "나무", 화: "불", 토: "땅", 금: "쇠", 수: "물" };

const TOPIC_WORD: Record<string, string> = { "topic:money": "돈", "topic:love": "사랑", "topic:career": "일", "topic:health": "몸" };

const STEM_EL: Record<string, string> = { 甲: "목", 乙: "목", 丙: "화", 丁: "화", 戊: "토", 己: "토", 庚: "금", 辛: "금", 壬: "수", 癸: "수" };

/**
 * 오행 개수가 같을 때 "하나만" 고르지 않고, 이유를 붙여 구분해요.
 * - 가장 많은 기운이 여럿이고 일간(나 자신)의 오행이 그중 하나면 → "나의 중심"
 * - 가장 적은 기운이 여럿이고 그중 하나만 용신이면 → "더 필요한 기운"
 */
export function elementFocus(elements: Array<{ name: string; count: number }>, dayStem: string, yongsinStems: string[]) {
  const disp = (n: string) => `${EL_DISPLAY[n] ?? n} 기운`;
  const out = { center: null as string | null, need: null as string | null, centerWhy: null as string | null, needWhy: null as string | null, notes: {} as Record<string, string> };
  if (!elements.length) return out;
  const maxC = Math.max(...elements.map((e) => e.count));
  const minC = Math.min(...elements.map((e) => e.count));
  if (maxC === minC) return out;
  const tops = elements.filter((e) => e.count === maxC).map((e) => e.name);
  const lows = elements.filter((e) => e.count === minC).map((e) => e.name);
  const dayEl = STEM_EL[dayStem?.[0] ?? ""] ?? null;
  const yongEls = [...new Set(yongsinStems.map((y) => STEM_EL[y?.[0] ?? ""]).filter(Boolean))];
  if (tops.length > 1 && dayEl && tops.includes(dayEl)) {
    out.center = dayEl;
    const plain = tops.map((n) => EL_DISPLAY[n] ?? n).join(tops.length === 2 ? "과 " : "·");
    out.centerWhy = `${tops.map(disp).join("과 ")}이 ${maxC}개로 같아. '나 자신'을 의미하는 네 일간(${dayStem[0]})이 곧 ${EL_DISPLAY[dayEl]}이기에, ${plain}의 개수는 같아도 ${disp(dayEl)}을 네 사주의 중심으로 볼 거야.`;
  }
  const needs = lows.filter((n) => yongEls.includes(n));
  if (lows.length > 1 && needs.length === 1) {
    out.need = needs[0];
    out.needWhy = `${lows.map(disp).join("과 ")}은 둘 다 ${minC}개로 비어 있어. 그중 ${disp(needs[0])}은 사주의 균형을 잡아 주는 기운(용신)이라, 같은 ${minC}개여도 이쪽이 더 필요해.`;
  }
  for (const n of tops) out.notes[n] = n === out.center ? "나의 중심 · 가장 많음" : "가장 많음";
  for (const n of lows) out.notes[n] = n === out.need ? "더 필요한 기운 · 가장 적음" : "가장 적음";
  return out;
}

/**
 * 장 맨 앞에서 "앞에서 본 내 사주"를 한 줄로 받아 이어 줘요. 이 사람의 값(일주·오행·신강신약·용신…)으로 만들어서
 * 같은 책이어도 사람마다 다르게 이어져요. 값이 모자라면 null(아무것도 보이지 않아요).
 */
export function chapterOpening(key: string, f: OpeningFacts): string | null {
  const el = (n: string) => `${EL_DISPLAY[n] ?? n} 기운`;
  const maxC = Math.max(...f.elements.map((e) => e.count));
  const minC = Math.min(...f.elements.map((e) => e.count));
  const tops = f.elements.filter((e) => e.count === maxC);
  const lows = f.elements.filter((e) => e.count === minC);
  const names = (xs: Array<{ name: string }>) => xs.map((x) => el(x.name)).join("·");
  const yong = f.yongsin[0]?.replace(/\(.*$/, "");
  switch (key) {
    case "nature":
      return f.dayFull ? `앞에서 세운 네 기둥 가운데 ‘나’를 뜻하는 건 일주 ${f.dayFull}${f.dayReading ? `(${f.dayReading})` : ""}야. 이제 이 두 글자 속으로 들어가 볼게.` : null;
    case "elements":
      return f.elements.length && maxC !== minC
        ? `제1장에서 일주 하나로 중심을 봤다면, 이번엔 사주 전체야. 네 사주에는 ${names(tops)}이 ${tops.length > 1 ? "각 " : ""}${maxC}개로 가장 많고, ${names(lows)}은 ${lows.length > 1 ? "각 " : ""}${minC}개로 가장 적어.${(() => { const ef = elementFocus(f.elements, f.dayFull?.[0] ?? "", f.yongsin); return [ef.centerWhy, ef.needWhy].filter((t): t is string => !!t).map((t) => ` ${t.replace(/^[^.]*\.\s*/, "")}`).join(""); })()}`
        : null;
    case "tengods":
      return null; // 십성 쪽은 도리 말풍선이 바로 이어 줘요
    case "topic:money":
    case "topic:love":
    case "topic:career":
    case "topic:health": {
      const w = TOPIC_WORD[key];
      if (!f.grade) return null;
      return yong
        ? `앞에서 본 ${f.grade} 사주와 도움이 되는 기운(${yong})이, ${w}의 결에서는 어떻게 나타나는지 따라가 보자.`
        : `앞에서 본 ${f.grade} 사주의 모습이, ${w}의 결에서는 어떻게 나타나는지 따라가 보자.`;
    }
    case "geukguk":
      return f.geukguk ? `분야별 이야기 밑에는 ‘${f.geukguk}’이라는 뼈대가 있어. 지금까지 읽은 이야기가 모두 이 뼈대에서 자라난 거야.` : null;
    case "daeun":
      return f.daeunNow ? `뼈대 위로 10년마다 계절이 바뀌어. 네가 지금 지나는 계절은 ${f.daeunNow} 대운이야.` : null;
    case "years":
      return f.year && f.yearGanzhi ? `${f.daeunNow ? `${f.daeunNow} 대운이라는 큰 계절 안에서, ` : ""}${f.year}년은 ${f.yearGanzhi}년이야.` : null;
    default:
      return null;
  }
}
