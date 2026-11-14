import type { SajuResult } from "ssaju";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import { josa } from "../josa";
import { GROUP_TRAIT, groupOf, type Group } from "../topic";
import type { BookChart, BookChartPoint, BookSection } from "../types";
import { STAGE12_TEXT, PILLAR_MEANING } from "./dict";
import { interactionLine, type PosKey } from "./insight";

/*
 * 제4장(십이운성)과 대운 부록의 재료. 모두 코드로만 계산해요(AI 호출 없음, 같은 입력이면 같은 결과).
 * - 원국 네 기둥의 십이운성(일간 기준, 음양순역)
 * - 대운별 종합 에너지 그래프(십이운성 세기 + 용신 기운 + 번호)
 * - 번호 붙은 10년 카드(나이대·별명·간지·2~3문장)
 * - 지금 내 위치, 상생 고리, 행동 지침 2개, 공감 한 문장, 마무리 한마디, 용어 사전
 * 모든 표현은 단정하지 않고 겁주지 않아요. 힘든 시기는 "속도를 낮추고 쌓는 때"로 써요.
 */

export const STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"] as const;
export type Stage = (typeof STAGES)[number];

/** 십이운성 단계별 기운의 세기(0~100). 좋고 나쁨이 아니라 힘의 높이를 보는 그림용 값이에요. */
export const STAGE_LEVEL: Record<string, number> = { 장생: 62, 목욕: 48, 관대: 76, 건록: 92, 제왕: 100, 쇠: 70, 병: 46, 사: 30, 묘: 24, 절: 12, 태: 22, 양: 40 };

/** 천간별 장생 지지 인덱스(子=0). 양간은 순행, 음간은 역행(음양순역). */
const JANGSAENG: Record<string, number> = { 甲: 11, 乙: 6, 丙: 2, 丁: 9, 戊: 2, 己: 9, 庚: 5, 辛: 0, 壬: 8, 癸: 3 };

/** 일간(천간)을 기준으로 지지가 어느 십이운성 단계인지. */
export function stageOf(stem: string, branch: string): Stage | null {
  const st = STEMS.find((s) => s.hanja === stem);
  const bi = BRANCHES.findIndex((b) => b.hanja === branch);
  const start = JANGSAENG[stem];
  if (!st || bi < 0 || start === undefined) return null;
  const k = st.yinYang === "yang" ? (bi - start + 12) % 12 : (start - bi + 12) % 12;
  return STAGES[k];
}

const EL_KO: Record<string, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
const CYCLE = ["목", "화", "토", "금", "수"];

function stemEl(h: string | undefined): string {
  const s = STEMS.find((x) => x.hanja === h);
  return s ? (EL_KO[s.element] ?? "") : "";
}
function branchEl(h: string | undefined): string {
  const b = BRANCHES.find((x) => x.hanja === h);
  return b ? (EL_KO[b.element] ?? "") : "";
}

/** 간지 한자 → "병인(丙寅)" */
export function ganzhiLabel(gz: string): string {
  const s = STEMS.find((x) => x.hanja === gz[0]);
  const b = BRANCHES.find((x) => x.hanja === gz[1]);
  return s && b ? `${s.hangul}${b.hangul}(${gz})` : gz;
}

const CIRC = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫"];
const circ = (i: number) => CIRC[i] ?? `${i + 1}.`;

/** 앞 시기 기운(a) → 이번 시기 기운(b)이 이어지는 모양을 한 문장으로. */
export function chainLine(a: string, b: string): string {
  if (!a || !b) return "";
  const ai = CYCLE.indexOf(a);
  const bi = CYCLE.indexOf(b);
  if (ai < 0 || bi < 0) return "";
  if (a === b) return `같은 ${a} 기운이 이어져서 익숙한 결로 흘러가.`;
  const d = (bi - ai + 5) % 5;
  if (d === 1) return `${a} 기운이 ${b} 기운을 살려 주는 상생(${a}생${b}) 흐름이라, 앞에서 쌓은 것이 자연스럽게 이어져.`;
  if (d === 4) return `${b} 기운이 앞 시기의 ${a} 기운을 북돋아 주는 모양이라, 든든하게 받쳐 주는 느낌으로 넘어가.`;
  if (d === 2) return `앞 시기의 ${a} 기운이 ${b} 기운을 다스리는 모양이라, 새 흐름에는 천천히 적응하면서 내 방식을 조금씩 맞춰 가면 좋아.`;
  return `${b} 기운이 앞 시기의 ${a} 기운을 눌러 주는 모양이라, 방식이 달라지는 때야. 한 템포 여유를 두고 맞춰 가면 좋아.`;
}

