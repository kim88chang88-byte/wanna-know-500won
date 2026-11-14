import type { SajuResult } from "ssaju";
import { STEMS } from "@/lib/saju/constants";
import { groupOf } from "../topic";
import type { BookChart, BookSection, BookTable, ElementView, WealthProfile } from "../types";
import { ELEMENT_HABIT } from "./dict";
import { hiddenGods, hiddenSummary, type PosKey } from "./insight";

/*
 * 재물운 장의 "돈 팔자 유형"과 "돈그릇". 모두 코드로만 계산해요(AI 호출 없음, 같은 입력이면 같은 결과).
 * - 유형: 안정·공격 / 실물·감각 / 분석·직감 / 계획·즉흥 네 축에서 한쪽씩 골라 4글자 코드와 이름을 붙여요.
 * - 돈그릇: 평생 재물 기운(대운별 지수의 평균)은 그릇의 크기, 지금 대운의 지수는 물이 찬 높이예요.
 * 재미로 읽는 성향 풀이이고, 특정 상품이나 종목을 권하거나 결과를 장담하지 않아요.
 */

const STABLE = ["정재", "정관", "정인", "식신", "비견"];
const WILD = ["편재", "편관", "편인", "상관", "겁재"];

const AXES = [
  { a: { letter: "S", label: "안정" }, b: { letter: "A", label: "공격" } },
  { a: { letter: "R", label: "실물" }, b: { letter: "I", label: "감각" } },
  { a: { letter: "L", label: "분석" }, b: { letter: "G", label: "직감" } },
  { a: { letter: "P", label: "계획" }, b: { letter: "F", label: "즉흥" } },
] as const;

const NOUN: Record<string, string> = { SR: "곳간지기", SI: "알짜 살림꾼", AR: "개척하는 거상", AI: "감각 장사꾼" };
const MOD: Record<string, string> = { LP: "꼼꼼한", LF: "유연한", GP: "내다보는", GF: "재빠른" };
const TAGLINE: Record<string, string> = {
  SR: "새는 곳을 막고 차곡차곡 쌓아 가는 타입이야.",
  SI: "필요한 곳에 알맞게 쓰며 삶을 알차게 채우는 타입이야.",
  AR: "판을 크게 짜서 눈에 보이는 자산을 키워 가는 타입이야.",
  AI: "흐름을 읽고 감각으로 기회를 잡아 가는 타입이야.",
};
const AXIS_TEXT: Record<string, string> = {
  S: "지키는 힘이 커서 잃지 않는 선택이 마음 편한 쪽이야.",
  A: "도전하는 힘이 커서 판을 키우는 선택에 마음이 끌리는 쪽이야.",
  R: "눈에 보이고 손에 잡히는 것에서 안심하는 쪽이야.",
  I: "흐름과 경험, 감각에 쓰는 돈이 돌아오기 쉬운 쪽이야.",
  L: "숫자와 근거를 확인하고 정할 때 힘이 나는 쪽이야.",
  G: "직감이 빨라서 순간 판단이 강점인 쪽이야.",
  P: "미리 계획을 세워 움직일 때 마음이 안정되는 쪽이야.",
  F: "그때그때 유연하게 움직일 때 기회가 보이는 쪽이야.",
};
const STYLE_TIP: Record<string, string> = {
  S: "잃어도 괜찮은 금액을 정해 두고, 나머지는 자동 저축이나 나눠 담는 방식으로 지켜 봐.",
  A: "도전은 ‘잃어도 생활이 흔들리지 않는 한도’를 먼저 정해 두고 그 안에서만 해 봐.",
  R: "눈에 보이는 통장 잔고와 기록으로 상황을 확인하는 습관이 잘 맞아.",
  I: "배움, 경험, 사람에게 쓰는 돈이 돌아오기 쉬우니 어디에 쓸지 한 줄로 적어 두고 써 봐.",
  L: "결정하기 전에 숫자 두세 개를 비교해 보는 한 단계를 꼭 거쳐 봐.",
  G: "직감이 올 때는 큰 결정을 하루 묵혔다가 숫자로 한 번 더 확인해 봐.",
  P: "월 단위 계획표를 만들어 두면 흐름이 훨씬 편해져.",
  F: "정해 둔 규칙이 없으면 기분 따라 새기 쉬우니, 자동으로 굴러가는 규칙 한 가지만 만들어 봐.",
};

