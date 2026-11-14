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

/** 한 줄 그림: 천간 오행 × 지지 오행 */
const SCENE: Record<string, Record<string, string>> = {
  목: { 목: "푸른 숲이 빽빽이 우거진 형국", 화: "나무가 불을 만나 환하게 타오르는 형국", 토: "나무가 기름진 흙에 뿌리를 내리는 형국", 금: "나무가 날 선 도끼 앞에서 단단히 다듬어지는 형국", 수: "나무가 맑은 물을 한껏 빨아올리는 형국" },
  화: { 목: "장작 위로 불꽃이 활짝 피어오르는 형국", 화: "한낮의 태양이 이글이글 타오르는 형국", 토: "화로 위에서 흙이 따뜻하게 익어 가는 형국", 금: "용광로에서 쇠가 붉게 달궈지는 형국", 수: "찬 물가 위로 등불이 은은하게 비치는 형국" },
  토: { 목: "넓은 땅 위에서 새싹이 힘차게 올라오는 형국", 화: "따뜻한 햇볕을 머금은 옥토가 열매를 키우는 형국", 토: "거대한 산이 묵직하게 자리를 잡은 형국", 금: "땅속에서 단단한 보석이 영그는 형국", 수: "둑이 깊은 물을 품어 고요한 호수를 만드는 형국" },
  금: { 목: "날 선 도끼가 큰 나무를 다듬는 형국", 화: "불길 속에서 쇠가 단련되어 명검이 되는 형국", 토: "흙 속에서 황금이 모습을 드러내는 형국", 금: "서리 내린 가을 들판에 쇠붙이가 반짝이는 형국", 수: "맑은 샘물 위로 쇠가 은빛으로 빛나는 형국" },
  수: { 목: "물이 새로 돋은 나무를 키워 올리는 형국", 화: "물과 불이 맞부딪쳐 수증기를 피워 올리는 형국", 토: "물이 흙을 만나 잠시 고이며 길을 찾는 형국", 금: "샘이 바위틈에서 맑게 솟아나는 형국", 수: "깊은 바다 위로 물결이 끝없이 이어지는 형국" },
};

type Tense = "past" | "now" | "future";

/** 지난 시기: 열어 두고 말하는 구체적인 이야기(그랬을 수 있어) */
const PAST_DESC: Record<Group, string> = {
  비겁: "내 방식과 주관이 또렷해서 남의 뜻에 맞추기보다 스스로 해 보려는 마음이 컸을 수 있어. 친구나 경쟁 상대와 부딪히며 ‘나는 누구지’를 배운 기억이 있다면 이 기운 때문일 수 있어.",
  식상: "하고 싶은 말과 끼가 안에서 꿈틀대서 이것저것 해 보고 싶은 마음이 컸을 수 있어. 규칙이나 정해진 틀보다 호기심이 앞서 어른들과 부딪힌 기억이 있다면 이 기운 때문일 수 있어.",
  재성: "돈과 현실, 눈에 보이는 결과에 눈을 뜨기 시작했을 수 있어. 일과 소비에서 시행착오를 겪으며 ‘세상은 이렇게 돌아가는구나’를 배운 기억이 있다면 이 기운 때문일 수 있어.",
  관성: "해야 할 일과 책임, 사회의 시선이 어깨에 얹히는 느낌이 있었을 수 있어. 눈치를 보거나 버텨야 했던 순간이 있었다면 이 기운 때문일 수 있어.",
  인성: "배우고 보호받는 흐름이 중심이라, 안쪽에서 생각이 깊어지고 혼자 곱씹는 시간이 많았을 수 있어. 공부나 사람에게서 힘을 얻은 기억이 있다면 이 기운 때문일 수 있어.",
};
const PAST_TILT: Record<0 | 1 | 2 | 3, string> = {
  0: "이 시기에는 새로 시작하고 자라는 느낌이 컸을 수 있어.",
  1: "힘이 한창 차올라서 마음먹은 만큼 밀고 나가던 때였을 수 있어.",
  2: "속도가 더디게 느껴지고 한 템포 쉬어 가야 했던 때였을 수 있어.",
  3: "겉으로 드러나기보다 안으로 쌓고 준비하던 시간이 길었을 수 있어.",
};
/** 지난 시기 마무리: 의지를 칭찬하는 문장(맞든 달랐든 똑같이 읽혀요) */
const PAST_PRAISE: Record<Group, string> = {
  비겁: "혹시 이야기가 네 기억과 달랐어도 괜찮아. 사주가 준 재료보다 네가 의지로 더 좋게 만들어 온 시간이었고, 그때 지킨 주관이 지금 네 중심이 됐어.",
  식상: "혹시 이야기가 네 기억과 달랐어도 괜찮아. 사주가 준 재료보다 네가 의지로 더 좋게 키워 온 시간이었고, 그때 꺼내 본 시도들이 지금 네 재능의 바탕이 됐어.",
  재성: "혹시 이야기가 네 기억과 달랐어도 괜찮아. 사주가 준 재료보다 네가 노력으로 더 단단하게 만들어 온 시간이었고, 그때의 시행착오가 지금 네 현실 감각이 됐어.",
  관성: "혹시 이야기가 네 기억과 달랐어도 괜찮아. 사주가 준 재료보다 네가 의지로 더 잘 버텨 낸 시간이었고, 그때 쌓은 책임감이 지금 네 신뢰가 됐어.",
  인성: "혹시 이야기가 네 기억과 달랐어도 괜찮아. 사주가 준 재료보다 네가 스스로 더 깊이 채워 온 시간이었고, 그때 쌓은 내공이 지금 네 깊이가 됐어.",
};