/* ───────── 문장 사전 ───────── */

const AREA: Record<PosKey, string> = { year: "어린 시절과 첫인상, 가문의 바탕", month: "사회생활과 일하는 방식", day: "나 자신과 가까운 사람과의 관계", hour: "꿈과 앞날, 인생 후반" };

/** 원국 기둥 자리의 십이운성 한 줄(자리에 상관없이 읽히는 중립 서술) */
const STAGE_NATAL: Record<Stage, string> = {
  장생: "새로 시작하는 힘이 잘 붙어서, 배우고 시도하는 데 마음이 활짝 열려 있어.",
  목욕: "감수성이 풍부하고 변화에 민감해서, 새로운 것에 끌리고 매력이 잘 드러나.",
  관대: "자신감이 붙고 인정받고 싶은 마음이 커서, 앞으로 나아가려는 힘이 있어.",
  건록: "스스로 일어서는 힘이 단단해서, 내 힘으로 해내려는 실력이 안정적이야.",
  제왕: "기운이 가장 꽉 찬 자리라 주관이 또렷하고 힘이 넘쳐. 한 템포 쉬며 들으면 더 오래 빛나.",
  쇠: "힘이 차분히 가라앉아 균형을 잡는 자리라, 무리하기보다 노련하게 다루는 쪽이야.",
  병: "예민하고 섬세해서 마음을 잘 살피는 자리야. 몸과 마음을 먼저 돌볼수록 힘이 나.",
  사: "한 가지를 정리하고 방향을 다시 잡는 힘이 있어. 깊이 생각하고 가다듬는 데 강점이 있어.",
  묘: "안쪽에 차곡차곡 저장하는 자리라, 겉으로 드러내기보다 속이 알찬 편이야.",
  절: "묵은 틀을 끊고 새로 시작하는 힘이 있어. 변화와 전환에 용기를 내는 자리야.",
  태: "가능성이 조용히 싹트는 자리야. 아직 모양이 잡히기 전이라 가능성이 넓어.",
  양: "천천히 영양을 채우며 자라는 자리라, 보살핌 속에서 단단해지는 편이야.",
};

/** 지금 시기에 붙이는 이름 */
const STAGE_NAME: Record<Stage, string> = {
  장생: "새싹이 트는 시기",
  목욕: "마음이 말랑해지는 시기",
  관대: "발돋움하는 시기",
  건록: "제 힘으로 서는 시기",
  제왕: "정상에서 둘러보는 시기",
  쇠: "숨을 고르며 단단해지는 시기",
  병: "속도를 낮추고 돌보는 시기",
  사: "정리하고 방향을 트는 시기",
  묘: "안으로 갈무리하는 시기",
  절: "끊고 새로 시작하는 전환기",
  태: "가능성을 품는 시기",
  양: "차분히 채우며 자라는 시기",
};

/** 공감 한 문장(도리 말투, 겁주지 않기) */
const EMPATHY: Record<Stage, string> = {
  장생: "새로 시작하는 마음이 들떴다 가라앉아도 자연스러워. 새싹은 원래 여리면서 자라는 거야.",
  목욕: "마음이 자주 흔들려도 이상한 게 아니야. 감수성이 활짝 열려 있는 때라서 그래.",
  관대: "인정받고 싶은 마음에 조급해질 수 있어. 그만큼 앞으로 나아가려는 힘이 큰 거야.",
  건록: "혼자 다 해내려다 지칠 수 있어. 힘이 있는 만큼 나눠 써도 괜찮아.",
  제왕: "잘나갈수록 외로울 수 있어. 정상에서는 한 번 둘러보며 쉬어 가도 좋아.",
  쇠: "예전만큼 힘이 안 난다고 느껴도 괜찮아. 힘을 아끼고 정확하게 쓰는 때야.",
  병: "요즘 몸도 마음도 무겁게 느껴졌다면, 네가 약해서가 아니라 기운이 속도를 낮추라고 신호를 보내는 거야.",
  사: "마무리와 방향 전환이 겹쳐 마음이 어수선할 수 있어. 정리하는 시기에는 자연스러운 일이야.",
  묘: "겉으로 드러나는 게 없어 답답할 수 있어. 그건 안쪽에 저장하는 중이라서 그래.",
  절: "끊고 다시 시작하는 때라 불안할 수 있어. 새 출발 직전에 드는 마음이니 너무 걱정하지 마.",
  태: "아직 모양이 안 잡혀 막연해도 괜찮아. 싹이 트기 전의 조용한 시간이야.",
  양: "속도가 느리게 느껴져도 괜찮아. 영양을 채우는 중이라 그래.",
};

