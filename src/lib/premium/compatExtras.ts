import { BRANCHES, STEMS } from "@/lib/saju/constants";
import { branchRelation } from "@/lib/ai/dailyFacts";
import { ELEMENT_INFO } from "./topic";
import type { CompatLink, CompatScore, CompatTip, ElementView } from "./types";

/*
 * 궁합 결과에 덧붙이는 계산 재료: 항목별 점수, 자리별 만남(합·충), 상대 성향, 실용 팁, 올해·내년 흐름.
 * 모두 표와 산술로 만들고, 겁주는 표현은 쓰지 않아요.
 */

export type CompatRelation = "연인" | "썸" | "결혼" | "친구";

/** 고른 고민에서 관계 종류를 읽어요. (이별 같은 민감한 고민은 관계를 정하지 않고 기본 풀이로 가요) */
export function relationFromConcern(tags: readonly string[] | undefined): CompatRelation | null {
  if (!tags) return null;
  if (tags.includes("partner") || tags.includes("marriage")) return "결혼";
  if (tags.includes("relationship")) return "연인";
  if (tags.includes("crush") || tags.includes("doubt")) return "썸";
  if (tags.includes("friends")) return "친구";
  return null;
}

const RELATION_TIP: Record<CompatRelation, string> = {
  연인: "연인 사이에서는 작은 표현이 크게 남아요. 하루에 한 번, 오늘 고마웠던 점을 말로 건네 보세요.",
  썸: "아직 알아 가는 단계라면 서두르지 말고, 가볍게 자주 만나며 서로의 리듬을 살펴보세요. 부담 없는 안부가 가장 좋은 신호예요.",
  결혼: "오래 함께한다는 마음으로 볼 땐 큰 약속보다 일상의 작은 약속이 중요해요. 돈·집안·생활 습관은 편안한 때에 미리 나눠 보세요.",
  친구: "친구 사이에서는 서로의 거리를 존중하는 게 오래가는 비결이에요. 각자의 시간을 인정하고, 만났을 땐 온전히 집중해 보세요.",
};

const TRAIT: Record<string, string> = {
  甲: "곧고 책임감 있는 큰 나무 같은 사람이에요. 한결같고, 관계에서 방향을 잡아 주려는 편이에요.",
  乙: "부드럽고 적응력 좋은 풀꽃 같은 사람이에요. 상대에게 맞춰 주며 섬세하게 챙겨요.",
  丙: "밝고 따뜻한 태양 같은 사람이에요. 표현이 솔직하고 분위기를 환하게 만들어요.",
  丁: "은은하고 다정한 촛불 같은 사람이에요. 마음이 깊고 한 사람에게 정성을 다해요.",
  戊: "듬직하고 믿음직한 큰 산 같은 사람이에요. 말수는 적어도 약속은 꼭 지켜요.",
  己: "포근하고 세심한 논밭 같은 사람이에요. 곁에서 조용히 챙겨 주는 스타일이에요.",
  庚: "의리 있고 결단력 있는 쇠 같은 사람이에요. 직설적이지만 마음은 뜨거워요.",
  辛: "섬세하고 깔끔한 보석 같은 사람이에요. 취향이 분명하고 존중받을 때 마음을 열어요.",
  壬: "넓고 자유로운 큰 강물 같은 사람이에요. 생각이 깊고 자유로움을 소중히 여겨요.",
  癸: "촉촉하고 감성적인 이슬비 같은 사람이에요. 공감 능력이 좋고 마음을 잘 알아줘요.",
};

const TALK: Record<string, string> = {
  wood: "칭찬과 응원을 먼저 건네고 나서 부탁이나 의견을 말하면 잘 통해요.",
  fire: "감정을 알아주는 맞장구가 최고의 대화법이에요. 표정과 말투를 밝게 해 보세요.",
  earth: "천천히, 차분하게 이야기하고 마지막에 확답을 주면 믿음이 쌓여요.",
  metal: "돌려 말하기보다 핵심을 짧고 분명하게 말해 보세요. 약속 시간처럼 작은 것도 정확하게요.",
  water: "충분히 들어 주고 질문으로 시작하면 마음이 열려요. 생각할 시간을 조금 주세요.",
};