/** 지금 시기 */
const NOW_DESC: Record<Group, string> = {
  비겁: "나 자신과 내 사람들의 기운이 강해지는 때라, 주관을 또렷하게 세우고 내 길을 내 방식으로 열기 좋아. 다만 비교와 경쟁 앞에서는 여유를 가지면 더 멀리 가.",
  식상: "표현하고 만들어 내는 힘이 커지는 때라, 꺼내 놓은 아이디어와 재능이 결과로 이어지기 쉬워. 완벽해지기를 기다리기보다 작게 먼저 보여 줘 봐.",
  재성: "현실적인 결과와 실속이 눈에 들어오는 때라, 쌓아 온 것이 손에 잡히는 성과로 바뀌기 좋아. 한 번에 크게 노리기보다 판을 차근차근 키워 가면 좋아.",
  관성: "책임과 기회가 함께 오는 때라, 맡은 역할을 잘 해내면 인정받기 좋아. 다 짊어지기보다 우선순위를 정하고 쉬는 시간도 지켜 줘.",
  인성: "배우고 정리하며 힘을 채우는 때라, 겉으로 큰 변화가 없어 보여도 안쪽이 단단해지고 있어. 배운 것을 한 줄씩 남겨 두면 곧 쓸모가 보여.",
};
const NOW_PUSH = "지금까지 해 온 걸 보면, 이 시기의 문도 네가 움직일 때 열려. 너라면 충분히 해낼 수 있어.";

/** 다가오는 시기: 희망과 의지를 북돋는 방향 제시 */
const FUTURE_DESC: Record<Group, string> = {
  비겁: "나의 기운이 커지는 때가 오니, 내 이름으로 해 보고 싶은 일을 당당히 정해 볼 만해. 함께할 사람을 고르고 내 몫을 분명히 하면 힘이 두 배가 돼.",
  식상: "표현하고 만드는 힘이 커지는 때가 오니, 지금부터 재능과 아이디어를 조금씩 꺼내 연습해 두면 좋아. 그때 꺼낸 것들이 너를 알리는 이야기가 돼.",
  재성: "현실의 열매가 눈에 들어오는 때가 오니, 지금부터 기반을 다지고 판을 준비해 두면 좋아. 쌓아 둔 것이 실속으로 바뀌는 계절이야.",
  관성: "역할과 인정이 따라오는 때가 오니, 지금부터 실력과 신뢰를 한 칸씩 쌓아 두면 좋아. 책임이 커질수록 쉬는 법도 같이 챙겨 줘.",
  인성: "배움과 보살핌이 힘이 되는 때가 오니, 하고 싶은 공부나 관심사를 천천히 준비해 두면 좋아. 안쪽이 깊어진 만큼 더 멀리 보여.",
};
const FUTURE_PUSH: Record<Group, string> = {
  비겁: "기운은 판을 깔아 줄 뿐이고, 걷는 건 늘 네 몫이야. 너라면 할 수 있어.",
  식상: "기운은 무대를 만들어 줄 뿐이고, 올라가는 건 네 의지야. 너라면 할 수 있어.",
  재성: "기운은 길을 열어 줄 뿐이고, 걸어가 열매를 따는 건 네 노력이야. 너라면 할 수 있어.",
  관성: "기운은 기회를 건네 줄 뿐이고, 잡아서 해내는 건 네 의지야. 너라면 할 수 있어.",
  인성: "기운은 씨앗을 건네 줄 뿐이고, 키워 내는 건 네 꾸준함이야. 너라면 할 수 있어.",
};