/** 마무리 한마디 */
const CLOSING: Record<Stage, string> = {
  장생: "작게 시작한 오늘이 새싹이야. 물만 챙겨 주면 돼.",
  목욕: "흔들리는 마음도 네 감각이야. 좋아하는 것을 하나 더 알아 가는 날로 삼아 봐.",
  관대: "한 걸음 앞으로. 인정은 천천히 따라와.",
  건록: "내 힘으로 세운 하루, 오늘도 충분히 잘하고 있어.",
  제왕: "높이 오른 만큼 한 번 쉬어 가도 괜찮아.",
  쇠: "덜어낸 만큼 단단해지는 때야. 오늘은 꼭 필요한 것 하나만.",
  병: "오늘은 속도를 낮추고 나를 먼저 돌봐 줘.",
  사: "하나를 정리하면 다음 길이 보여. 작은 정리부터 해 보자.",
  묘: "보이지 않아도 쌓이고 있어. 오늘의 한 줄이 밑거름이야.",
  절: "끊은 자리에 새 길이 열려. 첫걸음만 가볍게.",
  태: "아직 모양이 없어도 괜찮아. 가능성이 자라는 중이야.",
  양: "천천히 채우는 날도 성장이야. 오늘도 한 모금씩.",
};

/** 십성 묶음별 행동 지침 2개 */
const ACTIONS: Record<Group, [string, string]> = {
  비겁: ["이번 달에 ‘내가 직접 정하는 일’ 하나를 골라 끝까지 해 봐. 주관이 또렷한 시기라 스스로 정한 일이 힘이 돼.", "믿는 사람 한 명에게 계획을 말해 봐. 혼자 끌어안기보다 같이 가면 비교와 경쟁의 피로가 줄어."],
  식상: ["머릿속 아이디어를 하루 10분, 글이나 그림이나 말로 꺼내 기록해 봐.", "작은 결과물 하나를 주변에 보여 줘 봐. 표현은 꺼낼수록 길이 열려."],
  재성: ["수입과 지출을 일주일만 가볍게 적어 보며 실속을 확인해 봐.", "이루고 싶은 일을 3개월짜리 작은 목표로 쪼개서, 이번 주에 할 일부터 정해 봐."],
  관성: ["맡은 역할 중 가장 중요한 한 가지에 먼저 힘을 실어 봐. 다 잘하려 하지 않아도 인정받기 좋은 시기야.", "하루에 아무것도 책임지지 않는 30분을 꼭 챙겨 줘. 책임이 커질수록 쉼이 흐름을 지켜 줘."],
  인성: ["배우고 싶던 것 하나를 골라 이번 달부터 조금씩 시작해 봐(책 한 권, 수업 한 번).", "배운 걸 하루에 한 줄 정리해 봐. 안쪽에서 쌓이는 힘이 눈에 보이게 돼."],
};

/** 올해 세운 십성 묶음별로 행동 지침에 이어 주는 한 줄 */
const YEAR_HOOK: Record<Group, string> = {
  비겁: "나와 주변 사람의 기운이 함께 커지는 해라서, 함께할 사람을 정하고 내 몫을 분명히 하는 데 좋아.",
  식상: "표현하고 만들어 내는 기운이 커지는 해라서, 위의 행동을 올해 안에 눈에 보이는 결과물로 이어 가기 좋아.",
  재성: "현실적인 실속이 눈에 들어오는 해라서, 위의 행동을 숫자와 계획으로 옮겨 보기 좋아.",
  관성: "책임과 기회가 함께 오는 해라서, 속도를 조절하며 역할을 정리해 두면 좋아.",
  인성: "배우고 채우는 기운이 받쳐 주는 해라서, 겉으로 큰 변화가 없어도 안쪽을 단단히 하기 좋아.",
};

const STAGE_CLASS: Record<Stage, 0 | 1 | 2 | 3> = { 장생: 0, 목욕: 0, 관대: 0, 건록: 1, 제왕: 1, 쇠: 2, 병: 2, 사: 2, 묘: 3, 절: 3, 태: 3, 양: 3 };

