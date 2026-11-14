import type { SajuResult } from "ssaju";
import { CONCERN_CHIPS, cleanConcernText, concernLabel, hasConcern, type Concern } from "@/lib/concerns";
import { STEMS } from "@/lib/saju/constants";
import { DAYMASTER_BRIEF } from "@/lib/mbtiBrief";
import { CONCERN_BODY } from "../concernAnswer";
import { GROUPS, groupOf, type Group } from "../topic";
import type { BookPage, BookSection, ElementView } from "../types";
import { GROUP_LONG } from "./dict";
import { nowDaeunTrait, nowStageName } from "./lifeFlow";

/*
 * 이용자가 처음에 적은 "요즘 고민"을 모든 장에 자연스럽게 이어 붙여요. (규칙 기반, AI 호출 없음)
 * 장마다 '그 장의 눈으로 본 이 고민' 한 토막을 둘째 자리에 끼워요: 왜 이런 고민이 드는지 → 이 장의 근거로 본 연결 → 작게 해 볼 일.
 * 직접 적은 글은 해석하지 않고 그대로 되돌려 보여 주기만 해요. 단정하거나 겁주는 표현은 쓰지 않아요.
 */

const TOPIC_NOUN: Record<string, string> = {
  love: "마음을 주고받는 방식",
  marriage: "관계를 오래 이어 가는 방식",
  money: "돈을 다루는 방식",
  success: "일에서 힘을 쓰는 방식",
  health: "몸과 마음을 돌보는 방식",
  study: "계획을 이어 가는 힘",
  general: "사람과 일을 대하는 방식",
};
const CHAPTER_TOPIC: Record<string, string> = { "topic:money": "money", "topic:love": "love", "topic:career": "success", "topic:health": "health" };
const CHAPTER_NOUN: Record<string, string> = { "topic:money": "재물", "topic:love": "연애와 인연", "topic:career": "일과 직업", "topic:health": "몸과 마음의 컨디션" };

const WEAVE_KEYS = ["pillars", "nature", "elements", "tengods", "stage12", "sinsal", "gui", "topic:money", "topic:love", "topic:career", "topic:health", "geukguk", "daeun", "years", "years:2", "lucky"];

function dominantGroup(r: SajuResult, hourUnknown: boolean): Group {
  const counts: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  for (const k of ["year", "month", "day", "hour"] as const) {
    if (k === "hour" && hourUnknown) continue;
    const gods = [k === "day" ? undefined : r.tenGods[k].stem, r.tenGods[k].branch];
    for (const g of gods) {
      const grp = groupOf(g);
      if (grp) counts[grp]++;
    }
  }
  return GROUPS.reduce((a, b) => (counts[b] > counts[a] ? b : a), GROUPS[0]);
}

interface Data {
  noun: string;
  dayBrief: string;
  lowest: string;
  dominant: string;
  stage: string | null;
  trait: string | null;
  gil: string | null;
  yong: string | null;
}

function angle(key: string, d: Data, topic: string): string {
  const n = d.noun;
  switch (key) {
    case "pillars":
      return `네 기둥 가운데 일지(가까운 관계 자리)와 월지(사회 자리)가 ${n}과 가장 가깝게 닿아 있어. 이 고민은 타고난 자리의 모양과 이어서 읽으면 이해가 쉬워져.`;
    case "nature":
      return `일간으로 본 너는 ${d.dayBrief}. 이 결이 ${n}에서도 그대로 드러나서 지금의 고민이 생기기 쉬워. 고민은 약점이 아니라 너의 결이 지금 상황을 만난 모습이야.`;
    case "elements":
      return `네 오행에서 가장 적은 기운은 ${d.lowest}이야. 이 기운을 생활에서 조금 채워 주면 ${n}이 한결 편해지는 방향으로 읽어 봐.`;
    case "tengods":
      return `가장 두드러진 십성은 ${d.dominant}이야. 이 힘을 ${n}에 알맞게 쓰면 강점이 되고, 한쪽으로 쏠리면 지금 같은 고민으로 느껴질 수 있어.`;
    case "stage12":
      return `${d.stage ? `지금 네 시기는 ‘${d.stage}’이야. ` : ""}고민이 깊은 건 이 시기의 속도와 ${n}이 만나는 지점이라서일 수 있어. 시기를 알면 서두를 때와 기다릴 때를 고르기 쉬워.`;
    case "sinsal":
      return d.gil ? `네 사주의 ${d.gil} 같은 기운은 ${n}에서 힘이 되는 쪽으로 쓸 수 있어. 이름이 거칠어도 쓰는 방식이 중요하니, 이 고민 앞에서는 장점으로 꺼내 쓰는 쪽으로 읽어 줘.` : `두드러진 신살이 없다는 건 한쪽으로 크게 휘둘리지 않는 안정된 구조라는 뜻이야. ${n}도 차분하게 나만의 속도로 풀어 가도 좋아.`;
    case "gui":
      return `고민이 있을 때는 혼자 끌어안기 쉬운데, 귀인은 ${n} 같은 일에서 조언이나 소개로 찾아와. 이 고민을 털어놓을 한 사람을 먼저 떠올려 봐.`;
    case "geukguk":
      return `네 사주의 큰 틀(격국)과 용신${d.yong ? `(${d.yong})` : ""}은 ${n}에서 ‘어떤 방식이 나에게 편한가’의 기준이 돼. 이 기운을 곁에 두면 고민 속에서도 마음이 한결 가벼워질 수 있어.`;
    case "daeun":
      return `대운은 이 고민이 ‘지금 계절의 일’인지를 보는 틀이야. ${d.trait ? `지금은 ${d.trait}이(가) 주제가 되는 시기라서 ` : ""}${n}에서 이 힘이 눈에 띄게 떠오르는 거야. 계절이 바뀌면 같은 고민도 모양이 달라져.`;
    case "years":
      return `올해 세운은 이 고민에 올해의 날씨를 알려 줘. 서두를 때와 쉬어 갈 때를 골라 ${n}의 계획에 얹어 보면 부담이 줄어.`;
    case "years:2":
      return `달별 흐름은 ${n}의 계획표로 쓰기 좋아. 힘이 붙는 달에 시작할 일 하나, 쉬어 가는 달에 정리할 일 하나를 정해 봐.`;
    case "lucky":
      return `행운 처방은 고민을 풀어 주는 작은 습관이야. ${n}에 가장 가까운 것 하나만 골라 이번 주에 시작해 봐.`;
    default: {
      const own = CHAPTER_TOPIC[key];
      const cn = CHAPTER_NOUN[key] ?? "이 주제";
      return own === topic
        ? `이 장이 바로 네 고민의 중심이야. 아래 풀이 중 마음에 걸리는 곳부터 먼저 읽어 줘.`
        : `이 장은 ${cn} 이야기지만, ${n}과도 이어져 있어서 함께 보면 고민을 입체적으로 이해할 수 있어.`;
    }
  }
}