const ACTIVITY: Record<string, string> = {
  목: "숲길 산책, 식물 가꾸기, 새로운 걸 같이 배우는 시간",
  화: "함께 요리하기, 공연이나 영화, 따뜻한 조명의 카페",
  토: "도자기·베이킹 같은 손작업, 집에서 보내는 느긋한 하루",
  금: "전시회나 음악 감상, 깔끔하게 정돈된 공간에서의 데이트",
  수: "바다·호수·온천 같은 물가 나들이",
};

const ELEMENT_KEY: Record<string, string> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };
const SHENG = ["목", "화", "토", "금", "수"];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const noteFor = (s: number) => (s >= 85 ? "아주 잘 맞아요" : s >= 75 ? "잘 맞아요" : s >= 65 ? "무난해요" : "맞춰 가면 좋아요");

type Rel = "합" | "충" | "해" | null;

export interface ExtrasInput {
  meStem: string;
  otStem: string;
  meDayBranch: string;
  otDayBranch: string;
  /** 연·월·일·시 중 연·월·일의 간지 두 글자 */
  me: { year: string; month: string; day: string };
  other: { year: string; month: string; day: string };
  combine: boolean;
  clash: boolean;
  godGood: boolean;
  godBackGood: boolean;
  meElements: ElementView[];
  otElements: ElementView[];
  filled: boolean;
  /** 서양력 연도 (올해·내년 흐름에 써요) */
  year: number | null;
  relation: CompatRelation | null;
}

const rel3 = (a: string, b: string): Rel => branchRelation(a, b) as Rel;
const branchOf = (p: string) => p.charAt(1);
const elOfStem = (h: string) => STEMS.find((s) => s.hanja === h)?.element ?? "wood";
const KO_OF: Record<string, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