/** 별명 풀: 십성 묶음 × (오르는 때 / 정점 / 숨 고르기 / 갈무리) × 2가지 */
const NICK: Record<Group, Array<[string, string]>> = {
  비겁: [["내 길을 찾아 나서는 때", "나다움이 깨어나는 때"], ["내 힘으로 우뚝 서는 때", "주관이 가장 또렷한 때"], ["경쟁보다 나를 살피는 때", "속도를 낮추고 중심을 잡는 때"], ["혼자 힘을 모으는 때", "조용히 뿌리내리는 때"]],
  식상: [["재능이 싹트는 때", "표현이 트이는 때"], ["재능이 활짝 피는 때", "내 끼가 빛나는 때"], ["꺼내기 전에 다듬는 때", "말보다 결을 고르는 때"], ["아이디어를 품는 때", "재료를 모으는 때"]],
  재성: [["현실 감각이 자라는 때", "실속을 배우는 때"], ["성과가 손에 잡히는 때", "실속이 쌓이는 때"], ["벌이보다 정리하는 때", "지킬 것을 고르는 때"], ["씨앗을 심는 때", "기반을 다지는 때"]],
  관성: [["책임이 어깨에 얹히는 때", "역할이 생겨나는 때"], ["인정받는 때", "역할이 빛나는 때"], ["무게를 덜며 가다듬는 때", "책임 속에서 쉬어 가는 때"], ["규칙을 몸에 익히는 때", "묵묵히 내공을 쌓는 때"]],
  인성: [["배움이 열리는 때", "보호받으며 자라는 때"], ["배움이 깊어지는 때", "내공이 차오르는 때"], ["배운 걸 정리하는 때", "안쪽을 돌보는 때"], ["조용히 채우는 때", "마음 밭을 일구는 때"]],
};

/** 시작 나이 구간별 생활 맥락 */
function ageContext(mid: number): string {
  if (mid < 10) return "가족과 가까운 환경이 세상의 전부였던 어린 시절이라,";
  if (mid < 20) return "배움과 친구 관계, 진로 고민이 중심이 되는 시기라,";
  if (mid < 30) return "첫 사회생활과 독립, 연애를 겪는 시기라,";
  if (mid < 40) return "일과 관계의 기반을 세우는 시기라,";
  if (mid < 50) return "책임이 커지고 방향을 점검하는 시기라,";
  if (mid < 60) return "쌓은 것을 정리하고 다음 막을 준비하는 시기라,";
  if (mid < 70) return "여유와 건강을 챙기며 내 시간을 넓혀 가는 시기라,";
  return "지나온 삶을 돌아보며 마음을 편히 가꾸는 시기라,";
}

function ageBand(start: number, end: number): string {
  const mid = Math.floor((start + end) / 2);
  return mid < 10 ? "어린 시절" : `${Math.floor(mid / 10) * 10}대`;
}

/* ───────── 계산 ───────── */

interface DaeunItem {
  startAge: number;
  endAge: number;
  ganzhi: string;
  stemTenGod?: string;
  branchTenGod?: string;
  "12unsung"?: string;
}

function yongsinElements(r: SajuResult): string[] {
  return [...new Set(r.advanced.yongsin.map((y) => stemEl(y)).filter(Boolean))];
}

function groupOfDaeun(d: DaeunItem): Group {
  return groupOf(d.stemTenGod) ?? groupOf(d.branchTenGod) ?? "비겁";
}

function stageOfDaeun(d: DaeunItem): Stage | null {
  const s = d["12unsung"] as Stage | undefined;
  return s && (STAGES as readonly string[]).includes(s) ? s : null;
}

function natalOf(r: SajuResult, hourUnknown: boolean): Partial<Record<PosKey, string>> {
  const natal: Partial<Record<PosKey, string>> = { year: r.pillars.year, month: r.pillars.month, day: r.pillars.day };
  if (!hourUnknown) natal.hour = r.pillars.hour;
  return natal;
}

