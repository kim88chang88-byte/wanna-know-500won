import { analyzeChart } from "@/lib/saju/analysis";
import { concernLabel, hasConcern, type Concern } from "@/lib/concerns";
import type { SajuChart } from "@/lib/saju/types";
import type { CoreFacts } from "./coreFacts";
import { TOPIC_LABEL, type ReadingTopic } from "./reading";

/*
 * "공통 진단": 긴 풀이는 AI 가 네 번에 나눠 동시에 써서, 장끼리 서로를 몰라요.
 * 그래서 어떤 장은 "충동 소비가 잦다"고 하고 다른 장은 "지갑을 단단히 지킨다"고 말하는 일이 생겼어요.
 * 사주 계산값(신강/신약·많은/적은 오행)으로 코드가 먼저 진단 한 벌을 정해서 네 번의 호출에 똑같이 넘겨요.
 * (해석 문구는 재홍이 검토할 부분이에요. 해석을 바꾸려면 아래 GRADE 표만 고치면 돼요.)
 */

type Grade = "strong" | "weak" | "neutral";

interface Take {
  /** 이 사람의 기본 결 */
  nature: string;
  strength: string;
  weakness: string;
  direction: string;
}

type Chapter = "elements" | "self" | "praise" | "lack" | "flow" | "improve" | "lucky" | "story";

/** 같은 진단을 글마다 다른 말결로 쓰게 하는 표현. 일곱 글이 같은 낱말을 되풀이하지 않게 해요. (뜻은 진단과 같아야 해요) */
const VOICE: Record<Grade, Record<Chapter, string>> = {
  strong: {
    elements: "기운이 한쪽으로 크게 쏠려 있는 구조",
    self: "결정이 빠르고 몸이 먼저 움직이는 편",
    praise: "시작하면 끝을 보는 뚝심, 곁에서 기대게 되는 중심감",
    lack: "다음 일로 눈이 먼저 가서 앞 일의 매듭이 느슨해지기 쉬움",
    flow: "의욕이 앞서는 때일수록 일정에 빈 칸을 두는 게 잘 맞는다는 것",
    improve: "벌이는 속도와 마무리 속도를 맞춰 주는 작은 장치",
    lucky: "쉬는 시간을 일부러 끼워 넣는 생활 리듬",
    story: "달릴 힘은 충분하니 숨 고르는 칸 하나만 더",
  },
  weak: {
    elements: "주변 기운에 맞춰 모양이 바뀌는 구조",
    self: "사람과 분위기를 먼저 살피고 움직이는 편",
    praise: "상대 마음을 알아채는 눈, 꼼꼼히 챙기는 손길",
    lack: "확신이 서기 전까지 결정을 미루다 흐름을 놓치기 쉬움",
    flow: "남의 속도에 휩쓸리기 쉬운 때일수록 내 기준을 먼저 세우는 게 잘 맞는다는 것",
    improve: "내 기준 한 가지를 눈에 보이게 적어 두는 작은 장치",
    lucky: "내 힘을 북돋우는 편안한 생활 리듬",
    story: "섬세함은 이미 충분하니 내 기준 하나만 더",
  },
  neutral: {
    elements: "여러 기운이 고르게 섞여 있는 구조",
    self: "상황에 맞춰 중심을 옮기는 편",
    praise: "어디서든 균형을 잡아 주는 감각",
    lack: "무난하다 보니 이번에 집중할 한 가지를 못 정하고 흘려보내기 쉬움",
    flow: "흐름이 평탄한 때일수록 이번에 집중할 한 가지를 정하는 게 잘 맞는다는 것",
    improve: "한 번에 한 가지만 정해 두는 작은 장치",
    lucky: "하루 중 나만의 기준 시간을 만드는 생활 리듬",
    story: "균형은 이미 충분하니 집중할 한 가지만 더",
  },
};

const GRADE: Record<Grade, Take> = {
  strong: {
    nature: "스스로 중심을 잡고 밀고 나가는 힘이 센 결",
    strength: "마음먹으면 끝까지 밀고 가는 힘, 주변을 이끄는 기운",
    weakness: "마음이 앞서서 속도 조절과 마무리가 흐트러지기 쉬움",
    direction: "한 박자 쉬었다 가는 작은 습관을 만들기",
  },
  weak: {
    nature: "주변을 살피고 영향을 잘 받는 섬세한 결",
    strength: "주변을 세심하게 살피는 마음, 꼼꼼함",
    weakness: "확신이 약해서 결정을 미루거나 남의 흐름에 휩쓸리기 쉬움",
    direction: "내 기준 한 가지를 정해 두는 습관 만들기",
  },
  neutral: {
    nature: "균형이 잡혀 무난하게 흘러가는 결",
    strength: "상황에 맞춰 중심을 잡는 균형 감각",
    weakness: "무난해서 이번에 집중할 한 가지를 못 정하고 흘려보내기 쉬움",
    direction: "이번 달 집중할 한 가지만 정해 두기",
  },
};