export function buildExtras(x: ExtrasInput) {
  const dayRel = rel3(x.meDayBranch, x.otDayBranch);
  const monthRel = rel3(branchOf(x.me.month), branchOf(x.other.month));
  const yearRel = rel3(branchOf(x.me.year), branchOf(x.other.year));
  const w = (r: Rel, a: number, b: number, c: number) => (r === "합" ? a : r === "충" ? b : r === "해" ? c : 0);

  // 오행 상생·상극 (일간 기준)
  const a = SHENG.indexOf(KO_OF[elOfStem(x.meStem)]);
  const b = SHENG.indexOf(KO_OF[elOfStem(x.otStem)]);
  const diff = (b - a + 5) % 5;
  const flow = diff === 1 || diff === 4 ? 8 : diff === 0 ? 4 : -2;

  const scores: CompatScore[] = [
    { label: "마음의 거리", score: clamp(68 + w(dayRel, 20, -6, -3) + (x.combine ? 8 : 0) + (x.godGood ? 3 : 0) + (x.godBackGood ? 3 : 0), 50, 98) },
    { label: "대화와 소통", score: clamp(70 + (x.combine ? 10 : 0) - (x.clash ? 4 : 0) + (x.godGood ? 4 : 0) + (x.godBackGood ? 4 : 0), 50, 98) },
    { label: "생활 리듬", score: clamp(70 + w(monthRel, 14, -6, -3) + w(yearRel, 6, -3, -1), 50, 98) },
    { label: "서로에게 주는 힘", score: clamp(68 + (x.filled ? 12 : 0) + flow * 2, 50, 98) },
  ].map((s) => ({ ...s, note: noteFor(s.score) }));

  const links: CompatLink[] = [
    { place: "중심 글자 (일간)", me: x.meStem, partner: x.otStem, rel: x.combine ? "합" : x.clash ? "충" : null },
    { place: "마음 자리 (일지)", me: x.meDayBranch, partner: x.otDayBranch, rel: dayRel },
    { place: "생활 자리 (월지)", me: branchOf(x.me.month), partner: branchOf(x.other.month), rel: monthRel },
    { place: "띠 자리 (연지)", me: branchOf(x.me.year), partner: branchOf(x.other.year), rel: yearRel },
  ];

  const partnerTrait = { title: "상대는 이런 사람이에요", body: TRAIT[x.otStem] ?? "" };

  // 둘이 함께 가장 적은 오행 → 함께 채우면 좋은 기운
  const sum = (n: string) => (x.meElements.find((e) => e.name === n)?.count ?? 0) + (x.otElements.find((e) => e.name === n)?.count ?? 0);
  const lowest = SHENG.reduce((m, n) => (sum(n) < sum(m) ? n : m), SHENG[0]);
  const info = ELEMENT_INFO[lowest];

  const reconcile =
    dayRel === "합"
      ? "마음의 자리가 가까워서 금방 풀려요. 먼저 손을 내미는 쪽이 이기는 게 아니라, 둘 다 편해지는 거예요. 짧은 사과 한마디면 충분해요."
      : dayRel === "충"
        ? "감정이 올라올 땐 잠깐 떨어져서 숨을 고르고, 하루 안에 다시 이야기해 보세요. 한 박자 쉬면 부딪힘이 오히려 속 깊은 대화로 바뀌어요."
        : dayRel === "해"
          ? "작은 오해가 쌓이지 않게, 서운한 점은 그날 가볍게 말해 보세요. 길게 설명하기보다 '이 부분이 속상했어' 한 줄이 좋아요."
          : "의견이 달랐던 이유를 먼저 서로 물어봐 주세요. 이기고 지는 것보다 마음을 확인하는 데 집중하면 금세 풀려요.";

  const tips: CompatTip[] = [
    { emoji: "🤝", title: "싸웠을 때 화해하는 법", body: reconcile },
    { emoji: "💬", title: "상대에게 잘 통하는 대화법", body: TALK[ELEMENT_KEY[KO_OF[elOfStem(x.otStem)]]] ?? "" },
    { emoji: "🌿", title: `함께하면 좋은 활동 · ${info.color}`, body: `둘이 함께 비어 있는 ${lowest} 기운을 채워 주면 좋아요. ${ACTIVITY[lowest]}을(를) 추천해요. 행운 방향은 ${info.direction}, 포인트 컬러는 ${info.color}예요.` },
  ];
  if (x.relation) tips.push({ emoji: "💌", title: `${x.relation} 사이에서 마음 쓰면 좋은 점`, body: RELATION_TIP[x.relation] });

  // 올해와 내년의 흐름: 그해 지지가 두 사람의 일지와 어떻게 만나는지 봐요.
  const timing: Array<{ title: string; body: string }> = [];
  if (x.year) {
    for (const y of [x.year, x.year + 1]) {
      const st = STEMS[(((y - 4) % 10) + 10) % 10];
      const br = BRANCHES[(((y - 4) % 12) + 12) % 12];
      const r1 = rel3(br.hanja, x.meDayBranch);
      const r2 = rel3(br.hanja, x.otDayBranch);
      const rs = [r1, r2];
      const body = rs.every((r) => r === "합")
        ? "두 사람 모두 그해의 기운과 합이 돼요. 함께 움직이기 좋은 해라서, 같이 하고 싶은 계획을 편하게 이야기해 보세요."
        : rs.includes("충")
          ? "변화와 움직임이 많은 해예요. 일정과 마음을 자주 나누면 오히려 더 가까워질 수 있어요."
          : rs.includes("합")
            ? "한 사람에게 힘이 되는 기운이 들어와요. 힘을 받는 쪽이 상대에게 고마움을 표현하면 둘 다 좋아져요."
            : "큰 파도 없이 일상을 차곡차곡 쌓기 좋은 해예요. 소소한 데이트와 안부가 관계를 단단하게 해 줘요.";
      timing.push({ title: `${y}년 (${st.hangul}${br.hangul}년) · 둘의 흐름`, body });
    }
  }

  return { scores, links, partnerTrait, tips, timing, relation: x.relation };
}