/** 종합 에너지 그래프: 십이운성 세기 + 용신 기운이 들어오는지. 0~100 상대 지수(참고용). */
export function buildEnergyChart(r: SajuResult): BookChart | null {
  const list = r.daeun.list as unknown as DaeunItem[];
  if (!list || list.length < 3) return null;
  const yong = yongsinElements(r);
  const cur = r.daeun.current;
  const points: BookChartPoint[] = list.map((d, i) => {
    const st = stageOfDaeun(d);
    const level = st ? STAGE_LEVEL[st] : 50;
    let v = 0.65 * level + 14;
    if (yong.includes(stemEl(d.ganzhi[0]))) v += 8;
    if (yong.includes(branchEl(d.ganzhi[1]))) v += 6;
    return {
      age: d.startAge,
      endAge: d.endAge,
      ganzhi: d.ganzhi,
      value: Math.round(Math.min(95, Math.max(10, v))),
      tag: circ(i),
      ...(cur !== null && d.startAge === cur.startAge ? { current: true } : {}),
    };
  });
  const ranked = points.map((p, i) => ({ p, i })).sort((a, b) => b.p.value - a.p.value || a.i - b.i);
  const first = ranked[0];
  const second = ranked.find((x) => x.p.value >= first.p.value - 25 && Math.abs(x.i - first.i) >= 2);
  points[first.i].peak = 1;
  if (second) points[second.i].peak = 2;
  const range = (p: BookChartPoint) => `${p.tag} ${p.age}~${p.endAge}세 (${ganzhiLabel(p.ganzhi)} 대운)`;
  const callouts = [{ label: "기운이 가장 높이 오르는 시기", text: range(points[first.i]) }];
  if (second) callouts.push({ label: "그다음으로 힘이 실리는 시기", text: range(points[second.i]) });
  const curP = points.find((p) => p.current);
  if (curP) callouts.push({ label: "지금 시기", text: `${range(curP)} · 지수 ${curP.value}` });
  return {
    title: "인생 에너지 그래프",
    caption: "10년 단위 대운마다 십이운성의 세기와 용신 기운이 들어오는지를 합쳐 본 상대 지수야. 높은 때는 힘이 차오르는 시기, 낮은 때는 속도를 낮추고 쌓는 시기이고, 좋고 나쁨이나 일이 일어날 확률이 아니야. 점 아래 번호는 아래 10년 카드의 번호와 같아.",
    points,
    callouts,
    axis: { high: "왕", mid: "쇠", low: "절" },
  };
}

/** 원국 네 기둥의 십이운성 자리별 읽기 */
export function natalStageSections(r: SajuResult, hourUnknown: boolean): BookSection[] {
  const out: BookSection[] = [];
  const keys: PosKey[] = hourUnknown ? ["year", "month", "day"] : ["year", "month", "day", "hour"];
  for (const k of keys) {
    const gz = r.pillars[k];
    const st = stageOf(r.dayStem, gz[1]);
    if (!st) continue;
    const tg = r.tenGods[k];
    const sg = k === "day" ? null : groupOf(tg.stem);
    const bg = groupOf(tg.branch);
    const gods = [sg ? `천간은 ${tg.stem}(${GROUP_TRAIT[sg]})` : k === "day" ? "천간은 나 자신(일간)" : "", bg ? `지지는 ${tg.branch}(${GROUP_TRAIT[bg]})` : ""].filter(Boolean).join(", ");
    out.push({
      heading: `${PILLAR_MEANING[k].title.split(" · ")[0]} ${ganzhiLabel(gz)} · ${st}`,
      body: `${gods ? `${gods}의 색이 깔린 자리야. ` : ""}${AREA[k]}에서는 ${STAGE_NATAL[st]}`,
    });
  }
  return out;
}

/** 번호 붙은 10년 카드 */
export function decadeCards(r: SajuResult, hourUnknown: boolean): BookSection[] {
  const list = r.daeun.list as unknown as DaeunItem[];
  const cur = r.daeun.current;
  const natal = natalOf(r, hourUnknown);
  return list.map((d, i) => {
    const st = stageOfDaeun(d);
    const g = groupOfDaeun(d);
    const isCur = cur !== null && d.startAge === cur.startAge;
    const cls = st ? STAGE_CLASS[st] : 1;
    const nick = NICK[g][cls][i % 2];
    const mid = Math.floor((d.startAge + d.endAge) / 2);
    const prev = i > 0 ? list[i - 1] : null;
    const inter = interactionLine(natal, { label: "대운", ganzhi: d.ganzhi });
    const chain = prev ? chainLine(stemEl(prev.ganzhi[0]), stemEl(d.ganzhi[0])) : "";
    const third = inter ? inter : chain ? `앞 시기에서 넘어올 때는, ${chain}` : "";
    const head = `${circ(i)} ${ageBand(d.startAge, d.endAge)}${isCur ? " (지금)" : ""} · ${nick}`;
    const body = [
      `${d.startAge}~${d.endAge}세, ${ganzhiLabel(d.ganzhi)} 대운${st ? ` · ${st}` : ""}.`,
      `${ageContext(mid)} ${josa(GROUP_TRAIT[g], "이/가")} 주제가 돼. ${st ? STAGE12_TEXT[st] : ""}`.replace(/\s+/g, " ").trim(),
      third,
    ]
      .filter(Boolean)
      .join(" ");
    return { heading: head, body };
  });
}