/** 이 사람의 고민(칩·직접 쓴 글)을 모든 장에 이어 붙여요. 고민이 없으면 그대로 돌려줘요. */
export function weaveConcern(pages: BookPage[], r: SajuResult, ctx: { elements: ElementView[]; hourUnknown: boolean; concern?: Concern | null }): BookPage[] {
  const c = ctx.concern;
  if (!hasConcern(c)) return pages;
  const chip = c.tags.length > 0 ? CONCERN_CHIPS.find((x) => x.id === c.tags[0]) : undefined;
  const topic = chip?.topic ?? "general";
  const text = cleanConcernText(c.text ?? "");
  const labels = c.tags.map(concernLabel);
  const quote = [labels[0] ? `‘${labels[0]}’` : "", text ? `네가 적어 준 “${text.length > 60 ? `${text.slice(0, 60)}…` : text}”` : ""].filter(Boolean).join(", 그리고 ");
  const more = labels.length > 1 ? ` (함께 고른 고민: ${labels.slice(1).join(", ")})` : "";
  const body = chip ? CONCERN_BODY[chip.id] : null;
  const why = body?.lead ?? "고민은 말로 꺼내 놓는 것만으로도 조금 가벼워져. 지금의 마음을 사주의 흐름과 나란히 놓고 천천히 읽어 보자.";
  const tip = body?.tip ?? "이번 주에는 이 고민을 한 줄로 적고, 오늘 할 수 있는 가장 작은 행동 하나만 골라 봐.";
  const stem = STEMS.find((s) => s.hanja === r.dayStem);
  const lowest = ctx.elements.length ? ctx.elements.reduce((a, b) => (b.count < a.count ? b : a)).name : "";
  const yongEl = r.advanced.yongsin.map((y) => STEMS.find((s) => s.hanja === y)?.element).map((e) => ({ wood: "목", fire: "화", earth: "토", metal: "금", water: "수" } as Record<string, string>)[e ?? ""]).find(Boolean) ?? null;
  const data: Data = {
    noun: TOPIC_NOUN[topic] ?? TOPIC_NOUN.general,
    dayBrief: stem ? DAYMASTER_BRIEF[stem.element] : "자기만의 결이 또렷한 사람이야",
    lowest: lowest || "비어 있는",
    dominant: GROUP_LONG[dominantGroup(r, ctx.hourUnknown)].name,
    stage: nowStageName(r),
    trait: nowDaeunTrait(r),
    gil: r.advanced.sinsal.gilsin[0] ?? null,
    yong: yongEl,
  };
  return pages.map((p) => {
    if (!WEAVE_KEYS.includes(p.key) || p.sections.length === 0) return p;
    const sec: BookSection = {
      heading: "네 고민과 이어 보면",
      body: `${quote}${more} — 이 고민을 마음에 두고 이 장을 읽어 줘.\n\n${why}\n\n${angle(p.key, data, topic)}\n\n${tip}`,
    };
    return { ...p, sections: [p.sections[0], sec, ...p.sections.slice(1)] };
  });
}
