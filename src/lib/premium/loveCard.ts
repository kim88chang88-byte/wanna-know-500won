import type { Element5 } from "@/lib/ai/image";
import { STEMS } from "@/lib/saju/constants";
import type { PosKey } from "./book/insight";
import { buildMonthTimeline } from "./book/timeline";

/*
 * 연애운의 "미래 운명의 짝" 카드: 유형명 · 내 사주와의 연결 근거 · 만날 시기와 장소.
 * 모두 규칙으로만 만들어요(AI 호출 없음, 같은 입력이면 같은 결과). 재미로 읽는 상상이라 단정하지 않아요.
 */
export interface PartnerCardView {
  /** "맑고 다정한 사슴상" */
  typeName: string;
  /** 내 사주와 이 짝이 이어지는 이유 한두 문장 */
  link: string;
  /** "2027년 5월경" */
  when: string;
  /** 시기 한 줄 해설 */
  whenNote: string;
  /** 처음 만나기 쉬운 곳 */
  where: string;
}

const TYPES: Record<Element5, string[]> = {
  wood: ["맑고 다정한 사슴상", "싱그럽고 반듯한 강아지상", "시원하게 웃는 토끼상"],
  fire: ["표정이 환한 여우상", "눈빛이 따뜻한 햇살 고양이상", "웃음이 크고 반짝이는 다람쥐상"],
  earth: ["듬직하고 푸근한 곰상", "차분하고 믿음직한 강아지상", "느긋하고 다정한 곰돌이상"],
  metal: ["단정하고 도도한 고양이상", "깔끔하고 또렷한 여우상", "선이 곱고 반듯한 학상"],
  water: ["깊고 조용한 수달상", "눈매가 촉촉한 사슴상", "잔잔하게 웃는 물고기상"],
};
const EL_KO: Record<Element5, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
const CYCLE: Element5[] = ["wood", "fire", "earth", "metal", "water"];

/** 내 일간 오행(a) 기준으로 짝의 오행(b)이 어떤 관계인지 한 문장 */
function relation(a: Element5, b: Element5): string {
  if (a === b) return "서로 결이 닮아서 같이 있으면 말이 잘 통하고 편안한 쪽이야.";
  const d = (CYCLE.indexOf(b) - CYCLE.indexOf(a) + 5) % 5;
  if (d === 1) return "내가 먼저 챙겨 주면 그 마음이 키워져서 함께 자라는 쪽이야.";
  if (d === 4) return "지친 나를 받쳐 주고 힘을 보태 주는 쪽이야.";
  if (d === 2) return "내가 앞에서 길을 터 주고 이끌게 되는 쪽이야.";
  return "나를 단단하게 잡아 주고 균형을 맞춰 주는 쪽이야.";
}

export function partnerCard(o: {
  element: Element5;
  seed: number;
  dayStem: string;
  pillars: Array<{ key: string; full: string | null }>;
  profile: Array<{ label: string; tags: string[] }>;
  now: Date;
}): PartnerCardView {
  const names = TYPES[o.element];
  const typeName = names[Math.abs(Math.floor(o.seed)) % names.length];
  const me = (STEMS.find((s) => s.hanja === o.dayStem)?.element ?? "wood") as Element5;
  const link = `네 일간은 ${EL_KO[me]} 기운이고, 사주에서 힘이 되어 주는 건 ${EL_KO[o.element]} 기운이야. 그래서 ${EL_KO[o.element]} 기운을 닮은 사람이 ${relation(me, o.element)}`;

  const natal: Partial<Record<PosKey, string>> = {};
  for (const p of o.pillars) if ((p.key === "year" || p.key === "month" || p.key === "day" || p.key === "hour") && p.full) natal[p.key as PosKey] = p.full;
  const plans = buildMonthTimeline({ natal, dayStem: o.dayStem, yongsinEls: [EL_KO[o.element]], now: o.now, count: 12 });
  const hit = plans.find((p) => p.yongsinIn.length > 0) ?? [...plans].sort((a, b) => b.score - a.score)[0];
  const when = hit ? `${hit.year}년 ${hit.month}월경` : "올해와 내년 사이";
  const whenNote = hit && hit.yongsinIn.length > 0 ? `${EL_KO[o.element]} 기운이 월운으로 들어오는 무렵이라 마음의 문이 열리기 좋아. 꼭 이때 만난다는 뜻은 아니고, 새로운 자리에 나가 볼 만한 흐름이야.` : "흐름이 비교적 편안한 무렵이라 새로운 만남에 마음을 열어 보기 좋아. 확정이 아니라 참고용이야.";
  const where = o.profile.find((r) => r.label === "처음 만나는 곳")?.tags.slice(0, 2).join(" · ") ?? "";
  return { typeName, link, when, whenNote, where };
}
