import { STEMS } from "@/lib/saju/constants";
import { branchRelation, tenGodOf, type TenGod } from "@/lib/ai/dailyFacts";
import { GOD_MEANING, RELATION_TEXT, branchOf, countElements, hangulStem, isStemClash, isStemCombine, stemOf, type SsajuForCompat } from "../compat";
import { josa } from "../josa";
import { ELEMENT_INFO, FLOW_LINE, groupOf } from "../topic";
import type { BookPage, BookRow, BookSection, CompatView } from "../types";
import { ELEMENT_EXCESS, ELEMENT_HABIT, ELEMENT_LACK, STEM_DETAIL, STEM_PROFILE, STRENGTH_TEXT } from "./dict";
import { maskText } from "./lock";

/*
 * 궁합 리포트 10페이지. 두 사람의 사주 계산 결과를 문장 사전과 규칙으로 풀어 써요.
 * AI 호출이 없어서 같은 입력이면 항상 같은 내용이고, 키가 없어도 동작해요.
 */

/** 궁합 책에서 읽는 ssaju 결과 부분 (라이브러리 내부 타입에 기대지 않으려고 직접 정의했어요) */
export interface BookSource extends SsajuForCompat {
  dayStem: string;
  currentYear: number;
  advanced: { dayStrength: { strength: string; score: number }; yongsin: string[] };
  daeun: { current: { ganzhi: string; startAge: number; endAge: number } | null };
  seyun: Array<{ year: number; ganzhi: string; tenGodStem: string; tenGodBranch: string }>;
}

export interface CompatBookContext {
  compat: CompatView;
  meHourKnown: boolean;
  otherHourKnown: boolean;
}

const GRADE: Record<string, string> = { strong: "신강", weak: "신약", neutral: "중화" };
const EL_KO: Record<string, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

/** 상대가 나를 이런 눈으로 볼 때, 내가 해 주면 좋은 것 */
const GOD_ACTION: Record<TenGod, string> = {
  비견: "대등하게 의견을 물어보고, 상대의 방식도 인정해 주세요.",
  겁재: "비교하거나 앞서려 하기보다 '우린 같은 편'이라는 말을 자주 해 주세요.",
  식신: "함께 맛있는 것을 먹고 편히 쉬는 시간을 자주 만들어 주세요.",
  상관: "솔직한 의견에 귀 기울이고, 말은 서로 부드럽게 골라 주세요.",
  편재: "새로운 장소와 경험으로 함께하는 즐거움을 더해 주세요.",
  정재: "작은 약속과 기념일을 꼼꼼히 챙겨 주세요.",
  편관: "서로의 영역을 지켜 주고, 책임질 일은 미루지 말아 주세요.",
  정관: "믿음을 주는 말과 예의 있는 태도가 큰 힘이 돼요.",
  편인: "혼자만의 시간을 인정하고, 생각을 끝까지 들어 주세요.",
  정인: "따뜻하게 챙기고, 곁에서 마음을 편안하게 해 주세요.",
};

const BRANCH_NONE = "특별한 합이나 충이 없는 무난한 사이예요. 큰 부딪힘 없이 각자의 리듬을 지켜 가며 천천히 맞춰 갈 수 있어요.";

const stemEl = (hanja: string): string => {
  const s = STEMS.find((x) => x.hanja === hanja);
  return s ? (EL_KO[s.element] ?? "") : "";
};

const profile = (stem: string) => STEM_PROFILE[stem] ?? STEM_PROFILE["甲"];
const detail = (stem: string) => STEM_DETAIL[stem] ?? STEM_DETAIL["甲"];

function groupLine(god: string | undefined): string {
  const g = groupOf(god);
  return g ? FLOW_LINE[g] : "차분히 흐름을 지켜보며 나아가기 좋은 때예요.";
}

function relSentence(a: string, b: string, good: string): { label: string; text: string } {
  const rel = branchRelation(a, b);
  if (!rel) return { label: "특별한 관계 없음", text: BRANCH_NONE };
  return { label: rel, text: `${RELATION_TEXT[rel]}${rel === "합" ? ` ${good}` : ""}` };
}

