import type { SajuResult } from "ssaju";
import { branchRelation } from "@/lib/ai/dailyFacts";
import type { BookSection } from "../types";
import type { PosKey } from "./insight";

/*
 * 제5장 맨 위 "내 신살 조합 한 쌍" 카드. 전통 표(삼합·일간 기준)로 직접 계산해서 엔진 이름에 기대지 않아요. 같은 입력이면 같은 결과, AI 없음.
 * 조합이 있으면 그 한 쌍, 없으면 가장 눈에 띄는 단독 신살, 아무것도 없으면 "담백한 구조" 카드예요.
 * 겁주지 않고 "잘 쓸 때 / 과할 때 / 쓰는 법"으로 말해요. 재미로 보는 참고예요.
 * (표 내용은 재홍님 검토 문서 "신살-조합-표-초안" 기준)
 */

export type Sal =
  | "홍염" | "귀문" | "백호" | "괴강" | "천을" | "화개" | "문창" | "도화" | "역마" | "양인" | "겁살" | "원진" | "월덕" | "천덕";

/** 화면에 쓰는 이름 + 한자 풀이 */
export const SAL_NAME: Record<Sal, { name: string; gloss: string }> = {
  홍염: { name: "홍염살", gloss: "紅艶殺 · 붉을 홍, 고울 염" },
  귀문: { name: "귀문관살", gloss: "鬼門關殺 · 귀신 귀, 문 문, 빗장 관" },
  백호: { name: "백호살", gloss: "白虎殺 · 흰 백, 범 호" },
  괴강: { name: "괴강살", gloss: "魁罡殺 · 으뜸 괴, 별 이름 강" },
  천을: { name: "천을귀인", gloss: "天乙貴人 · 하늘 천, 새 을, 귀할 귀" },
  화개: { name: "화개살", gloss: "華蓋殺 · 빛날 화, 덮을 개" },
  문창: { name: "문창귀인", gloss: "文昌貴人 · 글월 문, 창성할 창" },
  도화: { name: "도화살", gloss: "桃花殺 · 복숭아 도, 꽃 화" },
  역마: { name: "역마살", gloss: "驛馬殺 · 역참 역, 말 마" },
  양인: { name: "양인살", gloss: "羊刃殺 · 양 양, 칼날 인" },
  겁살: { name: "겁살", gloss: "劫殺 · 위협할 겁" },
  원진: { name: "원진살", gloss: "怨嗔殺 · 원망할 원, 성낼 진" },
  월덕: { name: "월덕귀인", gloss: "月德貴人 · 달 월, 덕 덕" },
  천덕: { name: "천덕귀인", gloss: "天德貴人 · 하늘 천, 덕 덕" },
};

const POS: PosKey[] = ["year", "month", "day", "hour"];
const POS_NAME: Record<PosKey, string> = { year: "연주", month: "월주", day: "일주", hour: "시주" };
const POS_SCENE: Record<PosKey, string> = {
  year: "어린 시절과 바깥 인간관계",
  month: "일터와 사회생활",
  day: "나 자신과 가까운 사이",
  hour: "말년과 마음속 꿈",
};