const TIERS: Array<{ min: number; tier: string; note: string }> = [
  { min: 60, tier: "큰 무쇠솥", note: "평생 재물 기운이 넉넉하게 담기는 큰 그릇이야. 크게 담을 수 있는 만큼 판을 키울 때 힘이 나." },
  { min: 50, tier: "든든한 뚝배기", note: "꾸준히 데워지고 오래 식지 않는 든든한 그릇이야. 차근차근 채울수록 단단해져." },
  { min: 42, tier: "알찬 도자기 그릇", note: "크기보다 쓰임새가 돋보이는 야무진 그릇이야. 알맞게 채우고 알맞게 쓰는 힘이 강점이야." },
  { min: 0, tier: "작지만 단단한 옹기", note: "작은 그릇은 금방 차올라서 새는 곳만 막으면 오히려 든든해. 크기보다 알차게 채우는 습관이 더 크게 작용해." },
];

export function tierOf(size: number): { tier: string; note: string } {
  const t = TIERS.find((x) => size >= x.min) ?? TIERS[TIERS.length - 1];
  return { tier: t.tier, note: t.note };
}

function surfaceGods(r: SajuResult, hourUnknown: boolean): string[] {
  const out: string[] = [];
  for (const k of ["year", "month", "day", "hour"] as const) {
    if (k === "hour" && hourUnknown) continue;
    if (k !== "day") out.push(r.tenGods[k].stem ?? "");
    out.push(r.tenGods[k].branch ?? "");
  }
  return out.filter(Boolean);
}

export function buildWealthProfile(r: SajuResult, ctx: { elements: ElementView[]; gradeLabel: string; hourUnknown: boolean }, chart: BookChart | null): WealthProfile {
  const gods = surfaceGods(r, ctx.hourUnknown);
  const g = (name: string) => gods.filter((x) => groupOf(x) === name).length;
  const el = (n: string) => ctx.elements.find((e) => e.name === n)?.count ?? 0;
  const scoreA = g("비겁") + g("식상") - (g("인성") + g("관성")) + (ctx.gradeLabel === "신강" ? 1 : ctx.gradeLabel === "신약" ? -1 : 0);
  const stable = gods.filter((x) => STABLE.includes(x)).length;
  const wild = gods.filter((x) => WILD.includes(x)).length;
  const dayYin = STEMS.find((s) => s.hanja === r.dayStem)?.yinYang === "yin";
  const picks: Array<"a" | "b"> = [scoreA >= 1 ? "b" : "a", el("토") + el("금") >= el("화") + el("수") ? "a" : "b", stable >= wild ? "a" : "b", dayYin ? "a" : "b"];
  const code = AXES.map((ax, i) => ax[picks[i]].letter).join("");
  const base = `${code[0]}${code[1]}`;
  const mod = `${code[2]}${code[3]}`;
  const pts = (chart?.points ?? []).filter((p) => p.endAge >= 20 && !p.locked);
  const size = pts.length ? Math.round(pts.reduce((a, p) => a + p.value, 0) / pts.length) : 50;
  const fill = chart?.points.find((p) => p.current)?.value ?? size;
  const { tier, note } = tierOf(size);
  return {
    name: `${MOD[mod]} ${NOUN[base]}`,
    code,
    tagline: TAGLINE[base],
    axes: AXES.map((ax, i) => ({ a: ax.a, b: ax.b, pick: picks[i] })),
    bowl: { tier, size, fill, note },
  };
}

function monthOf(label: string): number {
  return Number(/(\d+)월/.exec(label)?.[1] ?? NaN);
}
const season = (m: number) => (m >= 2 && m <= 4 ? "봄" : m >= 5 && m <= 7 ? "여름" : m >= 8 && m <= 10 ? "가을" : "겨울");

