import type { SajuResult } from "ssaju";
import { buildTopicInsight } from "../topic";
import type { BookPage, BookRow, BookSection, TopicKey } from "../types";
import { buildBook, type BookContext } from "./index";
import { STAGE12_TEXT } from "./dict";

/*
 * 프리미엄 20쪽 리포트. 기존 규칙 기반 10쪽 빌더(buildBook)의 내용을 장 구성에 맞게 다시 묶어요.
 * 서문 2 · 1장 1 · 2장 2 · 3장 2 · 4~6장 각 1 · 7~10장 각 1 · 부록 6
 */

const PAGE_FIX: Array<[RegExp, string]> = [
  [/8쪽/g, "16쪽"],
  [/9쪽/g, "17쪽"],
  [/4쪽의 오행 균형 팁/g, "5쪽의 오행 균형 팁"],
];

function fixRefs(p: BookPage): BookPage {
  const fix = (t: string) => PAGE_FIX.reduce((a, [re, to]) => a.replace(re, to), t);
  return { ...p, lead: fix(p.lead), sections: p.sections.map((s) => ({ ...s, body: fix(s.body) })) };
}

function half<T>(list: T[]): [T[], T[]] {
  const n = Math.ceil(list.length / 2);
  return [list.slice(0, n), list.slice(n)];
}

const PREFACE: BookSection[] = [
  { heading: "사주팔자는 무엇일까요?", body: "사주(四柱)는 ‘네 개의 기둥’, 팔자(八字)는 ‘여덟 글자’라는 뜻이에요. 태어난 해·달·날·시간을 각각 하나의 기둥으로 세우고, 기둥마다 위아래 두 글자(하늘의 기운인 천간, 땅의 기운인 지지)를 적으면 모두 여덟 글자가 돼요. 이 여덟 글자가 태어난 순간의 하늘과 땅의 모습을 담은 지도라고 생각하면 쉬워요." },
  { heading: "왜 ‘날씨와 지도’라고 할까요?", body: "사주는 정해진 결과를 알려 주는 점괘라기보다, 내가 타고난 성향과 앞으로 지나갈 계절의 흐름을 살펴보는 도구예요. 어떤 사람은 불 기운이 강해 열정적이고, 어떤 사람은 물 기운이 강해 생각이 깊어요. 좋고 나쁨이 아니라 ‘나는 이런 사람이구나’ 하고 이해하는 데 쓰면 가장 좋아요." },
  { heading: "오행: 다섯 가지 기운", body: "목(나무)·화(불)·토(흙)·금(쇠)·수(물)를 오행이라고 해요. 나무는 불을 키우고, 불은 흙을 만들고, 흙은 쇠를 품고, 쇠는 물을 모으고, 물은 나무를 키우는 식으로 서로 돕고(상생) 누르며(상극) 균형을 이뤄요. 내 사주에 어떤 기운이 많고 적은지가 성향의 바탕이 돼요." },
  { heading: "일간: 사주 속의 ‘나’", body: "여덟 글자 중 태어난 날의 위쪽 글자를 일간이라고 해요. 사주에서는 이 글자를 ‘나 자신’으로 보고, 나머지 글자가 나와 어떤 관계인지로 성격·재물·사람 관계를 읽어요." },
];

const PREFACE2: BookSection[] = [
  { heading: "십성: 나와 세상의 관계", body: "일간(나)을 기준으로 다른 글자들이 나와 어떤 관계인지 열 가지로 나눈 것이 십성이에요. 나와 같은 편(비겁), 내가 표현하는 것(식상), 내가 얻는 것(재성), 나를 다스리는 것(관성), 나를 돕는 것(인성) 다섯 묶음으로 보면 쉬워요." },
  { heading: "대운과 세운: 시간의 흐름", body: "대운은 10년 단위로 바뀌는 큰 계절, 세운은 매년 바뀌는 한 해의 날씨, 월운은 달마다의 분위기예요. 타고난 지도(원국)는 그대로이지만, 어느 계절을 지나는지에 따라 같은 사람도 다른 모습으로 살아가요." },
  { heading: "이 리포트는 이렇게 읽어 주세요", body: "먼저 서문과 1~3장에서 나의 타고난 모습을 보고, 4~6장에서 운과 기운의 흐름을 살펴요. 7~10장은 재물·연애·직업·건강을 하나씩 깊이 풀고, 부록에서 큰 흐름과 올해·내년의 달별 흐름, 요즘 고민, 행운 처방을 정리해요. 재미와 참고용으로 편하게 읽어 주세요." },
];

