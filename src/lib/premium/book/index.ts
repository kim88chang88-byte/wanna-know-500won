import type { SajuResult } from "ssaju";
import { STEMS } from "@/lib/saju/constants";
import { ELEMENT_INFO, FLOW_LINE, GROUP_TRAIT, GROUPS, groupOf, type Group } from "../topic";
import type { BookPage, BookRow, BookSection, ElementView, PillarView, TopicInsight, TopicKey } from "../types";
import {
  ELEMENT_DOMAIN,
  ELEMENT_EXCESS,
  ELEMENT_GENERATES,
  GEUKGUK_CAREER,
  GROUP_JOBS,
  QUARTER_TEXT,
  STEM_DETAIL,
  STRATEGY,
  TENGOD_TEXT,
  TOPIC_SITUATIONS,
  ELEMENT_HABIT,
  ELEMENT_LACK,
  GEUKGUK_TEXT,
  GROUP_LONG,
  MONTH_LINE,
  PILLAR_MEANING,
  RELATION_TEXT,
  SAL12_TEXT,
  SINSAL_TEXT,
  STAGE12_TEXT,
  STEM_PROFILE,
  STRENGTH_TEXT,
  TOPIC_DEEP,
} from "./dict";

/*
 * 프리미엄 10페이지 리포트. ssaju 계산 결과를 문장 사전과 규칙으로 풀어 써요.
 * AI 호출이 없어서 같은 입력이면 항상 같은 내용이고, 키가 없어도 동작해요.
 */

export interface BookContext {
  elements: ElementView[];
  pillars: PillarView[];
  hourUnknown: boolean;
  topicKey: TopicKey;
  insight: TopicInsight;
  gradeLabel: string;
}

const ELEMENT_OF_STEM: Record<string, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

function stemElementName(hanja: string): string {
  const s = STEMS.find((x) => x.hanja === hanja);
  return s ? ELEMENT_OF_STEM[s.element] : "";
}

function countGroups(r: SajuResult, hourUnknown: boolean): Record<Group, number> {
  const counts: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const pos: Array<[string | undefined, string | undefined]> = [
    [r.tenGods.year.stem, r.tenGods.year.branch],
    [r.tenGods.month.stem, r.tenGods.month.branch],
    [undefined, r.tenGods.day.branch],
  ];
  if (!hourUnknown) pos.push([r.tenGods.hour.stem, r.tenGods.hour.branch]);
  for (const [s, b] of pos) for (const g of [groupOf(s), groupOf(b)]) if (g) counts[g]++;
  return counts;
}

function groupsOf(...gods: Array<string | undefined>): Group[] {
  return gods.map(groupOf).filter((g): g is Group => g !== null);
}