/** 지금 대운 한가운데에서 바뀌기까지 남은 햇수(대략) */
export function yearsLeft(r: SajuResult): number | null {
  const cur = r.daeun.current;
  const by = r.input.year;
  if (!cur || !by) return null;
  const age = r.currentYear - by + 1;
  const n = cur.endAge + 1 - age;
  return Math.min(10, Math.max(1, n));
}

/** 지금 내 위치: 이름 + 공감 한 문장 */
export function nowPositionSection(r: SajuResult): BookSection | null {
  const cur = r.daeun.current as unknown as DaeunItem | null;
  if (!cur) return null;
  const st = stageOfDaeun(cur);
  if (!st) return null;
  const left = yearsLeft(r);
  const anchor = `지금은 ${cur.startAge}~${cur.endAge}세, ${ganzhiLabel(cur.ganzhi)} 대운 안에 있어.${left ? ` 이 계절이 바뀌기까지는 약 ${left}년 남았어.` : ""}`;
  return { heading: `지금 네 위치는? · ${STAGE_NAME[st]}`, body: `${anchor} ${EMPATHY[st]}` };
}

/** 지금에서 다음으로 이어지는 결(상생 고리) */
export function nextChainSection(r: SajuResult): BookSection | null {
  const list = r.daeun.list as unknown as DaeunItem[];
  const cur = r.daeun.current;
  if (!cur) return null;
  const i = list.findIndex((d) => d.startAge === cur.startAge);
  const nx = i >= 0 ? list[i + 1] : undefined;
  if (!nx) return null;
  const chain = chainLine(stemEl(list[i].ganzhi[0]), stemEl(nx.ganzhi[0]));
  if (!chain) return null;
  return { heading: "지금에서 다음으로 이어지는 결", body: `${nx.startAge}세부터는 ${ganzhiLabel(nx.ganzhi)} 대운으로 넘어가. ${chain}` };
}

/** 행동 지침 2개 + 올해 세운 연결 */
export function actionSection(r: SajuResult): BookSection | null {
  const cur = r.daeun.current as unknown as DaeunItem | null;
  if (!cur) return null;
  const g = groupOfDaeun(cur);
  const sy = r.seyun.find((s) => s.year === r.currentYear);
  const sg = sy ? (groupOf(sy.tenGodStem) ?? groupOf(sy.tenGodBranch)) : null;
  const hook = sy && sg ? `\n\n올해 ${ganzhiLabel(sy.ganzhi)}년은 ${YEAR_HOOK[sg]}` : "";
  const [a, b] = ACTIONS[g];
  return { heading: "지금 시기에 해 볼 행동 두 가지", body: `- ${a}\n- ${b}${hook}` };
}

/** 마무리 한마디 */
export function closingSection(r: SajuResult): BookSection | null {
  const cur = r.daeun.current as unknown as DaeunItem | null;
  const st = cur ? stageOfDaeun(cur) : null;
  if (!st) return null;
  return { heading: "도리의 한마디", body: CLOSING[st] };
}

/** 도리의 용어 사전: 십이운성 12가지 한 줄씩 */
export function stageGlossary(): BookSection {
  return { heading: "도리의 용어 사전", body: STAGES.map((s) => `- **${s}** · ${STAGE12_TEXT[s]}`).join("\n") };
}

/** 대운 부록용: 지금 대운이 나이와 이어지는 한 줄 */
export function ageAnchorLine(r: SajuResult): string {
  const cur = r.daeun.current;
  if (!cur) return "";
  const left = yearsLeft(r);
  return left ? `지금은 ${cur.startAge}~${cur.endAge}세 대운 한가운데이고, 계절이 바뀌기까지는 약 ${left}년 남았어.` : "";
}

/** 대운 부록용: 지금 → 다음 상생 한 줄 */
export function nextChainLine(r: SajuResult): string {
  return nextChainSection(r)?.body.replace(/^.*?넘어가\.\s*/, "") ?? "";
}