/** 재물운: 같은 신강/신약이어도 돈에서 어떻게 나타나는지로 진단을 좁혀요. */
const MONEY: Record<Grade, Partial<Take>> = {
  strong: { strength: "필요한 곳에는 통 크게 쓰고 사람을 챙기는 마음", weakness: "기분이나 마음이 급할 때 지출이 늘기 쉬움", direction: "쓰기 전에 하루 묵히는 규칙 하나 만들기" },
  weak: { strength: "돈을 알뜰히 살피려는 신중한 마음", weakness: "불안하거나 주변에 영향을 받아 결정을 미루고 흔들리기 쉬움", direction: "내 기준(쓸 곳·모을 곳) 한 가지를 정해 두기" },
  neutral: { strength: "무리 없이 관리하는 균형 감각", weakness: "목표가 흐릿하면 돈이 어디로 가는지 놓치기 쉬움", direction: "이번 달 모을 금액이 아닌 '모을 이유' 한 줄 정하기" },
};

const CHAPTER_NAME: Record<Chapter, string> = { elements: "오행 글", self: "나 글", praise: "칭찬 글", lack: "아쉬움 글", flow: "흐름 글", improve: "개선 글", lucky: "행운 처방 글", story: "요약하자면" };

const SPENDING_IDS = new Set(["spending"]);

const KO = { wood: "목", fire: "화", earth: "토", metal: "쇠", water: "수" } as const;

function gradeOf(core: CoreFacts | null | undefined): Grade {
  const s = core?.신강신약 ?? "";
  return s.startsWith("신강") ? "strong" : s.startsWith("신약") ? "weak" : "neutral";
}

/** 모든 호출에 똑같이 붙는 공통 진단 글. 풀이를 못 만들 때는 빈 문자열. */
export function detailAnchor(chart: SajuChart, topic: ReadingTopic, core: CoreFacts | null | undefined, concern?: Concern | null): string {
  const grade = gradeOf(core);
  let take: Take = { ...GRADE[grade] };
  if (topic === "money") take = { ...take, ...MONEY[grade] };
  // 새는 돈이 고민인 사람에게 "이미 잘 지키고 있다"고 말하지 않게, 진단의 아쉬운 점을 고민에 맞춰요.
  const hasSpending = hasConcern(concern) && concern.tags.some((t) => SPENDING_IDS.has(t));
  if (hasSpending) {
    take.weakness = "마음이 급하거나 지칠 때 지출이 늘기 쉬움";
    take.strength = grade === "weak" ? "돈을 알뜰히 살피려는 마음 자체" : "필요한 곳에 아낌없이 쓰는 통 큰 마음";
    take.direction = "쓰기 전에 하루 묵히는 규칙 하나, 기분 때문에 쓴 것 표시하기";
  }
  const voice = VOICE[grade];
  const f = analyzeChart(chart);
  const entries = (Object.entries(f.elementCounts) as Array<[keyof typeof KO, number]>).sort((a, b) => b[1] - a[1]);
  const most = entries.filter(([, n]) => n === entries[0][1]).map(([k]) => KO[k]);
  const least = [...entries].reverse().filter(([, n]) => n === entries[entries.length - 1][1]).map(([k]) => KO[k]);
  const concernLine = hasConcern(concern) && concern.tags.length ? `\n- 고민: ${concern.tags.map(concernLabel).join(", ")}. 진단의 '아쉬운 점'과 이어서 다루고, 이 고민을 칭찬이나 "이미 잘하고 있다"로 뒤집지 마.` : "";
  return [
    `[공통 진단 — ${TOPIC_LABEL[topic]} 일곱 글과 요약하자면은 모두 이 진단을 그대로 따라야 해. 글마다 다른 성격을 말하거나 서로 반대로 말하면 안 돼.]`,
    `- 기본 결: ${take.nature}`,
    `- 강점(칭찬 글과 요약에서만 크게 다뤄): ${take.strength}`,
    `- 아쉬운 점(아쉬움·개선 글에서 다뤄): ${take.weakness}`,
    `- 방향(개선 글이 구체적으로, 요약은 한 줄로만): ${take.direction}`,
    `- 많은 기운: ${most.join("·")}, 적은 기운: ${least.join("·")} (이 사실만 쓰고 바꾸지 마)${concernLine}`,
    `[장별 표현 — 위 진단과 같은 뜻을, 글마다 이 결로 말해. 아래는 메모 형태의 낱말구라서 문장 끝("~음", "~것")을 그대로 붙여 쓰지 말고, "~야", "~해", "~거든" 같은 자연스러운 반말 문장으로 풀어서 써. 위 진단의 낱말구를 그대로 옮기지 마. 지정되지 않은 글에는 쓰지 마]`,
    ...(Object.keys(voice) as Chapter[]).map((k) => `- ${CHAPTER_NAME[k]}: ${voice[k]}`),
  ].join("\n");
}