const GROUPS: string[][] = [["申", "子", "辰"], ["寅", "午", "戌"], ["巳", "酉", "丑"], ["亥", "卯", "未"]];
const groupIdx = (b: string) => GROUPS.findIndex((g) => g.includes(b));
// 삼합 그룹(申子辰·寅午戌·巳酉丑·亥卯未) 순서대로
const DOHWA = ["酉", "卯", "午", "子"];
const YEOKMA = ["寅", "申", "亥", "巳"];
const HWAGAE = ["辰", "戌", "丑", "未"];
const GEOP = ["巳", "亥", "寅", "申"];
const YANGIN: Record<string, string> = { 甲: "卯", 丙: "午", 戊: "午", 庚: "酉", 壬: "子" };
const HONGYEOM: Record<string, string> = { 甲: "午", 乙: "午", 丙: "寅", 丁: "未", 戊: "辰", 己: "辰", 庚: "戌", 辛: "酉", 壬: "子", 癸: "申" };
const MUNCHANG: Record<string, string> = { 甲: "巳", 乙: "午", 丙: "申", 丁: "酉", 戊: "申", 己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯" };
const GWIMUN = ["子酉", "丑午", "寅未", "卯申", "辰亥", "巳戌"];
const WONJIN = ["子未", "丑午", "寅酉", "卯申", "辰亥", "巳戌"];
const BAEKHO = ["甲辰", "乙未", "丙戌", "丁丑", "戊辰", "壬戌", "癸丑"];
const GOEGANG = ["庚辰", "庚戌", "壬辰", "戊戌"];
const CHEONEUL: Record<string, string[]> = { 甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"], 乙: ["子", "申"], 己: ["子", "申"], 丙: ["亥", "酉"], 丁: ["亥", "酉"], 壬: ["巳", "卯"], 癸: ["巳", "卯"], 辛: ["寅", "午"] };
// 월지의 삼합 그룹 → 월덕 천간 (申子辰→壬, 寅午戌→丙, 巳酉丑→庚, 亥卯未→甲)
const WOLDEOK = ["壬", "丙", "庚", "甲"];
const CHEONDEOK: Record<string, string> = { 寅: "丁", 卯: "申", 辰: "壬", 巳: "辛", 午: "亥", 未: "甲", 申: "癸", 酉: "寅", 戌: "丙", 亥: "乙", 子: "巳", 丑: "庚" };

export type Found = Map<Sal, PosKey[]>;

function add(f: Found, s: Sal, p: PosKey[]) {
  const cur = f.get(s) ?? [];
  for (const x of p) if (!cur.includes(x)) cur.push(x);
  f.set(s, cur);
}

/** 원국(연·월·일·시)에서 신살을 찾아요. 시간을 모르면 시주는 보지 않아요. */
export function findSals(r: Pick<SajuResult, "pillars" | "dayStem">, hourUnknown: boolean): Found {
  const f: Found = new Map();
  const ps = POS.filter((p) => !(p === "hour" && hourUnknown)).map((p) => ({ p, gz: r.pillars[p] as string }));
  const dayStem = r.dayStem;
  const branchOf = (x: { gz: string }) => x.gz[1];
  const stemOf = (x: { gz: string }) => x.gz[0];

  for (const base of ps.filter((x) => x.p === "year" || x.p === "day")) {
    const g = groupIdx(branchOf(base));
    if (g < 0) continue;
    for (const [sal, table] of [["도화", DOHWA], ["역마", YEOKMA], ["화개", HWAGAE], ["겁살", GEOP]] as const) {
      const hit = ps.filter((x) => x.p !== base.p && branchOf(x) === table[g]).map((x) => x.p);
      if (hit.length) add(f, sal, hit);
    }
  }
  const yin = YANGIN[dayStem];
  if (yin) { const h = ps.filter((x) => branchOf(x) === yin).map((x) => x.p); if (h.length) add(f, "양인", h); }
  const hong = HONGYEOM[dayStem];
  if (hong) { const h = ps.filter((x) => branchOf(x) === hong).map((x) => x.p); if (h.length) add(f, "홍염", h); }
  const mun = MUNCHANG[dayStem];
  if (mun) { const h = ps.filter((x) => branchOf(x) === mun).map((x) => x.p); if (h.length) add(f, "문창", h); }
  const ce = CHEONEUL[dayStem] ?? [];
  { const h = ps.filter((x) => ce.includes(branchOf(x))).map((x) => x.p); if (h.length) add(f, "천을", h); }
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const a = branchOf(ps[i]);
      const b = branchOf(ps[j]);
      if (GWIMUN.some((t) => (t[0] === a && t[1] === b) || (t[0] === b && t[1] === a))) add(f, "귀문", [ps[i].p, ps[j].p]);
      if (WONJIN.some((t) => (t[0] === a && t[1] === b) || (t[0] === b && t[1] === a))) add(f, "원진", [ps[i].p, ps[j].p]);
    }
  }
  const bh = ps.filter((x) => BAEKHO.includes(x.gz)).map((x) => x.p); if (bh.length) add(f, "백호", bh);
  const gg = ps.filter((x) => GOEGANG.includes(x.gz)).map((x) => x.p); if (gg.length) add(f, "괴강", gg);
  const month = ps.find((x) => x.p === "month");
  if (month) {
    const g = groupIdx(branchOf(month));
    if (g >= 0) { const h = ps.filter((x) => x.p !== "month" && stemOf(x) === WOLDEOK[g]).map((x) => x.p); if (h.length) add(f, "월덕", h); }
    const cd = CHEONDEOK[branchOf(month)];
    if (cd) { const h = ps.filter((x) => x.p !== "month" && (stemOf(x) === cd || branchOf(x) === cd)).map((x) => x.p); if (h.length) add(f, "천덕", h); }
  }
  return f;
}