/** 번호 붙은 10년 카드 */
export function decadeCards(r: SajuResult, hourUnknown: boolean): BookSection[] {
  const list = r.daeun.list as unknown as DaeunItem[];
  const cur = r.daeun.current;
  const curIdx = cur ? list.findIndex((d) => d.startAge === cur.startAge) : -1;
  const natal = natalOf(r, hourUnknown);
  return list.map((d, i) => {
    const st = stageOfDaeun(d);
    const g = groupOfDaeun(d);
    const tense: Tense = curIdx < 0 ? "future" : i < curIdx ? "past" : i === curIdx ? "now" : "future";
    const isCur = tense === "now";
    const cls = st ? STAGE_CLASS[st] : 1;
    const nick = NICK[g][cls][i % 2];
    const mid = Math.floor((d.startAge + d.endAge) / 2);
    const prev = i > 0 ? list[i - 1] : null;
    const inter = interactionLine(natal, { label: "대운", ganzhi: d.ganzhi });
    const chain = prev ? chainLine(stemEl(prev.ganzhi[0]), stemEl(d.ganzhi[0])) : "";
    const link = inter ? inter : chain ? `앞 시기에서 넘어올 때는, ${chain}` : "";
    const evidence = `천간 ${d.stemTenGod ?? "-"}·지지 ${d.branchTenGod ?? "-"}${st ? `, 십이운성 ${st}` : ""}`;
    const scene = SCENE[stemEl(d.ganzhi[0])]?.[branchEl(d.ganzhi[1])] ?? "";
    const left = isCur ? yearsLeft(r) : null;
    const nowAge = r.input.year ? r.currentYear - r.input.year + 1 : null;
    const head = `${circ(i)} ${ageBand(d.startAge, d.endAge)}${isCur ? " (지금)" : ""} · ${nick}`;
    const intro = `${d.startAge}~${d.endAge}세, ${ganzhiLabel(d.ganzhi)} 대운${st ? ` · ${st}` : ""}. (${evidence}) ${st ? STAGE12_TEXT[st] : ""}`.replace(/\s+/g, " ").trim();
    const child = tense === "past" && d.endAge < 20 ? "어린 시절은 환경의 영향이 커서 네 탓이 아니야. " : "";
    let main = "";
    let close = "";
    if (tense === "past") {
      main = `${child}${ageContext(mid)} ${PAST_DESC[g]} ${st ? PAST_TILT[cls] : ""} ${link}`;
      close = PAST_PRAISE[g];
    } else if (tense === "now") {
      const anchor = nowAge ? `지금 네 나이는 ${nowAge}세 무렵이고, 이 계절의 한복판이야.${left ? ` 바뀌기까지 약 ${left}년 남았어.` : ""} ` : "";
      main = `${anchor}${NOW_DESC[g]} ${link}`;
      close = NOW_PUSH;
    } else {
      main = `${ageContext(mid)} ${FUTURE_DESC[g]} ${link}`;
      close = FUTURE_PUSH[g];
    }
    const paras = [scene ? `**“${scene}”**` : "", `${intro} ${main}`.replace(/\s+/g, " ").trim(), close].filter(Boolean);
    return { heading: head, body: paras.join("\n\n"), mbti: { group: g, tense } };
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

/** 지금 대운 단계의 이름(예: "숨을 고르며 단단해지는 시기") */
export function nowStageName(r: SajuResult): string | null {
  const cur = r.daeun.current as unknown as DaeunItem | null;
  const st = cur ? stageOfDaeun(cur) : null;
  return st ? STAGE_NAME[st] : null;
}

/** 지금 대운의 주제(예: "표현력과 아이디어") */
export function nowDaeunTrait(r: SajuResult): string | null {
  const cur = r.daeun.current as unknown as DaeunItem | null;
  return cur ? GROUP_TRAIT[groupOfDaeun(cur)] : null;
}