export function buildBook(r: SajuResult, ctx: BookContext): BookPage[] {
  const { elements, hourUnknown, topicKey, insight } = ctx;
  const dayStem = r.dayStem;
  const profile = STEM_PROFILE[dayStem] ?? STEM_PROFILE["甲"];
  const dayEl = stemElementName(dayStem);
  const detail = STEM_DETAIL[dayStem] ?? STEM_DETAIL["甲"];
  const dayPillar = r.pillars.day;
  const counts = countGroups(r, hourUnknown);
  const dominant = GROUPS.reduce((a, b) => (counts[b] > counts[a] ? b : a), GROUPS[0]);
  const weakest = GROUPS.reduce((a, b) => (counts[b] < counts[a] ? b : a), GROUPS[0]);
  const strength = STRENGTH_TEXT[ctx.gradeLabel] ?? STRENGTH_TEXT["중화"];
  const geuk = GEUKGUK_TEXT[r.advanced.geukguk] ?? GEUKGUK_TEXT["기타"];
  const lowest = elements.reduce((a, b) => (b.count < a.count ? b : a), elements[0]);
  const highest = elements.reduce((a, b) => (b.count > a.count ? b : a), elements[0]);
  const lucky = ELEMENT_INFO[lowest.name];
  const habit = ELEMENT_HABIT[lowest.name];
  const year = r.currentYear;
  const sy = r.seyun.find((s) => s.year === year);
  const syNext = r.seyun.find((s) => s.year === year + 1);
  const cur = r.daeun.current;
  const female = r.input.gender === "여";
  const partner: Group = female ? "관성" : "재성";
  const topicGroup: Group = topicKey === "love" || topicKey === "marriage" ? partner : topicKey === "money" ? "재성" : topicKey === "success" ? "관성" : topicKey === "study" ? "인성" : dominant;
  const pages: BookPage[] = [];
  const add = (key: string, title: string, subtitle: string, lead: string, sections: BookSection[], tables: BookPage["tables"] = []) =>
    pages.push({ no: pages.length + 1, key, title, subtitle, lead, sections, tables });

  const yongsinNames = r.advanced.yongsin.map((y) => ({ stem: y, el: stemElementName(y) })).filter((y) => y.el);
  const yongsinEls = [...new Set(yongsinNames.map((y) => y.el))];

  // ── 1. 한눈에 보기
  add(
    "overview",
    "나의 사주 한눈에 보기",
    "PREMIUM REPORT · 01",
    `${dayPillar} 일주 · ${profile.image}`,
    [
      { heading: "나를 한 문장으로", body: `${profile.core.split(". ")[0]}. ${strength.head}이고, ${geuk.head.split(" · ")[1]}로 풀이돼요.` },
      {
        heading: "핵심 3줄 요약",
        body: `① 강점: ${profile.strength} ② 채우면 좋은 기운: ${lowest.name}(${lucky.color}) — ${ELEMENT_LACK[lowest.name]} ③ 지금의 계절: ${cur ? `${cur.ganzhi} 대운(${cur.startAge}~${cur.endAge}세) — ${FLOW_LINE[groupsOf(cur.stemTenGod, cur.branchTenGod)[0] ?? dominant]}` : "10년 단위의 흐름을 8쪽에서 확인해 보세요."}`,
      },
      {
        heading: "이 리포트 읽는 법",
        body: `사주는 '정해진 결과'가 아니라 '타고난 날씨와 지도'에 가까워요. 10페이지에 걸쳐 타고난 기질(1~6쪽), ${insight.label} 심층 분석(7쪽), 시간의 흐름(8~9쪽), 행운 처방(10쪽)을 차례로 풀어 드려요. 재미와 참고용으로 편하게 읽어 주세요.${hourUnknown ? " 태어난 시간을 몰라 시주(네 번째 기둥)를 빼고 계산해서, 신강·신약과 용신은 달라질 수 있어요." : ""}`,
      },
      {
        heading: `${year}년의 한 줄`,
        body: sy ? `${sy.ganzhi}년은 ${FLOW_LINE[groupsOf(sy.tenGodStem, sy.tenGodBranch)[0] ?? dominant]}` : "올해의 흐름은 9쪽에서 자세히 볼 수 있어요.",
      },
    ],
    [
      {
        title: "핵심 요약",
        rows: [
          { label: "일주", value: `${dayPillar} (${profile.image})` },
          { label: "에너지", value: `${ctx.gradeLabel} · ${r.advanced.dayStrength.score}점` },
          { label: "격국", value: r.advanced.geukguk },
          { label: "용신", value: yongsinNames.map((y) => `${y.stem}(${y.el})`).join(" · ") || "-" },
          { label: `${year}년 세운`, value: sy ? sy.ganzhi : "-" },
          { label: "지금 대운", value: cur ? `${cur.ganzhi} (${cur.startAge}~${cur.endAge}세)` : "-" },
        ],
      },
    ],
  );

  // ── 2. 명식 풀이
  const relationRows: BookSection[] = [];
  const br = r.branchRelations as unknown as Record<string, Record<string, string> | undefined>;
  for (const key of ["육합", "삼합", "반합", "방합", "충", "형", "파", "해", "원진", "귀문"]) {
    const v = br[key];
    if (v && Object.keys(v).length > 0) {
      const first = Object.values(v)[0];
      relationRows.push({ heading: `${key} · ${first}`, body: RELATION_TEXT[key] });
    }
  }
  for (const rel of r.stemRelations) {
    relationRows.push({ heading: `천간 ${rel.type} · ${rel.desc}`, body: rel.type === "합" ? "하늘의 기운이 서로 어울려 새로운 기운으로 바뀌는 흐름이에요. 협력과 조화의 힌트로 읽어요." : "하늘의 기운이 부딪히는 흐름이에요. 생각과 방향이 달라질 수 있어 대화로 맞추면 좋아요." });
  }
  add(
    "pillars",
    "나의 명식 풀이",
    "FOUR PILLARS · 02",
    `${ctx.pillars.filter((p) => p.full).map((p) => p.full).join(" ")} — 네 개의 기둥이 만드는 나의 지도예요.`,
    [
      ...(["year", "month", "day", "hour"] as const)
        .filter((k) => !(k === "hour" && hourUnknown))
        .map((k) => ({ heading: PILLAR_MEANING[k].title, body: `${PILLAR_MEANING[k].body} 이 자리의 간지는 ${r.pillars[k]}(${r.pillarDetails[k].stemKo}${r.pillarDetails[k].branchKo})예요.` })),
      ...(["year", "month", "day", "hour"] as const)
        .filter((k) => !(k === "hour" && hourUnknown))
        .map((k) => {
          const t = r.tenGods[k];
          const stemGod = k === "day" ? null : t.stem;
          const parts = [stemGod ? `천간 ${stemGod}: ${TENGOD_TEXT[stemGod] ?? ""}` : "천간은 나 자신(일간)이에요.", `지지 ${t.branch}: ${TENGOD_TEXT[t.branch] ?? ""}`];
          return { heading: `십성으로 읽는 ${PILLAR_MEANING[k].title.split(" · ")[0]}`, body: parts.join(" ") };
        }),
      ...(hourUnknown ? [{ heading: "시주는 비워 두었어요", body: "태어난 시간을 모르면 시주는 풀이하지 않아요. 시간을 알게 되면 꿈과 말년 이야기까지 더 정확히 볼 수 있어요." }] : []),
      ...(relationRows.length
        ? relationRows.slice(0, 3)
        : [{ heading: "기둥 사이의 어울림", body: "기둥들 사이에 두드러진 합·충은 보이지 않아요. 한쪽으로 크게 치우치지 않고 차분하게 흘러가는 구조예요." }]),
    ],
    [
      {
        title: "사주 원국",
        rows: ctx.pillars.map((p) => ({
          label: p.label,
          value: p.full ? `${p.full} (${p.reading})` : "시간 미상",
          note: p.full ? `${p.tenGodStem ?? ""} / ${p.tenGodBranch ?? ""}`.replace(/^ \/ /, "") : undefined,
        })),
      },
    ],
  );

  // ── 3. 타고난 기질
  add(
    "nature",
    "타고난 기질",
    "YOUR NATURE · 03",
    `${dayStem}(${STEMS.find((s) => s.hanja === dayStem)?.hangul ?? ""}) 일간 — ${profile.image}`,
    [
      { heading: "타고난 이미지", body: profile.core },
      { heading: "빛나는 강점", body: profile.strength },
      { heading: "마음 써 주면 좋은 점", body: profile.care },
      { heading: strength.head, body: `${strength.body} ${strength.advice}` },
      { heading: "연애에서의 나", body: detail.love },
      { heading: "일하는 방식", body: detail.work },
      { heading: "스트레스 신호", body: detail.stress },
      { heading: "회복하는 법", body: detail.recover },
    ],
  );

  // ── 4. 오행 균형
  add(
    "elements",
    "오행 균형",
    "FIVE ELEMENTS · 04",
    `가장 많은 기운은 ${highest.name}(${highest.count}), 가장 적은 기운은 ${lowest.name}(${lowest.count})예요.`,
    [
      { heading: `넘치는 ${highest.name} 기운`, body: ELEMENT_EXCESS[highest.name] },
      { heading: `비어 있는 ${lowest.name} 기운`, body: ELEMENT_LACK[lowest.name] },
      { heading: "균형 맞추는 생활 팁", body: `${lowest.name} 기운을 채우는 기분 전환 팁이에요. 추천 습관: ${habit.habit}. 곁에 두면 좋은 것: ${habit.item}. 행운의 색은 ${lucky.color}, 방향은 ${lucky.direction}이에요.` },
      ...elements.map((e) => ({ heading: `${ELEMENT_DOMAIN[e.name].title} — ${e.count}개`, body: ELEMENT_DOMAIN[e.name].body })),
      { heading: "오행은 '좋고 나쁨'이 아니에요", body: "많다고 나쁘고 적다고 부족한 사람이 아니라, 나의 개성이 드러나는 방식이에요. 균형을 의식하면 같은 강점도 더 부드럽게 쓸 수 있어요." },
    ],
    [{ title: "오행 분포", rows: elements.map((e) => ({ label: e.name, value: `${e.count}개`, highlight: e.name === highest.name || e.name === lowest.name, note: e.name === highest.name ? "가장 많음" : e.name === lowest.name ? "가장 적음" : undefined })) }],
  );

  // ── 5. 십성 구조
  const monthGroup = groupsOf(r.tenGods.month.stem)[0] ?? groupsOf(r.tenGods.month.branch)[0] ?? dominant;
  add(
    "tengods",
    "십성으로 보는 나의 재능",
    "TEN GODS · 05",
    `가장 두드러진 기운은 ${GROUP_LONG[dominant].name}이에요.`,
    [
      { heading: `${GROUP_LONG[dominant].name} — 나의 주력`, body: `${GROUP_LONG[dominant].talent} ${GROUP_LONG[dominant].work}` },
      { heading: "사람들과의 관계", body: `${GROUP_LONG[dominant].relation} ${GROUP_LONG[dominant].care}` },
      { heading: `사회적 얼굴 — ${GROUP_TRAIT[monthGroup]}`, body: `월주(사회·직업 자리)에 ${monthGroup} 기운이 있어서, 일터와 사회에서는 ${GROUP_TRAIT[monthGroup]}이 먼저 드러나기 쉬워요.` },
      { heading: `어울리는 분야`, body: `${GROUP_JOBS[dominant]}에서 강점이 잘 드러나요.` },
      ...GROUPS.filter((g) => g !== dominant).map((g) => ({ heading: `${GROUP_LONG[g].name} — ${counts[g]}개`, body: `${GROUP_LONG[g].talent} ${counts[g] === 0 ? GROUP_LONG[g].empty : GROUP_LONG[g].care}` })),
      { heading: `채워 가면 좋은 기운 — ${GROUP_LONG[weakest].name}`, body: GROUP_LONG[weakest].empty },
    ],
    [{ title: "십성 분포", rows: GROUPS.map((g) => ({ label: g, value: `${counts[g]}개`, note: GROUP_TRAIT[g], highlight: g === dominant })) }],
  );

  // ── 6. 격국과 용신
  const yongsinSections: BookSection[] = yongsinEls.map((el) => ({
    heading: `용신 ${el} — ${ELEMENT_INFO[el].color}`,
    body: `${el} 기운은 나의 균형을 돕는 힘이에요. 추천 습관: ${ELEMENT_HABIT[el].habit}. 분위기 아이템: ${ELEMENT_HABIT[el].item}. 행운 방향은 ${ELEMENT_INFO[el].direction}, 숫자는 ${ELEMENT_HABIT[el].number}이에요.`,
  }));
  add(
    "geukguk",
    "격국과 용신",
    "STRUCTURE & YONGSIN · 06",
    geuk.head,
    [
      { heading: "격국이 말해 주는 것", body: geuk.body },
      { heading: "신강·신약과의 조합", body: `${strength.head}에 ${r.advanced.geukguk} 구조이니, ${strength.advice}` },
      ...(yongsinSections.length ? yongsinSections : [{ heading: "용신", body: "균형을 돕는 기운은 4쪽의 오행 균형 팁을 참고해 주세요." }]),
      { heading: "잘 맞는 성장의 길", body: GEUKGUK_CAREER[r.advanced.geukguk] ?? GEUKGUK_CAREER["기타"] },
      { heading: `${ctx.gradeLabel} 사주의 인생 전략`, body: (STRATEGY[ctx.gradeLabel] ?? STRATEGY["중화"]).map((t, n) => `${["①", "②", "③"][n]} ${t}`).join(" ") },
      { heading: "용신 활용법", body: "용신은 '꼭 지켜야 할 규칙'이 아니라 '기분과 컨디션이 좋아지는 방향'이에요. 부담 없이 색, 공간, 습관 중 한 가지만 골라 가볍게 시작해 보세요." },
    ],
  );

  // ── 7. 주제 심층 분석
  const deep = TOPIC_DEEP[topicKey];
  const topicSections: BookSection[] = insight.points.map((p) => ({ heading: p.title, body: p.body }));
  for (const t of insight.timing) topicSections.push({ heading: t.title, body: t.body });
  for (const sit of TOPIC_SITUATIONS[topicKey]) topicSections.push({ heading: `상황별 가이드 · ${sit.title}`, body: sit.body });
  topicSections.push({ heading: "실천 처방", body: deep.prescription });
  topicSections.push({ heading: "줄이면 좋은 습관", body: deep.avoid });
  topicSections.push({ heading: "한 줄 마무리", body: deep.closing });
  add("topic", `${insight.label} 심층 분석`, `${insight.label.toUpperCase()} DEEP DIVE · 07`, insight.headline, topicSections);

  // ── 8. 대운 흐름
  const dl = r.daeun.list;
  const idx = cur ? dl.findIndex((d) => d.startAge === cur.startAge) : -1;
  const groupLabel = (a?: string, b?: string) => {
    const g = groupsOf(a, b);
    return g.length ? [...new Set(g)].join("·") : "-";
  };
  const daeunSections: BookSection[] = [];
  if (cur) {
    const g = groupsOf(cur.stemTenGod, cur.branchTenGod)[0] ?? dominant;
    daeunSections.push({ heading: `지금 대운 · ${cur.ganzhi} (${cur.startAge}~${cur.endAge}세)`, body: `${FLOW_LINE[g]} ${STAGE12_TEXT[cur["12unsung"]] ?? ""} ${GROUP_LONG[g].talent}` });
  }
  if (idx >= 0 && dl[idx + 1]) {
    const nx = dl[idx + 1];
    const g = groupsOf(nx.stemTenGod, nx.branchTenGod)[0] ?? dominant;
    daeunSections.push({ heading: `다음 대운 · ${nx.ganzhi} (${nx.startAge}세~)`, body: `${nx.startAge}세부터는 분위기가 달라져요. ${FLOW_LINE[g]} ${STAGE12_TEXT[nx["12unsung"]] ?? ""}` });
  }
  if (idx > 0) {
    const pv = dl[idx - 1];
    const g = groupsOf(pv.stemTenGod, pv.branchTenGod)[0] ?? dominant;
    daeunSections.push({ heading: `지난 대운 돌아보기 · ${pv.ganzhi}`, body: `${pv.startAge}~${pv.endAge}세에는 ${GROUP_LONG[g].name}이 크게 작용했어요. ${STAGE12_TEXT[pv["12unsung"]] ?? ""} 그 시기에 쌓은 경험이 지금의 바탕이 돼요.` });
  }
  for (const d of dl) {
    const g = groupsOf(d.stemTenGod, d.branchTenGod)[0] ?? dominant;
    daeunSections.push({ heading: `${d.startAge}~${d.endAge}세 · ${d.ganzhi}`, body: `${GROUP_TRAIT[g]}이 주제가 되는 시기예요. ${STAGE12_TEXT[d["12unsung"]] ?? ""}` });
  }
  daeunSections.push({ heading: "대운이란?", body: "10년 단위로 바뀌는 큰 계절이에요. 나쁜 계절은 없고, 계절마다 어울리는 옷과 할 일이 달라요. 지금 계절에 맞게 움직이는 것이 핵심이에요." });
  add(
    "daeun",
    "대운 — 10년 단위의 큰 흐름",
    "LUCK CYCLES · 08",
    cur ? `지금은 ${cur.ganzhi} 대운, ${cur.startAge}~${cur.endAge}세의 계절이에요.` : "10년 단위로 바뀌는 인생의 큰 계절을 살펴봐요.",
    daeunSections,
    [
      {
        title: "대운 타임라인",
        rows: dl.map<BookRow>((d) => ({
          label: `${d.startAge}~${d.endAge}세`,
          value: `${d.ganzhi}${d.startYear ? ` · ${d.startYear}~` : ""}`,
          note: groupLabel(d.stemTenGod, d.branchTenGod),
          highlight: cur !== null && d.startAge === cur.startAge,
        })),
      },
    ],
  );

  // ── 9. 올해·내년·월별
  const yearRows: BookRow[] = r.seyun
    .filter((s) => s.year >= year - 1 && s.year <= year + 3)
    .map((s) => ({ label: `${s.year}년`, value: s.ganzhi, note: groupLabel(s.tenGodStem, s.tenGodBranch), highlight: s.year === year }));
  const monthRows: BookRow[] = r.wolun.map((m) => {
    const gs = groupsOf(m.stemTenGod, m.branchTenGod);
    const hit = gs.includes(topicGroup);
    const solarMonth = (m.month % 12) + 1;
    return { label: `${solarMonth}월경 · ${m.ganzhi}`, value: gs[0] ? MONTH_LINE[gs[0]] : "-", note: hit ? `${insight.label} 포인트` : undefined, highlight: hit };
  });
  const hitMonths = r.wolun.filter((m) => groupsOf(m.stemTenGod, m.branchTenGod).includes(topicGroup)).map((m) => `${(m.month % 12) + 1}월경`);
  const yearSections: BookSection[] = [];
  if (sy) {
    const g = groupsOf(sy.tenGodStem, sy.tenGodBranch)[0] ?? dominant;
    yearSections.push({ heading: `${year}년 · ${sy.ganzhi}`, body: `${FLOW_LINE[g]} ${STAGE12_TEXT[sy.stage12] ?? ""} ${cur ? `${cur.ganzhi} 대운 속의 한 해로 읽어요.` : ""}` });
  }
  if (syNext) {
    const g = groupsOf(syNext.tenGodStem, syNext.tenGodBranch)[0] ?? dominant;
    yearSections.push({ heading: `${year + 1}년 · ${syNext.ganzhi}`, body: `${FLOW_LINE[g]} ${STAGE12_TEXT[syNext.stage12] ?? ""} 올해 준비한 것이 내년에 모양을 갖추기 좋아요.` });
  }
  const prevY = r.seyun.find((x) => x.year === year - 1);
  if (prevY) {
    const g = groupsOf(prevY.tenGodStem, prevY.tenGodBranch)[0] ?? dominant;
    yearSections.push({ heading: `${year - 1}년 돌아보기 · ${prevY.ganzhi}`, body: `${GROUP_LONG[g].name}이 주제였던 해예요. ${STAGE12_TEXT[prevY.stage12] ?? ""} 지난해의 경험이 올해의 밑거름이 돼요.` });
  }
  for (const off of [2, 3]) {
    const f = r.seyun.find((x) => x.year === year + off);
    if (!f) continue;
    const g = groupsOf(f.tenGodStem, f.tenGodBranch)[0] ?? dominant;
    yearSections.push({ heading: `${year + off}년 미리 보기 · ${f.ganzhi}`, body: `${GROUP_LONG[g].name}이 주제가 되는 해예요. ${STAGE12_TEXT[f.stage12] ?? ""}` });
  }
  const quarters = [
    [0, 3, "2~4월경"],
    [3, 6, "5~7월경"],
    [6, 9, "8~10월경"],
    [9, 12, "11~1월경"],
  ] as const;
  quarters.forEach(([a, b, label], q) => {
    const part = r.wolun.slice(a, b);
    const tally: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
    for (const m of part) for (const gg of groupsOf(m.stemTenGod, m.branchTenGod)) tally[gg]++;
    const top = GROUPS.reduce((x, y) => (tally[y] > tally[x] ? y : x), GROUPS[0]);
    yearSections.push({ heading: `${q + 1}분기 (${label}) · ${GROUP_LONG[top].name}`, body: QUARTER_TEXT[top] });
  });
  yearSections.push({
    heading: `${insight.label} 포인트 달`,
    body: hitMonths.length ? `${hitMonths.join(", ")}에 ${insight.label}과 닿는 기운이 들어와요. 이 시기에 중요한 계획이나 만남, 결정을 배치해 보세요.` : `올해는 특정 달에 쏠리기보다 꾸준히 이어지는 흐름이에요. 매달 작은 실천을 쌓아 가면 좋아요.`,
  });
  yearSections.push({ heading: "월별 흐름 읽는 법", body: "월별 간지는 절기 기준이라 양력 날짜와 며칠 차이가 있을 수 있어요(표의 '○월경'). 참고용 힌트로 가볍게 활용해 주세요." });
  add("years", `${year}년 · ${year + 1}년과 월별 흐름`, "THIS YEAR & MONTHS · 09", `${year}년은 ${sy?.ganzhi ?? ""} 해예요.`, yearSections, [
    { title: "연도별 흐름", rows: yearRows },
    { title: `${year}년 월별 흐름`, rows: monthRows },
  ]);

  // ── 10. 신살과 행운 처방전
  const gil = r.advanced.sinsal.gilsin;
  const hyung = r.advanced.sinsal.hyungsin;
  const specials = new Set<string>();
  for (const k of ["year", "month", "day", "hour"] as const) {
    if (k === "hour" && hourUnknown) continue;
    for (const s of r.sals[k].specialSals) specials.add(s);
  }
  const sinSections: BookSection[] = [];
  for (const g of gil) sinSections.push({ heading: `길한 기운 · ${g}`, body: SINSAL_TEXT[g] ?? "나를 돕는 좋은 기운이에요." });
  for (const s of specials) if (!gil.includes(s) && SINSAL_TEXT[s]) sinSections.push({ heading: `특별한 기운 · ${s}`, body: SINSAL_TEXT[s] });
  for (const h of hyung) sinSections.push({ heading: `알아 두면 좋은 기운 · ${h}`, body: SINSAL_TEXT[h] ?? "속도를 조절하면 오히려 힘이 되는 기운이에요." });
  if (sinSections.length === 0) sinSections.push({ heading: "신살", body: "두드러진 신살은 없어요. 특정 기운에 휘둘리지 않고 안정적으로 흘러가는 구조예요." });
  const dayTwelve = r.sals.day.twelveSal;
  if (SAL12_TEXT[dayTwelve]) sinSections.push({ heading: `일주의 12신살 · ${dayTwelve}`, body: `나 자신의 자리에 ${SAL12_TEXT[dayTwelve]}의 기운이 있어요.` });
  for (const k of ["year", "month", "hour"] as const) {
    if (k === "hour" && hourUnknown) continue;
    const t = r.sals[k].twelveSal;
    if (SAL12_TEXT[t]) sinSections.push({ heading: `${PILLAR_MEANING[k].title.split(" · ")[0]}의 12신살 · ${t}`, body: `${PILLAR_MEANING[k].title.split(" · ")[1]} 자리에 ${SAL12_TEXT[t]}의 기운이 있어요.` });
  }
  const gen = ELEMENT_GENERATES[dayEl];
  if (gen) {
    sinSections.push({ heading: "잘 맞는 사람의 결", body: `${gen.good}.` });
    sinSections.push({ heading: "서로 맞춰 가면 좋은 결", body: `${gen.note}.` });
  }
  sinSections.push({
    heading: "한 달 행운 처방전",
    body: `① ${lucky.color} 포인트 아이템 하나 곁에 두기 ② 추천 습관(${habit.habit}) 주 3회 ③ ${lucky.direction} 방향으로 산책하거나 자리를 잡아 보기 ④ 하루 한 줄 감사 기록 ⑤ 일요일 밤, 다음 주 우선순위 세 가지 적기.`,
  });
  sinSections.push({ heading: "마무리 편지", body: `${insight.quote.replace(" ✦", "")}. 사주는 정해진 답이 아니라 나를 이해하는 따뜻한 거울이에요. 이 리포트에서 마음에 닿은 한 문장만 오늘 하루에 가져가 보세요.` });
  add("lucky", "신살과 행운 처방전", "LUCKY GUIDE · 10", `행운의 색은 ${lucky.color}, 방향은 ${lucky.direction}이에요.`, sinSections, [
    {
      title: "나의 행운 가이드",
      rows: [
        { label: "행운 컬러", value: lucky.color },
        { label: "행운 방향", value: lucky.direction },
        { label: "행운 숫자", value: habit.number },
        { label: "행운 아이템", value: habit.item },
        { label: "추천 습관", value: habit.habit },
      ],
    },
  ]);

  return pages;
}