interface Card { title: string; story: string; good: string; over: string; use: string }

/** 조합 표: 더 드문 조합이 위에 있어요. 두 번째 칸이 배열이면 그중 하나만 있어도 돼요. */
export const COMBOS: Array<{ a: Sal; b: Sal | Sal[] } & Card> = [
  { a: "홍염", b: "귀문", title: "향기 나는 레이더", story: "호감을 끄는 분위기(홍염)와 번뜩이는 직감(귀문)의 조합이야. 사람을 편하게 하면서 속은 정확히 읽는 사람이야.", good: "협상·서비스·기획에서 센스 있는 힘", over: "남의 표정을 너무 읽어서 피곤해지기 쉬워", use: "‘저 사람 사정이겠지’ 하고 가볍게 넘기는 연습을 해 봐" },
  { a: "백호", b: "괴강", title: "강단 있는 사람", story: "두 기운이 함께 있으면 승부처에서 물러서지 않는 강단이 있어. 평소엔 조용해도 필요할 땐 단단해지는 사람이야.", good: "위기 대응과 리더 자리에서 믿음직한 힘", over: "고집으로 보이기 쉬워", use: "결정은 단호하게, 말투는 한 톤만 부드럽게 해 봐" },
  { a: "천을", b: "화개", title: "배움이 귀인을 부르는 사람", story: "도움의 손길(천을귀인)에 학문·예술 몰입(화개)이 더해졌어. 깊이 파고들수록 좋은 스승이나 기회가 따라와.", good: "공부·전문 분야에서 인정받는 힘", over: "혼자만의 세계에 오래 머물기 쉬워", use: "배운 걸 한 번씩 사람들에게 나눠 봐" },
  { a: "문창", b: "화개", title: "글과 생각으로 빛나는 사람", story: "총명함(문창)과 몰입(화개)의 조합이야. 쓰고 만들고 정리하는 일에 힘이 붙어.", good: "글쓰기·연구·기획에서 강점", over: "완벽주의로 마감이 늦어지기 쉬워", use: "80점이면 일단 공개해 봐" },
  { a: "도화", b: "화개", title: "반짝이는 사람, 깊은 사람", story: "사람을 끄는 매력과 혼자 깊이 파고드는 힘이 같이 있어. 분위기를 살리다가도 혼자 있는 시간이 꼭 필요한 사람이야.", good: "매력 있는 기획자·창작자로 빛나는 힘", over: "사람 속에서 기운이 방전되기 쉬워", use: "사람을 만난 날엔 혼자 충전하는 30분을 일정에 넣어 봐" },
  { a: "도화", b: "역마", title: "가는 곳마다 인연", story: "매력에 이동이 붙었어. 새로운 환경에서 오히려 빛나고 인연이 넓어져.", good: "넓은 네트워크, 변화가 많은 일에 강한 힘", over: "관계가 얕게 퍼지기 쉬워", use: "새 인연 셋 중 하나는 꾸준히 이어 갈 사람으로 정해 봐" },
  { a: "역마", b: "화개", title: "떠나는 구도자", story: "움직이고 싶은 마음과 깊이 몰입하고 싶은 마음이 번갈아 와. 이동 중에 생각이 정리되는 사람이야.", good: "배움·창작을 위한 이동에서 큰 성과", over: "시작은 많은데 마무리가 흐려지기 쉬워", use: "떠나기 전에 ‘돌아와서 정리할 한 가지’를 정해 봐" },
  { a: "천을", b: "도화", title: "어려울 땐 누군가 나타나는 사람", story: "도움의 손길에 호감이 더해졌어. 사람 덕이 눈에 띄는 구조야.", good: "부탁하고 도움받는 힘", over: "도움에 기대는 습관이 생기기 쉬워", use: "도움받은 만큼 작은 보답을 습관으로 해 봐" },
  { a: "천을", b: ["월덕", "천덕"], title: "든든한 뒷배가 겹쳤어", story: "귀인 계열이 겹치면 큰 어려움을 부드럽게 넘기게 돕는 구조야.", good: "위기 때 방향을 잡아 주는 사람이나 기회가 나타나는 힘", over: "안심해서 준비를 미루기 쉬워", use: "준비는 내 몫, 귀인은 보너스라고 생각해 봐" },
  { a: "양인", b: "겁살", title: "브레이크 달린 추진력", story: "승부욕(양인)에 결단(겁살)이 겹쳐서 밀어붙이는 힘이 강해.", good: "결단이 빠르고 성과를 내는 힘", over: "충돌하거나 서두르기 쉬워", use: "큰 결정은 하룻밤 두었다가 확정해 봐" },
  { a: "귀문", b: "화개", title: "촉이 좋은 몽상가", story: "예민한 직감과 몰입이 만났어. 남이 놓치는 걸 포착하는 눈이 있어.", good: "기획·연구·창작에서 강점", over: "생각이 많아져서 지치기 쉬워", use: "생각이 길어지면 15분 걸으며 환기해 봐" },
  { a: "원진", b: "도화", title: "가까울수록 신경 쓰이는 사람", story: "가까운 사이에서 서운함이 남기 쉬운 기운(원진)에 매력(도화)이 얹혔어. 관계가 깊어지는 만큼 마음의 결도 예민해져.", good: "깊은 관계에서 진심을 나누는 힘", over: "작은 말에 오래 마음이 남기 쉬워", use: "서운한 건 ‘그때 이랬어서 서운했어’로 짧게 말해 봐" },
];