/** 재물운 장 앞뒤에 붙는 풀이 글 */
export function moneyIntroSections(r: SajuResult, w: WealthProfile, hourUnknown: boolean, chart: BookChart | null): BookSection[] {
  const axisLines = w.axes.map((ax) => `- **${ax[ax.pick].label}** · ${AXIS_TEXT[ax[ax.pick].letter]}`).join("\n");
  const natal: Partial<Record<PosKey, string>> = { year: r.pillars.year, month: r.pillars.month, day: r.pillars.day };
  if (!hourUnknown) natal.hour = r.pillars.hour;
  const surface = surfaceGods(r, hourUnknown).filter((x) => groupOf(x) === "재성").length;
  const hid = hiddenSummary(hiddenGods(r.dayStem, natal), "재성");
  let where: string;
  if (surface > 0) where = `원국에 재물 기운(재성)이 겉으로 ${surface}개 보여서, 그릇 바닥이 단단한 편이야.`;
  else if (hid) where = `겉으로 드러난 재물 글자(재성)는 없지만 지지 속에 ${hid}이 숨어 있어. 눈에 띄지 않게 쌓아 두었다가 필요할 때 꺼내 쓰는 그릇이야. 재성이 안 보인다고 돈과 거리가 먼 건 아니야.`;
  else {
    const cur = r.daeun.current;
    const next = r.daeun.list.find((d) => (!cur || d.startAge > cur.startAge) && (groupOf(d.stemTenGod) === "재성" || groupOf(d.branchTenGod) === "재성"));
    where = `원국에는 재물 글자(재성)가 보이지 않아. 작은 그릇이라는 뜻이 아니라, 재물 기운이 들어오는 시기에 크게 채워지는 ‘비어 있는 그릇’에 가까워.${next ? ` ${next.startAge}~${next.endAge}세 대운에 재물 기운이 들어오니 그때를 미리 준비해 봐.` : ""}`;
  }
  const curP = chart?.points.find((p) => p.current);
  const nowLine = curP ? `지금 대운은 물이 ${w.bowl.fill >= w.bowl.size ? "그릇 크기만큼 넉넉히" : "아직 차오르는 중으로"} 차 있는 때야(지수 ${curP.value}). 높고 낮음은 좋고 나쁨이 아니라 지금 어울리는 속도를 알려 줘.` : "";
  return [
    { heading: `나의 돈 팔자 · ${w.name} (${w.code})`, body: `${w.tagline}\n\n${axisLines}` },
    { heading: `돈그릇 크기 · ${w.bowl.tier}`, body: `${w.bowl.note} ${where} ${nowLine}`.replace(/\s+/g, " ").trim() },
  ];
}

export function moneyTailSections(w: WealthProfile, cal: BookTable | null, yongsinEl: string | null): BookSection[] {
  const out: BookSection[] = [];
  if (cal && cal.rows.length > 0) {
    const open = cal.rows.filter((x) => typeof x.bar === "number");
    const ranked = [...open].sort((a, b) => (b.bar ?? 0) - (a.bar ?? 0));
    const top = ranked[0];
    const second = ranked.find((x) => x !== top && Math.abs(monthOf(x.label) - monthOf(top.label)) >= 2);
    const low = ranked[ranked.length - 1];
    if (top) {
      const m = monthOf(top.label);
      out.push({
        heading: "재물 시기 한눈에",
        body: `앞으로 12달 중 재물 기운이 가장 힘을 받는 때는 ${top.label}(지수 ${top.bar}) 무렵이고${second ? `, 그다음은 ${second.label}이야` : ""}. ${Number.isFinite(m) ? `${season(m)}에 흐름이 풀리기 쉬우니, 그 전까지는 서두르기보다 준비하는 쪽이 좋아.` : ""} 반대로 ${low.label} 무렵은 속도를 늦추고 지출과 문서를 점검하기 좋은 때야. 달력의 높낮이는 계획을 세우는 참고일 뿐이고, 같은 달이라도 내가 어떻게 움직이느냐로 모양이 달라져.`.replace(/\s+/g, " ").trim(),
      });
    }
  }
  const tips = w.axes.map((ax) => `- ${STYLE_TIP[ax[ax.pick].letter]}`).join("\n");
  out.push({ heading: "투자 스타일", body: `${w.name} 유형이 돈을 다룰 때 마음이 편한 방식이야.\n\n${tips}\n\n특정 종목이나 상품을 권하는 게 아니라 돈을 다루는 성향을 읽은 거야. 큰 결정은 꼭 내 상황과 전문가의 설명을 함께 확인해 줘.` });
  const habit = yongsinEl && ELEMENT_HABIT[yongsinEl] ? `\n\n내 사주에 힘이 되는 ${yongsinEl} 기운을 곁에 두는 습관도 좋아: ${ELEMENT_HABIT[yongsinEl].habit}.` : "";
  out.push({
    heading: "지갑 열기 전 세 가지 질문",
    body: `- 이 소비가 내 그릇에 다시 돌아오는 물일까?\n- 내일의 나도 잘 썼다고 말해 줄까?\n- 24시간이 지나도 여전히 갖고 싶을까?\n\n세 번 곱씹는 습관만 들여도 새는 곳이 줄어. 그리고 한 달에 한 번, 통장 잔고와 문서를 정갈하게 정리하는 날을 정해 봐.${habit}`,
  });
  return out;
}