function stageTimeline(r: SajuResult): { sections: BookSection[]; rows: BookRow[] } {
  const cur = r.daeun.current;
  const sections: BookSection[] = [];
  const rows: BookRow[] = [];
  for (const d of r.daeun.list) {
    const stage = (d as unknown as Record<string, string>)["12unsung"] ?? "";
    const isCur = cur !== null && d.startAge === cur.startAge;
    rows.push({ label: `${d.startAge}~${d.endAge}세`, value: `${d.ganzhi} · ${stage || "-"}`, highlight: isCur });
    if (stage && STAGE12_TEXT[stage]) sections.push({ heading: `${d.startAge}~${d.endAge}세 · ${stage}${isCur ? " (지금)" : ""}`, body: STAGE12_TEXT[stage] });
  }
  return { sections, rows };
}

function pageBy(pages: BookPage[], key: string): BookPage {
  const p = pages.find((x) => x.key === key);
  if (!p) throw new Error(`book page missing: ${key}`);
  return p;
}

export function buildBook20(r: SajuResult, ctx: BookContext): BookPage[] {
  const base = buildBook(r, ctx);
  const get = (k: string) => fixRefs(pageBy(base, k));
  const topicPage = (k: TopicKey): BookPage => {
    const insight = buildTopicInsight(k, r, { elements: ctx.elements, hourUnknown: ctx.hourUnknown, level: "full" });
    return fixRefs(pageBy(buildBook(r, { ...ctx, topicKey: k, insight }), "topic"));
  };

  const overview = get("overview");
  const pillars = get("pillars");
  const nature = get("nature");
  const elements = get("elements");
  const tengods = get("tengods");
  const geukguk = get("geukguk");
  const daeun = get("daeun");
  const years = get("years");
  const lucky = get("lucky");

  // 읽는 법 문장은 20쪽 구성에 맞게 바꿔요.
  overview.sections = overview.sections.map((s) =>
    s.heading === "이 리포트 읽는 법"
      ? { ...s, body: `사주는 ‘정해진 결과’가 아니라 ‘타고난 날씨와 지도’에 가까워요. 20쪽에 걸쳐 타고난 모습(1~3장), 운의 흐름(4~6장), 재물·연애·직업·건강(7~10장), 그리고 부록을 차례로 풀어 드려요.${ctx.hourUnknown ? " 태어난 시간을 몰라 시주(네 번째 기둥)를 빼고 계산해서, 신강·신약과 용신은 달라질 수 있어요." : ""}` }
      : s,
  );

  const [tgA, tgB] = half(tengods.sections);
  const [yrA, yrB] = half(years.sections);

  // 신살과 귀인 나누기
  const luckySecs = lucky.sections;
  const isGui = (s: BookSection) => /귀인/.test(s.heading);
  const guiSecs = luckySecs.filter(isGui);
  const rxHeads = ["한 달 행운 처방전", "마무리 편지"];
  const rxSecs = luckySecs.filter((s) => rxHeads.includes(s.heading));
  const sinSecs = luckySecs.filter((s) => !isGui(s) && !rxHeads.includes(s.heading));
  const guiBase: BookSection[] = [
    { heading: "귀인이란?", body: "귀인은 내가 힘들 때 하늘이 보내 주는 도움의 기운이에요. 사람일 수도, 기회나 환경일 수도 있어요. 사주에 귀인이 있다는 것은 어려운 순간에 도움을 받기 쉬운 결을 타고났다는 뜻이에요." },
    ...(guiSecs.length ? guiSecs : [{ heading: "나의 귀인", body: "두드러지게 드러난 귀인은 없어요. 귀인은 사주에 글자로 있는 것만이 아니라, 내가 마음을 열고 먼저 다가갈 때 만나는 인연이기도 해요." }]),
    { heading: "귀인을 만나는 마음가짐", body: "도움이 오는 순간을 알아보려면 평소에 감사 인사를 자주 하고, 어려울 때 혼자 끌어안기보다 말해 보는 것이 좋아요. 귀인은 거창한 모습이 아니라 작은 조언이나 소개로 찾아오기도 해요." },
  ];
  const stage = stageTimeline(r);
  const cur = r.daeun.current;

  const seq: Array<{ key: string; title: string; subtitle: string; lead: string; sections: BookSection[]; tables: BookPage["tables"]; extra?: Partial<BookPage> }> = [
    { key: "preface", title: "서문 · 사주팔자, 쉽게 알아보기", subtitle: "PREFACE · 01", lead: "여덟 글자가 말해 주는 것, 일상의 말로 풀어 드려요.", sections: PREFACE, tables: [] },
    { ...overview, title: "서문 · 나의 사주 한눈에 보기", subtitle: "PREFACE · 02", sections: [...overview.sections, ...PREFACE2], tables: overview.tables, extra: { evidence: overview.evidence } },
    { ...pillars, title: "제1장 · 나의 사주팔자", subtitle: "CHAPTER 1", tables: pillars.tables },
    { ...nature, title: "제2장 · 나는 어떤 사람인가? - 일주 분석", subtitle: "CHAPTER 2-1", tables: [] },
    { ...elements, title: "제2장 · 나는 어떤 사람인가? - 오행 분석", subtitle: "CHAPTER 2-2", tables: elements.tables },
    { ...tengods, key: "tengods", title: "제3장 · 내가 세상을 살아가는 방법 - 십성 분석", subtitle: "CHAPTER 3-1", sections: tgA, tables: tengods.tables },
    { ...tengods, key: "tengods:2", title: "제3장 · 내가 세상을 살아가는 방법 - 십성 분석", subtitle: "CHAPTER 3-2", lead: "이어서 다른 기운들과 채워 갈 부분을 살펴봐요.", sections: tgB, tables: [] },
    {
      key: "stage12",
      title: "제4장 · 나의 운, 이렇게 흘러간다 - 십이운성 분석",
      subtitle: "CHAPTER 4",
      lead: cur ? `지금은 ${cur.ganzhi} 대운, 십이운성으로는 ‘${(cur as unknown as Record<string, string>)["12unsung"] ?? ""}’ 단계에 있어요.` : "인생의 시기마다 기운의 세기가 어떻게 달라지는지 봐요.",
      sections: [
        { heading: "십이운성이란?", body: "기운이 태어나 자라고, 절정을 지나 쉬었다가 다시 시작하는 열두 단계를 말해요. 장생·목욕·관대·건록·제왕·쇠·병·사·묘·절·태·양의 순서로 흐르고, 어느 단계에 있든 좋고 나쁨이 아니라 ‘지금 어울리는 속도’를 알려 주는 신호예요." },
        ...stage.sections,
      ],
      tables: [{ title: "대운별 십이운성", rows: stage.rows }],
    },
    {
      key: "sinsal",
      title: "제5장 · 위기 또는 기회 - 신살 분석",
      subtitle: "CHAPTER 5",
      lead: "사주 속 특별한 기운이 위기가 될지 기회가 될지 살펴봐요.",
      sections: [{ heading: "신살이란?", body: "신살은 사주 속에 숨어 있는 특별한 기운이에요. 이름이 거칠어 보여도 쓰기에 따라 힘이 되는 경우가 많아서, 겁먹기보다 ‘이런 기운이 있구나’ 하고 알아 두는 정도로 읽어 주세요." }, ...sinSecs],
      tables: [],
    },
    { key: "gui", title: "제6장 · 나를 도와주는 귀인들 - 귀인 분석", subtitle: "CHAPTER 6", lead: "내가 힘들 때 곁에서 힘이 되어 줄 기운을 찾아봐요.", sections: guiBase, tables: [] },
    { ...topicPage("money"), key: "topic:money", title: "제7장 · 재물운", subtitle: "CHAPTER 7" },
    { ...topicPage("love"), key: "topic:love", title: "제8장 · 연애 & 결혼운", subtitle: "CHAPTER 8" },
    { ...topicPage("success"), key: "topic:career", title: "제9장 · 직업운", subtitle: "CHAPTER 9" },
    { ...topicPage("health"), key: "topic:health", title: "제10장 · 건강운", subtitle: "CHAPTER 10" },
    { ...geukguk, title: "부록 · 격국과 용신", subtitle: "APPENDIX 1" },
    { ...daeun, title: "부록 · 대운 — 10년 단위의 큰 흐름", subtitle: "APPENDIX 2" },
    { ...years, key: "years", title: "부록 · 올해·내년의 흐름", subtitle: "APPENDIX 3-1", sections: yrA, tables: years.tables.slice(0, 1) },
    { ...years, key: "years:2", title: "부록 · 달별 흐름", subtitle: "APPENDIX 3-2", lead: "달마다 바뀌는 분위기와 포인트 달을 살펴봐요.", sections: yrB, tables: years.tables.slice(1) },
    {
      key: "concern",
      title: "부록 · 요즘 고민 맞춤 풀이",
      subtitle: "APPENDIX 4",
      lead: ctx.insight.headline,
      sections: [...ctx.insight.points.map((p) => ({ heading: p.title, body: p.body })), ...ctx.insight.timing.map((t) => ({ heading: t.title, body: t.body }))],
      tables: [],
    },
    { ...lucky, key: "lucky", title: "부록 · 행운 처방전", subtitle: "APPENDIX 5", sections: [...rxSecs.filter((x) => x.heading === "한 달 행운 처방전"), { heading: "작게 시작하는 법", body: "처방을 한꺼번에 다 하려고 하면 부담이 돼요. 이번 주에는 색, 습관, 방향 중 마음이 가는 하나만 골라 가볍게 시작해 보세요. 작은 실천이 쌓이면 흐름이 조금씩 달라져요." }, ...rxSecs.filter((x) => x.heading === "마무리 편지")], tables: lucky.tables },
  ];

  return seq.map((s, i) => {
    const { extra, ...rest } = s;
    return { ...rest, ...(extra ?? {}), no: i + 1 } as BookPage;
  });
}