/** 조합이 없을 때: 가장 눈에 띄는 단독 신살(위에서부터) */
export const SINGLES: Array<{ s: Sal } & Card> = [
  { s: "백호", title: "단단한 한 방", story: "물러서지 않는 강단이 있는 기운이야.", good: "승부처에서 믿음직한 힘", over: "고집으로 보이기 쉬워", use: "결정은 단호하게, 말투는 부드럽게 해 봐" },
  { s: "괴강", title: "존재감 있는 사람", story: "한 번 마음먹으면 끝까지 가는 기운이야.", good: "리더 자리에서 중심을 잡는 힘", over: "혼자 다 끌고 가려 하기 쉬워", use: "맡길 수 있는 일 하나는 일부러 넘겨 봐" },
  { s: "양인", title: "브레이크 달린 추진력", story: "승부욕과 추진력이 또렷한 기운이야.", good: "밀고 나가는 추진력", over: "충돌하기 쉬워", use: "말하기 전에 한 박자만 늦춰 봐" },
  { s: "겁살", title: "결단의 순발력", story: "결단과 승부의 에너지가 있는 기운이야.", good: "위기 때 빠른 결단", over: "충동적으로 정하기 쉬워", use: "큰 결정은 하루 묵혔다가 해 봐" },
  { s: "귀문", title: "촉이 좋은 사람", story: "직감이 예민하게 반응하는 기운이야.", good: "남이 놓치는 걸 포착하는 힘", over: "잡생각이 많아지기 쉬워", use: "생각이 길어지면 몸을 움직여 환기해 봐" },
  { s: "원진", title: "마음의 결이 섬세한 사람", story: "가까운 사이에서 마음이 예민하게 움직이는 기운이야.", good: "깊은 관계에서 진심을 나누는 힘", over: "서운함이 오래 남기 쉬워", use: "서운한 건 짧게 말로 꺼내 봐" },
  { s: "홍염", title: "은근히 끌리는 사람", story: "꾸미지 않아도 호감을 끄는 분위기의 기운이야.", good: "첫인상과 대인관계에서 센스 있는 힘", over: "관심이 몰려 피곤해지기 쉬워", use: "만남 뒤엔 혼자 쉬는 시간을 챙겨 봐" },
  { s: "문창", title: "총명한 기록자", story: "글과 생각을 정리하는 데 힘이 붙는 기운이야.", good: "배우고 정리하는 힘", over: "완벽하게 하려다 늦어지기 쉬워", use: "80점이면 일단 공개해 봐" },
  { s: "천덕", title: "부드러운 보호막", story: "큰 어려움을 부드럽게 넘기게 돕는 기운이야.", good: "위기를 덜 힘들게 지나가는 힘", over: "준비를 미루기 쉬워", use: "준비는 내 몫이라고 생각해 봐" },
  { s: "월덕", title: "베풀면 돌아오는 복", story: "덕을 쌓을수록 복이 돌아오는 기운이야.", good: "베푼 마음이 인연으로 돌아오는 힘", over: "베풀고 지치기 쉬워", use: "내가 지치지 않는 만큼만 베풀어 봐" },
  { s: "천을", title: "위기에 나타나는 손", story: "어려울 때 도움을 만나기 쉬운 기운이야.", good: "도움을 청하고 받는 힘", over: "혼자 끙끙 앓다 때를 놓치기 쉬워", use: "힘들 때 먼저 한 사람에게 말해 봐" },
  { s: "역마", title: "움직일수록 힘나는 사람", story: "이동과 변화에서 활력을 얻는 기운이야.", good: "변화에 강한 힘", over: "한곳에 정착하기 어려울 수 있어", use: "쉬어 갈 나만의 거점을 하나 만들어 봐" },
  { s: "화개", title: "깊이 파고드는 사람", story: "혼자 몰입하는 시간에서 힘을 얻는 기운이야.", good: "깊은 몰입과 영감", over: "혼자만의 세계에 갇히기 쉬워", use: "일주일에 한 번은 사람을 만나 봐" },
  { s: "도화", title: "자연스레 끌리는 사람", story: "사람을 끄는 매력과 분위기를 가진 기운이야.", good: "호감과 인기를 얻는 힘", over: "마음이 쉽게 소모되기 쉬워", use: "만남 뒤에는 충전 시간을 가져 봐" },
];