export function buildCompatBook(me: BookSource, other: BookSource, ctx: CompatBookContext): BookPage[] {
  const { compat, meHourKnown, otherHourKnown } = ctx;
  const pages: BookPage[] = [];
  const add = (key: string, title: string, lead: string, sections: BookSection[], tables: BookPage["tables"] = []) =>
    pages.push({ no: pages.length + 1, key, title, subtitle: `PREMIUM REPORT · ${String(pages.length + 1).padStart(2, "0")}`, lead, sections, tables });

  const meDay = me.pillars.day;
  const otDay = other.pillars.day;
  const meStem = me.dayStem || stemOf(meDay);
  const otStem = other.dayStem || stemOf(otDay);
  const mp = profile(meStem);
  const op = profile(otStem);
  const god = tenGodOf(meStem, otStem); // 내가 보는 상대
  const godBack = tenGodOf(otStem, meStem); // 상대가 보는 나
  const gm = GOD_MEANING[god];
  const gb = GOD_MEANING[godBack];
  const combine = isStemCombine(meStem, otStem);
  const clash = isStemClash(meStem, otStem);
  const dayRel = relSentence(branchOf(meDay), branchOf(otDay), "가장 가까운 자리라서 연인 사이의 편안함에 크게 닿아요.");
  const monthRel = relSentence(branchOf(me.pillars.month), branchOf(other.pillars.month), "일과 생활 리듬에서 서로에게 힘이 돼요.");
  const yearRel = relSentence(branchOf(me.pillars.year), branchOf(other.pillars.year), "가족과 주변, 큰 흐름에서 서로를 편하게 받아 줘요.");
  const bothHour = meHourKnown && otherHourKnown;
  const hourRel = bothHour ? relSentence(branchOf(me.pillars.hour), branchOf(other.pillars.hour), "함께 그려 갈 앞날에서 뜻이 잘 맞아요.") : null;
  const goods = compat.points.filter((p) => p.tone === "good");
  const tips = compat.points.filter((p) => p.tone === "tip");
  const year = me.currentYear;
  const hourNote = !bothHour ? " 태어난 시간을 모르는 사람이 있어 시주는 빼고 계산했어요. 신강·신약과 용신은 달라질 수 있어요." : "";

  // ── 1. 한눈에 보기
  add(
    "c-overview",
    "둘의 궁합 한눈에 보기",
    `${meDay} × ${otDay} · ${josa(mp.image, "과/와")} ${op.image}의 만남`,
    [
      { heading: "두 사람을 한 문장으로", body: `${josa(mp.image, "을/를")} 닮은 나와 ${josa(op.image, "을/를")} 닮은 상대가 만났어요. ${compat.headline}.` },
      {
        heading: "핵심 3줄 요약",
        body: `① 잘 맞는 점: ${goods[0] ? `${goods[0].title} — ${goods[0].body}` : "서로의 결이 크게 어긋나지 않아요."} ② 맞춰 가면 좋은 점: ${tips[0] ? `${tips[0].title} — ${tips[0].body}` : "눈에 띄는 어긋남 없이 편안한 사이예요."} ③ 올해의 흐름: 9쪽에서 두 사람의 ${year}년을 나란히 보여 드려요.`,
      },
      {
        heading: "이 리포트 읽는 법",
        body: `궁합은 '맞다·틀리다'가 아니라 '서로의 리듬을 이해하는 지도'예요. 10페이지에 걸쳐 각자의 기질(2쪽), 서로가 보는 서로(3쪽), 일간·일지의 만남(4쪽), 생활 리듬과 주변(5쪽), 오행 균형(6쪽), 서로를 돕는 힘(7쪽), 연애 스타일과 소통법(8쪽), 올해와 내년의 흐름(9쪽), 도리의 처방(10쪽)을 차례로 풀어 드려요. 재미와 참고용으로 편하게 읽어 주세요.${hourNote}`,
      },
    ],
    [
      {
        title: "궁합 요약",
        rows: [
          { label: "나의 일주", value: `${meDay} (${compat.me.dayReading ?? "-"})`, note: mp.image },
          { label: "상대의 일주", value: `${otDay} (${compat.partner.dayReading ?? "-"})`, note: op.image },
          { label: "도리 궁합 지수", value: `${compat.score} / 100`, highlight: true },
          { label: "내가 보는 상대", value: `${god}의 기운` },
          { label: "상대가 보는 나", value: `${godBack}의 기운` },
          { label: "일지 관계", value: dayRel.label },
        ],
      },
    ],
  );

  // 1쪽: 두 사람에게 해당하는지 눌러 볼 문장과 계산 근거
  const firstSentence = (t: string) => t.split(/(?<=[.!?요])\s/)[0] ?? t;
  const checkItems = compat.points.slice(0, 3).map((p) => firstSentence(p.body)).filter((t) => t.length > 0);
  if (checkItems.length > 0) {
    pages[0].sections.splice(1, 0, {
      heading: "두 사람, 이런 모습 있지 않나요?",
      body: "두 사람의 사주에서 읽히는 모습이에요. 실제로 비슷하다고 느껴지는 것만 눌러 보세요.",
      checks: checkItems,
    });
  }
  pages[0].evidence = [
    { label: "나의 일주", value: `${meDay} · ${mp.image}` },
    { label: "상대의 일주", value: `${otDay} · ${op.image}` },
    { label: "내가 보는 상대", value: `${god}` },
    { label: "상대가 보는 나", value: `${godBack}` },
    { label: "일지 관계", value: dayRel.label },
    ...(combine ? [{ label: "일간", value: "서로 합(어울림)" }] : clash ? [{ label: "일간", value: "서로 충(부딪힘)" }] : []),
    ...(bothHour ? [] : [{ label: "참고", value: "시간을 모르는 사람이 있어 시주는 빼고 계산" }]),
  ];

  // ── 2. 각자의 타고난 기질
  const meGrade = GRADE[me.advanced.dayStrength.strength] ?? "중화";
  const otGrade = GRADE[other.advanced.dayStrength.strength] ?? "중화";
  const meStr = STRENGTH_TEXT[meGrade];
  const otStr = STRENGTH_TEXT[otGrade];
  add(
    "c-nature",
    "각자의 타고난 기질",
    `${mp.image} ♡ ${op.image}`,
    [
      { heading: `나는 이런 사람 · ${meStem}(${hangulStem(meStem)})`, body: `${mp.core} ${mp.strength}` },
      { heading: `상대는 이런 사람 · ${otStem}(${hangulStem(otStem)})`, body: `${op.core} ${op.strength}` },
      { heading: "나의 에너지 모양", body: `${meStr.head}예요. ${meStr.body}` },
      { heading: "상대의 에너지 모양", body: `${otStr.head}예요. ${otStr.body}` },
      { heading: "서로 알아 두면 좋은 점", body: `나는 ${mp.care} 상대는 ${op.care} 서로의 이런 면을 미리 알고 있으면 오해가 훨씬 줄어요.` },
    ],
    [
      {
        title: "두 사람의 에너지",
        rows: [
          { label: "나", value: `${meGrade} · ${me.advanced.dayStrength.score}점` },
          { label: "상대", value: `${otGrade} · ${other.advanced.dayStrength.score}점` },
        ],
      },
    ],
  );

  // ── 3. 서로가 보는 서로
  add(
    "c-eyes",
    "서로의 눈에 비친 서로",
    `내가 보는 상대는 ${god}, 상대가 보는 나는 ${godBack}`,
    [
      { heading: `내가 보는 상대 · ${god}의 기운`, body: gm.text },
      { heading: `상대가 보는 나 · ${godBack}의 기운`, body: gb.text },
      {
        heading: "끌리는 이유",
        body: combine
          ? `나의 ${meStem}(${hangulStem(meStem)})과 상대의 ${otStem}(${hangulStem(otStem)})은 서로 합을 이루는 사이예요. 설명하기 어려운 끌림이 먼저 오는 인연의 결이에요.`
          : `${gm.good && gb.good ? "서로를 편하게 받아 주는 결이 있어서" : "서로 다른 결이 신선한 자극이 되어서"} 자연스럽게 마음이 가는 사이예요. 닮은 점보다 다른 점이 서로를 궁금하게 만들어요.`,
      },
      { heading: "내가 해 주면 좋은 것", body: `상대는 나를 ${josa(godBack, "으로/로")} 보고 있어요. ${GOD_ACTION[godBack]}` },
      { heading: "상대가 해 주면 좋은 것", body: `나는 상대를 ${josa(god, "으로/로")} 보고 있어요. ${GOD_ACTION[god]}` },
    ],
    [
      {
        title: "서로를 보는 눈",
        rows: [
          { label: "내가 보는 상대", value: god, note: gm.good ? "편안한 결" : "자극이 되는 결" },
          { label: "상대가 보는 나", value: godBack, note: gb.good ? "편안한 결" : "자극이 되는 결" },
        ],
      },
    ],
  );

  // ── 4. 일간·일지의 만남
  add(
    "c-core",
    "일간과 일지의 만남",
    "가장 중심이 되는 두 글자와, 가장 가까운 자리",
    [
      {
        heading: `일간끼리의 관계 · ${combine ? "합" : clash ? "충" : "보통"}`,
        body: combine
          ? "두 사람의 중심 글자가 서로 합을 이뤄요. 처음부터 마음이 가고, 같이 있으면 자연스럽게 하나의 분위기가 만들어지는 조합이에요."
          : clash
            ? "두 사람의 중심 글자가 정면으로 만나는 충의 관계예요. 솔직하고 자극이 큰 사이라 서로를 단단하게 키워 줘요. 말투만 부드럽게 맞추면 큰 장점이 돼요."
            : "일간끼리는 합도 충도 없는 보통의 관계예요. 그래서 오히려 일지와 오행 같은 다른 요소가 두 사람의 분위기를 만들어 줘요.",
      },
      { heading: `일지 · 마음의 거리 · ${dayRel.label}`, body: dayRel.text },
      {
        heading: "두 일주가 만드는 분위기",
        body: `${meDay} 일주의 ${josa(mp.image, "과/와")} ${otDay} 일주의 ${josa(op.image, "이/가")} 만났어요. ${combine || dayRel.label === "합" ? "서로 끌어당기는 힘이 있어 함께 있을수록 편안해져요." : clash || dayRel.label === "충" ? "서로를 움직이게 하는 활력이 있는 대신, 쉬어 가는 박자를 같이 정하면 좋아요." : "서로의 속도를 존중하면 편안하게 쌓아 갈 수 있는 사이예요."}`,
      },
    ],
    [
      {
        title: "일간 · 일지",
        rows: [
          { label: "나의 일간 · 일지", value: `${meStem}(${hangulStem(meStem)}) · ${branchOf(meDay)}` },
          { label: "상대의 일간 · 일지", value: `${otStem}(${hangulStem(otStem)}) · ${branchOf(otDay)}` },
          { label: "일간 관계", value: combine ? "합" : clash ? "충" : "보통", highlight: combine || clash },
          { label: "일지 관계", value: dayRel.label, highlight: dayRel.label === "합" || dayRel.label === "충" },
        ],
      },
    ],
  );

  // ── 5. 생활 리듬과 주변
  add(
    "c-life",
    "생활 리듬과 주변",
    "월지는 일과 생활의 리듬, 연지는 가족과 주변의 결",
    [
      { heading: `월지 · 생활 방식 · ${monthRel.label}`, body: monthRel.text },
      { heading: `연지 · 띠 궁합 · ${yearRel.label}`, body: yearRel.text },
      {
        heading: "시주 · 함께 그릴 앞날",
        body: hourRel
          ? `시지의 관계는 ${hourRel.label}이에요. ${hourRel.text}`
          : "태어난 시간을 모르는 사람이 있어 시주는 비교하지 않았어요. 두 사람 모두 시간을 알면 함께 그려 갈 앞날의 결도 볼 수 있어요.",
      },
      {
        heading: "생활 속 조율 포인트",
        body: `${[monthRel, yearRel].some((r) => r.label === "충") ? "일상의 리듬(식사·수면·약속 시간)이 달라서 변화가 많을 수 있어요. 한 가지씩 함께 정해 두면 편해져요. " : ""}${[monthRel, yearRel].some((r) => r.label === "합") ? "생활 리듬과 주변 환경에서 서로에게 힘이 되는 부분이 있어요. " : ""}${[monthRel, yearRel].every((r) => r.label === "특별한 관계 없음") ? "생활 리듬에서 큰 충돌은 없어요. 서로의 일정과 가족 행사를 미리 공유하면 더 편안해져요. " : ""}`.trim(),
      },
    ],
    [
      {
        title: "기둥별 지지 관계",
        rows: [
          { label: "월지", value: monthRel.label, note: `${branchOf(me.pillars.month)} · ${branchOf(other.pillars.month)}` },
          { label: "연지(띠)", value: yearRel.label, note: `${branchOf(me.pillars.year)} · ${branchOf(other.pillars.year)}` },
          { label: "시지", value: hourRel ? hourRel.label : "비교 안 함", note: hourRel ? `${branchOf(me.pillars.hour)} · ${branchOf(other.pillars.hour)}` : "시간 미상" },
        ],
      },
    ],
  );

  // ── 6. 오행 균형과 보완
  const meEl = countElements(me, meHourKnown);
  const otEl = countElements(other, otherHourKnown);
  const sum = (n: string) => (meEl.find((e) => e.name === n)?.count ?? 0) + (otEl.find((e) => e.name === n)?.count ?? 0);
  const fills: string[] = [];
  const meGives: string[] = [];
  const bothMany: string[] = [];
  const bothNone: string[] = [];
  for (const e of meEl) {
    const a = e.count;
    const b = otEl.find((x) => x.name === e.name)?.count ?? 0;
    if (a === 0 && b >= 2) fills.push(e.name);
    if (b === 0 && a >= 2) meGives.push(e.name);
    if (a >= 3 && b >= 3) bothMany.push(e.name);
    if (a === 0 && b === 0) bothNone.push(e.name);
  }
  const strongest = (arr: typeof meEl) => arr.reduce((x, y) => (y.count > x.count ? y : x), arr[0]);
  const weakest = (arr: typeof meEl) => arr.reduce((x, y) => (y.count < x.count ? y : x), arr[0]);
  add(
    "c-elements",
    "오행 균형과 보완",
    "서로의 빈자리를 채워 주는지, 같은 기운이 겹치는지",
    [
      { heading: "나의 오행", body: `${strongest(meEl).name} 기운이 가장 강하고, ${weakest(meEl).name} 기운이 가장 약해요. ${ELEMENT_INFO[strongest(meEl).name].trait}의 결이 두드러져요.` },
      { heading: "상대의 오행", body: `${strongest(otEl).name} 기운이 가장 강하고, ${weakest(otEl).name} 기운이 가장 약해요. ${ELEMENT_INFO[strongest(otEl).name].trait}의 결이 두드러져요.` },
      {
        heading: "서로 채워 주는 기운",
        body:
          fills.length + meGives.length === 0
            ? "한쪽이 다른 쪽의 빈자리를 크게 채워 주는 구조는 아니에요. 대신 비슷한 균형이라 서로의 방식을 이해하기 쉬워요."
            : `${fills.length ? `나에게 부족한 ${fills.join("·")} 기운을 상대가 넉넉히 가지고 있어요. ` : ""}${meGives.length ? `상대에게 부족한 ${meGives.join("·")} 기운은 내가 넉넉히 가지고 있어요. ` : ""}서로 곁에 있는 것만으로 빈자리가 채워지는 느낌이 들 수 있어요.`,
      },
      {
        heading: "함께라서 넘치는 기운",
        body: bothMany.length
          ? `${bothMany.join("·")} 기운은 둘 다 많아서 함께 있으면 더 커져요. ${bothMany.map((n) => ELEMENT_EXCESS[n] ?? "").join(" ")}`.trim()
          : "둘 다 한쪽으로 넘치는 기운은 없어요. 균형을 크게 해칠 걱정은 적어요.",
      },
      {
        heading: "둘 다 부족한 기운",
        body: bothNone.length
          ? `${bothNone.join("·")} 기운은 두 사람 모두에게 없어요. ${bothNone.map((n) => ELEMENT_LACK[n] ?? "").join(" ")} 함께 채워 가는 활동을 정해 두면 좋아요.`
          : "두 사람이 함께 비어 있는 기운은 없어요. 서로의 기운이 골고루 이어져요.",
      },
    ],
    [
      {
        title: "오행 비교 (나 · 상대 · 합계)",
        rows: meEl.map((e) => ({ label: e.name, value: `${e.count} · ${otEl.find((x) => x.name === e.name)?.count ?? 0} · ${sum(e.name)}` })),
      },
    ],
  );

  // ── 7. 서로를 돕는 힘 (용신)
  const yong = (r: BookSource) => [...new Set(r.advanced.yongsin.map(stemEl).filter(Boolean))];
  const meYong = yong(me);
  const otYong = yong(other);
  const helpMe = meYong.filter((n) => (otEl.find((e) => e.name === n)?.count ?? 0) >= 1);
  const helpOt = otYong.filter((n) => (meEl.find((e) => e.name === n)?.count ?? 0) >= 1);
  const helpLevel = (helpMe.length > 0 ? 1 : 0) + (helpOt.length > 0 ? 1 : 0);
  add(
    "c-yongsin",
    "서로를 돕는 힘",
    "나를 돕는 기운을 상대가 가졌는지, 상대를 돕는 기운을 내가 가졌는지",
    [
      { heading: "나를 돕는 기운", body: meYong.length ? `나에게 힘이 되는 기운은 ${meYong.join("·")}이에요. ${helpMe.length ? `상대가 ${helpMe.join("·")} 기운을 갖고 있어서 곁에 있으면 힘이 나는 조합이에요.` : "상대에게는 이 기운이 크게 없어서, 생활 속에서 따로 채워 주면 좋아요."}` : "나를 돕는 기운을 뚜렷이 정하기 어려운 사주예요." },
      { heading: "상대를 돕는 기운", body: otYong.length ? `상대에게 힘이 되는 기운은 ${otYong.join("·")}이에요. ${helpOt.length ? `내가 ${helpOt.join("·")} 기운을 갖고 있어서 든든한 힘이 되어 줄 수 있어요.` : "내게는 이 기운이 크게 없어서, 생활 속에서 따로 채워 주면 좋아요."}` : "상대를 돕는 기운을 뚜렷이 정하기 어려운 사주예요." },
      {
        heading: "서로에게 힘이 되는 정도",
        body: helpLevel === 2 ? "서로가 서로에게 필요한 기운을 가지고 있어요. 함께할수록 각자의 힘이 커지는 상생의 조합이에요." : helpLevel === 1 ? "한쪽이 다른 쪽에게 힘이 되어 주는 조합이에요. 받는 쪽이 고마움을 자주 표현하면 균형이 더 좋아져요." : "서로의 용신 기운이 직접 이어지진 않아요. 대신 마음을 열고 함께 시간을 쌓는 노력이 가장 큰 힘이 돼요.",
      },
      { heading: "참고할 점", body: `용신은 사주의 균형을 읽는 하나의 관점이에요. 정답이 아니라 힌트로 가볍게 참고해 주세요.${hourNote}` },
    ],
    [
      {
        title: "용신 비교",
        rows: [
          { label: "나를 돕는 기운", value: meYong.join(" · ") || "-" },
          { label: "상대를 돕는 기운", value: otYong.join(" · ") || "-" },
          { label: "내게 힘이 되는 상대의 기운", value: helpMe.join(" · ") || "-" },
          { label: "상대에게 힘이 되는 나의 기운", value: helpOt.join(" · ") || "-" },
        ],
      },
    ],
  );

  // ── 8. 연애 스타일과 소통법
  const md = detail(meStem);
  const od = detail(otStem);
  add(
    "c-love",
    "연애 스타일과 소통법",
    "서로 다른 사랑의 방식을 읽는 법",
    [
      { heading: "나의 연애 스타일", body: md.love },
      { heading: "상대의 연애 스타일", body: od.love },
      { heading: "마음이 지칠 때 나타나는 신호", body: `나는 ${md.stress} 상대는 ${od.stress}` },
      { heading: "마음을 풀어 주는 법", body: `나는 ${md.recover} 상대는 ${od.recover}` },
      {
        heading: "대화 팁",
        body: `${dayRel.label === "충" || clash ? "의견이 부딪히면 바로 결론을 내기보다 한 박자 쉬고 '네 생각은 어때?'를 먼저 물어보세요. " : "편안한 사이일수록 고마움과 속마음을 말로 꺼내는 걸 잊지 마세요. "}${tips[0] ? `특히 '${tips[0].title}' 부분은 서로 미리 알고 있으면 좋아요.` : "큰 어긋남이 없으니 지금의 편안함을 소중히 가꿔 보세요."}`,
      },
    ],
  );

  // ── 9. 올해와 내년의 흐름
  const syMe = me.seyun.find((s) => s.year === year);
  const syOt = other.seyun.find((s) => s.year === year);
  const nxMe = me.seyun.find((s) => s.year === year + 1);
  const nxOt = other.seyun.find((s) => s.year === year + 1);
  const gMe = groupOf(syMe?.tenGodStem);
  const gOt = groupOf(syOt?.tenGodStem);
  add(
    "c-years",
    "올해와 내년의 흐름",
    `${year}년, 두 사람은 어떤 계절을 지나고 있을까요`,
    [
      { heading: `${year}년 · 나의 흐름`, body: syMe ? `${syMe.ganzhi}년이에요. ${groupLine(syMe.tenGodStem)}` : "올해의 흐름을 계산하지 못했어요." },
      { heading: `${year}년 · 상대의 흐름`, body: syOt ? `${syOt.ganzhi}년이에요. ${groupLine(syOt.tenGodStem)}` : "올해의 흐름을 계산하지 못했어요." },
      {
        heading: `${year}년 · 함께 맞이하는 올해`,
        body: gMe && gOt && gMe === gOt ? "두 사람이 비슷한 결의 한 해를 보내요. 같은 고민과 같은 기회를 나눌 수 있어서 서로를 더 잘 이해할 수 있어요." : "두 사람이 서로 다른 계절을 지나고 있어요. 한 사람이 바쁠 땐 다른 사람이 여유를 만들어 주는 식으로 속도를 맞춰 가면 좋아요.",
      },
      { heading: `${year + 1}년 · 내년의 흐름`, body: `${nxMe ? `나는 ${nxMe.ganzhi}년, ${groupLine(nxMe.tenGodStem)}` : "내년 흐름은 아직 계산되지 않았어요."} ${nxOt ? `상대는 ${nxOt.ganzhi}년, ${groupLine(nxOt.tenGodStem)}` : ""}`.trim() },
      {
        heading: "지금의 대운(10년의 계절)",
        body: `${me.daeun.current ? `나는 ${me.daeun.current.ganzhi} 대운(${me.daeun.current.startAge}~${me.daeun.current.endAge}세)을 지나고 있어요. ` : ""}${other.daeun.current ? `상대는 ${other.daeun.current.ganzhi} 대운(${other.daeun.current.startAge}~${other.daeun.current.endAge}세)을 지나고 있어요. ` : ""}10년 단위의 큰 흐름이 다르더라도, 서로의 계절을 이해하는 것이 궁합의 힘이에요.`.trim(),
      },
    ],
    [
      {
        title: "두 사람의 흐름",
        rows: [
          { label: `${year}년 · 나`, value: syMe?.ganzhi ?? "-", note: syMe ? `${syMe.tenGodStem} · ${syMe.tenGodBranch}` : undefined },
          { label: `${year}년 · 상대`, value: syOt?.ganzhi ?? "-", note: syOt ? `${syOt.tenGodStem} · ${syOt.tenGodBranch}` : undefined },
          { label: `${year + 1}년 · 나`, value: nxMe?.ganzhi ?? "-" },
          { label: `${year + 1}년 · 상대`, value: nxOt?.ganzhi ?? "-" },
        ],
      },
    ],
  );

  // ── 10. 도리의 궁합 처방
  const combined = meEl.map((e) => ({ name: e.name, kind: e.kind, count: e.count + (otEl.find((x) => x.name === e.name)?.count ?? 0) }));
  const lowest = combined.reduce((a, b) => (b.count < a.count ? b : a), combined[0]);
  const info = ELEMENT_INFO[lowest.name];
  const habit = ELEMENT_HABIT[lowest.name];
  // '내가 보는 상대 · ○○' 같은 시선 항목이 아닌, 칭찬하기 좋은 장점 항목
  const niceGood = goods.find((p) => !p.title.startsWith("내가 보는") && !p.title.startsWith("상대가 보는"));
  add(
    "c-lucky",
    "도리의 궁합 처방",
    `둘이 함께 채우면 좋은 기운은 ${lowest.name}이에요`,
    [
      { heading: "함께 채울 기운", body: `두 사람의 사주를 합쳐 보면 ${lowest.name} 기운이 가장 적어요. ${ELEMENT_LACK[lowest.name]}` },
      { heading: "데이트 처방", body: `${info.direction} 방향으로 떠나는 산책이나 여행, ${info.color} 톤의 소품이나 옷을 맞춰 입어 보는 것도 좋아요. ${habit.habit}을 함께 하면 두 사람의 기운이 더 편안해져요.` },
      {
        heading: "오래가는 비결 3가지",
        body: `① ${niceGood ? `'${niceGood.title}'의 장점을 자주 칭찬해 주세요.` : "서로 편안하게 어울리는 점을 자주 말해 주세요."} ② ${tips[0] ? `'${tips[0].title}'은 미리 약속을 정해 두면 편해요.` : "작은 약속을 꾸준히 지켜 주세요."} ③ 한 달에 한 번, 서로에게 고마웠던 일을 하나씩 이야기해 보세요.`,
      },
      { heading: "마무리 편지", body: `${compat.closing} 도리 궁합 지수 ${compat.score}점은 재미로 보는 참고 점수예요. 두 사람이 함께 쌓아 가는 시간이 사주보다 훨씬 큰 힘이라는 걸 기억해 주세요. 🫧` },
    ],
    [
      {
        title: "둘의 행운 정보",
        rows: [
          { label: "함께 채울 기운", value: lowest.name, highlight: true },
          { label: "행운 색", value: info.color },
          { label: "행운 방향", value: info.direction },
          { label: "행운 숫자", value: habit.number },
          { label: "추천 소품", value: habit.item },
        ],
      },
    ],
  );

  return pages;
}

/** 결제 전 미리 보기: '언제·어떻게' 풀이를 서버에서 가려서 내려보내요. (화면에서만 가리는 게 아니에요) */
export function lockCompatBook(pages: BookPage[], year: number): BookPage[] {
  const lockedHeadings = new Set(["내가 해 주면 좋은 것", "상대가 해 주면 좋은 것", "마음을 풀어 주는 법", `${year + 1}년 · 내년의 흐름`, "데이트 처방", "오래가는 비결 3가지", "마무리 편지"]);
  return pages.map((p) => ({
    ...p,
    sections: p.sections.map((s) => (lockedHeadings.has(s.heading) ? { heading: s.heading, body: maskText(s.body), locked: true } : s)),
  }));
}