const TAIL = "⟦MBTI⟧은(는) 이 기운을 일상에서 꺼내 쓰는 데 잘 어울려.";

export function sceneLine(f: Found, pair: Sal[]): string {
  const parts = pair.map((s) => ({ s, p: f.get(s)?.[0] })).filter((x): x is { s: Sal; p: PosKey } => !!x.p);
  if (parts.length === 0) return "";
  const where = parts.map((x) => `${SAL_NAME[x.s].name}은(는) ${POS_NAME[x.p]}`).join(", ");
  const scenes = Array.from(new Set(parts.map((x) => POS_SCENE[x.p]))).join("과 ");
  return `${where}에 있어서, ${scenes}에서 이 기운이 특히 잘 드러나.`.replace(/([가-힣])은\(는\)/g, (_m, c: string) => ((c.charCodeAt(0) - 0xac00) % 28 ? `${c}은` : `${c}는`));
}

/** 올해 세운·지금 대운의 지지가 이 기운이 있는 자리 지지와 합·충이면 "깨어나는 때" 한 줄 */
export function timingLine(r: Pick<SajuResult, "pillars" | "seyun" | "daeun" | "currentYear">, f: Found, pair: Sal[]): string {
  const sy = r.seyun?.find((x) => x.year === r.currentYear)?.ganzhi;
  const dy = r.daeun?.current?.ganzhi;
  const spots = pair.flatMap((s) => f.get(s) ?? []);
  for (const [label, gz] of [["올해", sy], ["지금 대운", dy]] as const) {
    if (!gz) continue;
    for (const p of spots) {
      const rel = branchRelation(gz[1], (r.pillars[p] as string)[1]);
      if (rel === "합") return `${label}(${gz})는 네 ${POS_NAME[p]}와 합이 되어서 이 기운이 편안하게 깨어나는 때야. 일부러 한 번 써 보기 좋아.`;
      if (rel === "충") return `${label}(${gz})는 네 ${POS_NAME[p]}를 흔들어 줘서 이 기운이 깨어나기 쉬운 때야. 서두르지 말고 한 가지에만 써 봐.`;
    }
  }
  return "올해는 이 기운이 잔잔한 편이야. 크게 쓰기보다 천천히 다듬어 가기 좋아.";
}

const josaEun = (w: string) => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? `${w}은` : `${w}는`);

export interface PickedCard { pair: Sal[]; card: Card; kind: "combo" | "single" | "none" }

export function pickCard(f: Found): PickedCard {
  for (const c of COMBOS) {
    const bs = Array.isArray(c.b) ? c.b : [c.b];
    const b = bs.find((x) => f.has(x));
    if (f.has(c.a) && b) return { pair: [c.a, b], card: c, kind: "combo" };
  }
  for (const s of SINGLES) if (f.has(s.s)) return { pair: [s.s], card: s, kind: "single" };
  return {
    pair: [],
    kind: "none",
    card: { title: "담백한 구조", story: "두드러진 신살이 없다는 건 특정 기운에 휘둘리지 않는다는 뜻이야. 운이 한쪽으로 쏠리지 않아서, 대운과 세운의 흐름을 더 잘 타는 사람이야.", good: "흐름에 맞춰 유연하게 움직이는 힘", over: "뚜렷한 색이 없다고 느끼기 쉬워", use: "좋아하는 것 한 가지를 일부러 꾸준히 이어 봐" },
  };
}

/** 제5장 맨 위 카드. 화면은 sinsalCard 가 있으면 "카드를 눌러 확인" 모양으로 보여 줘요. */
export function buildSinsalCard(r: Pick<SajuResult, "pillars" | "dayStem" | "seyun" | "daeun" | "currentYear">, hourUnknown: boolean): BookSection {
  const f = findSals(r, hourUnknown);
  const { pair, card, kind } = pickCard(f);
  const names = pair.map((s) => SAL_NAME[s]);
  const rest = Array.from(f.keys()).filter((s) => !pair.includes(s)).slice(0, 3).map((s) => SAL_NAME[s].name);
  const lines: string[] = [];
  if (names.length) lines.push(names.map((n) => `${n.name}(${n.gloss})`).join(" · "));
  lines.push(`**“${card.title}”**`);
  lines.push(card.story);
  lines.push(`- 잘 쓸 때: ${card.good}\n- 과할 때: ${card.over}\n- 쓰는 법: ${card.use}`);
  if (kind !== "none") {
    const scene = sceneLine(f, pair);
    if (scene) lines.push(scene);
    lines.push(timingLine(r, f, pair));
    lines.push(TAIL);
  } else {
    lines.push(TAIL);
  }
  lines.push(`**이번 주 미션** · ${card.use.replace(/ 봐$/, " 보기").replace(/해 봐$/, "하기")}`);
  if (rest.length) lines.push(`그 밖에 ${rest.join(", ")}도 함께 있어. 아래 풀이에서 하나씩 볼 수 있어.`);
  const heading = names.length ? `내 신살 조합 · ${names.map((n) => n.name).join(" + ")}` : "내 신살 한 장";
  const share = `${names.length ? names.map((n) => n.name).join(" + ") : "신살"} · “${card.title}” — ${card.story.split(/(?<=[.!?])\s/)[0]}`;
  return { heading, body: lines.join("\n\n"), sinsalCard: { title: card.title, share } };
}

void josaEun;
