import { josa } from "./josa";
import type { SajuResult } from "ssaju";
import type { ElementView, ReportLevel, TopicInsight, TopicKey } from "./types";

/*
 * 자판기(주제)별 맞춤 분석. ssaju 계산 결과(십성·오행·합충·세운·대운)에서 주제에 맞는 부분만 골라
 * 쉬운 말로 풀어줘요. AI 호출 없이 항상 같은 입력이면 같은 결과가 나와요.
 * 해석은 명리학의 일반적인 관점일 뿐이고, 재미와 참고용이에요. (단정하거나 겁주는 표현은 쓰지 않아요)
 */

export const TOPIC_META: Record<TopicKey, { label: string; emoji: string }> = {
  love: { label: "연애운", emoji: "💘" },
  marriage: { label: "인연운", emoji: "💍" },
  money: { label: "재물운", emoji: "🪙" },
  success: { label: "성공운", emoji: "🌊" },
  health: { label: "건강운", emoji: "🌿" },
  study: { label: "학업운", emoji: "📖" },
  general: { label: "오늘의 운", emoji: "🫧" },
};

/** 화면 문구("연애운", "연애 매력 리포트", "올해 재물·직장 운 리포트", "우리 둘의 궁합 리포트")에서 주제를 골라요. */
export function resolveTopic(raw: unknown): TopicKey {
  if (typeof raw !== "string") return "general";
  const rules: Array<[TopicKey, string[]]> = [
    ["marriage", ["결혼", "인연운", "궁합"]],
    ["love", ["연애"]],
    ["money", ["재물", "금전"]],
    ["success", ["성공", "직장", "커리어"]],
    ["health", ["건강"]],
    ["study", ["학업", "공부"]],
  ];
  const hit = rules.find(([, words]) => words.some((w) => raw.includes(w)));
  return hit ? hit[0] : "general";
}

export type Group = "비겁" | "식상" | "재성" | "관성" | "인성";
export const GROUPS: Group[] = ["비겁", "식상", "재성", "관성", "인성"];
const GROUP_OF: Record<string, Group> = {
  비견: "비겁",
  겁재: "비겁",
  식신: "식상",
  상관: "식상",
  편재: "재성",
  정재: "재성",
  편관: "관성",
  정관: "관성",
  편인: "인성",
  정인: "인성",
};

export const ELEMENT_INFO: Record<string, { color: string; hex: string; direction: string; trait: string }> = {
  목: { color: "민트 그린", hex: "#8FD3B6", direction: "동쪽", trait: "성장하고 배려하는 따뜻한 사람" },
  화: { color: "코랄 핑크", hex: "#FF9AA2", direction: "남쪽", trait: "밝고 열정적인 사람" },
  토: { color: "크림 베이지", hex: "#E8D3A8", direction: "가운데(중앙)", trait: "듬직하고 안정감 있는 사람" },
  금: { color: "펄 화이트", hex: "#E6EAF2", direction: "서쪽", trait: "깔끔하고 결단력 있는 사람" },
  수: { color: "딥 블루", hex: "#6C8FD6", direction: "북쪽", trait: "차분하고 유연한 사람" },
};

const SPOUSE_PALACE: Record<string, string> = {
  비견: "친구처럼 동등하고 편안한 관계에서 마음이 놓이는 편이에요.",
  겁재: "연애에서도 자기 주관과 자존심이 살아 있는, 주도적인 스타일이에요.",
  식신: "함께 먹고 웃으며 자연스럽게 가까워지는 편안한 스타일이에요.",
  상관: "솔직하고 표현이 풍부해서, 센스 있는 말과 분위기로 끌리는 스타일이에요.",
  편재: "자유롭고 활동적인 만남, 설렘과 새로움에 마음이 움직이는 스타일이에요.",
  정재: "성실하고 안정적인 관계를 천천히 쌓아 가는 걸 좋아하는 스타일이에요.",
  편관: "강한 끌림이나 카리스마에 마음이 크게 움직이는, 열정적인 스타일이에요.",
  정관: "반듯하고 믿음 가는 사람에게 마음을 여는, 신뢰를 중시하는 스타일이에요.",
  편인: "독특하고 감성적인 교감, 말없이 통하는 느낌을 중요하게 여기는 스타일이에요.",
  정인: "배려받고 이해받는다고 느낄 때 가장 안정감을 느끼는 스타일이에요.",
};

export const GROUP_TRAIT: Record<Group, string> = {
  비겁: "독립심과 자기 주관",
  식상: "표현력과 아이디어",
  재성: "현실 감각과 실속",
  관성: "책임감과 균형 감각",
  인성: "배움과 공감 능력",
};

const GROUP_TAG: Record<Group, string> = {
  비겁: "#주관뚜렷",
  식상: "#표현왕",
  재성: "#현실감각",
  관성: "#책임감",
  인성: "#공감능력",
};

/** 올해 세운·현재 대운이 어떤 십성 기운인지에 따른 한 줄 (주제별 문장 아래 공통으로 써요) */
export const FLOW_LINE: Record<Group, string> = {
  비겁: "나 자신과 주변 사람들의 기운이 강해지는 흐름이에요. 주관이 또렷해지는 만큼 비교나 경쟁에서는 여유를 갖는 게 좋아요.",
  식상: "표현하고 만들어 내는 기운이 커지는 흐름이에요. 아이디어나 감정을 밖으로 꺼낼수록 좋은 일이 생기기 쉬워요.",
  재성: "현실적인 결과와 실속이 눈에 들어오는 흐름이에요. 계획을 세우고 움직이면 손에 잡히는 성과를 만들기 좋아요.",
  관성: "책임과 기회가 함께 오는 흐름이에요. 주어진 역할을 잘 해내면 인정받기 좋고, 무리하지 않게 속도를 조절해 주세요.",
  인성: "배우고 정리하며 힘을 채우는 흐름이에요. 겉으로 큰 변화가 없어도 안쪽이 단단해지는 시기예요.",
};

const QUOTES: Record<TopicKey, Record<Group, string>> = {
  love: {
    비겁: "내 마음의 속도로, 당당하게 설레기 ✦",
    식상: "솔직한 한마디가 오늘의 설렘을 불러요 ✦",
    재성: "천천히 쌓는 마음이 오래 가요 ✦",
    관성: "믿음 가는 사람에게 마음을 열어 봐요 ✦",
    인성: "받은 다정함을 기억하는 하루 ✦",
  },
  marriage: {
    비겁: "대등한 사이가 가장 오래 가요 ✦",
    식상: "대화가 잘 통하는 사람이 내 사람이에요 ✦",
    재성: "함께 그리는 미래가 단단해지는 중 ✦",
    관성: "신뢰는 시간이 쌓아 주는 선물이에요 ✦",
    인성: "서로를 이해하는 만큼 가까워져요 ✦",
  },
  money: {
    비겁: "새는 곳을 막으면 모이는 건 시간문제 ✦",
    식상: "내 재능이 곧 나의 재산이 돼요 ✦",
    재성: "작은 실속이 모여 큰 안심이 돼요 ✦",
    관성: "꾸준함이 가장 믿음직한 투자예요 ✦",
    인성: "배운 만큼 지갑도 든든해져요 ✦",
  },
  success: {
    비겁: "나만의 길을 믿고 한 걸음 더 ✦",
    식상: "아이디어를 꺼내는 순간 길이 열려요 ✦",
    재성: "작은 성과가 큰 물길이 돼요 ✦",
    관성: "맡은 자리에서 빛나는 하루예요 ✦",
    인성: "쌓아 온 실력이 곧 나를 말해 줘요 ✦",
  },
  health: {
    비겁: "내 몸의 신호에 귀 기울이는 하루 ✦",
    식상: "마음껏 표현하고 푹 쉬어 주기 ✦",
    재성: "규칙적인 한 끼가 오늘의 보약이에요 ✦",
    관성: "긴장은 풀고 호흡은 깊게 ✦",
    인성: "충분한 휴식이 가장 좋은 충전이에요 ✦",
  },
  study: {
    비겁: "경쟁보다 어제의 나를 넘어서기 ✦",
    식상: "배운 걸 말로 풀면 내 것이 돼요 ✦",
    재성: "작은 목표를 하나씩 체크해 가요 ✦",
    관성: "정해진 루틴이 합격을 만들어요 ✦",
    인성: "깊이 이해한 만큼 오래 남아요 ✦",
  },
  general: {
    비겁: "오늘도 나답게, 당당하게 ✦",
    식상: "떠오른 생각을 믿고 꺼내 봐요 ✦",
    재성: "차근차근 하면 충분해요 ✦",
    관성: "한 걸음씩, 균형을 지키며 ✦",
    인성: "마음을 채우는 하루가 돼요 ✦",
  },
};

const KEYWORD: Record<TopicKey, string> = {
  love: "#달빛로맨스",
  marriage: "#백년가약",
  money: "#황금조개",
  success: "#물길트임",
  health: "#맑은샘물",
  study: "#지혜의연못",
  general: "#퐁당운세",
};

export function groupOf(god: string | undefined): Group | null {
  return god ? (GROUP_OF[god] ?? null) : null;
}

export interface TopicContext {
  elements: ElementView[];
  hourUnknown: boolean;
  level: ReportLevel;
}

export function buildTopicInsight(topic: TopicKey, r: SajuResult, ctx: TopicContext): TopicInsight {
  const meta = TOPIC_META[topic];
  const female = r.input.gender === "여";

  // 십성 묶음 세기 (일간 자리는 빼고, 태어난 시간을 모르면 시주도 뺍니다)
  const counts: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const positions: Array<[string | undefined, string | undefined]> = [
    [r.tenGods.year.stem, r.tenGods.year.branch],
    [r.tenGods.month.stem, r.tenGods.month.branch],
    [undefined, r.tenGods.day.branch],
  ];
  if (!ctx.hourUnknown) positions.push([r.tenGods.hour.stem, r.tenGods.hour.branch]);
  for (const [s, b] of positions) for (const g of [groupOf(s), groupOf(b)]) if (g) counts[g]++;

  const dominant = GROUPS.reduce((a, b) => (counts[b] > counts[a] ? b : a), GROUPS[0]);
  const partner: Group = female ? "관성" : "재성";
  const spouseGod = r.tenGods.day.branch;
  const spouseText = SPOUSE_PALACE[spouseGod] ?? "관계에서 균형을 중요하게 여기는 편이에요.";
  const monthBranchGroup = groupOf(r.tenGods.month.branch);
  const dohwa = Object.values(r.sals).some((s) => s.twelveSal === "년살");

  // 부족한/넘치는 오행
  const lowest = ctx.elements.reduce((a, b) => (b.count < a.count ? b : a), ctx.elements[0]);
  const highest = ctx.elements.reduce((a, b) => (b.count > a.count ? b : a), ctx.elements[0]);
  const lucky = ELEMENT_INFO[lowest.name];

  const points: { title: string; body: string }[] = [];
  const timing: { title: string; body: string }[] = [];
  let headline = "";

  const dayRel = (kind: "육합" | "충" | "형" | "파" | "해" | "원진") => Boolean(r.branchRelations[kind]?.day);

  switch (topic) {
    case "love": {
      const n = counts[partner];
      headline = n >= 3 ? "인연의 신호가 풍성하게 들어와 있는 편이에요" : n >= 1 ? "마음 가는 인연이 또렷하게 보이는 편이에요" : "내가 먼저 다가갈 때 더 빛나는 타입이에요";
      points.push({ title: "나의 연애 스타일", body: spouseText });
      points.push({
        title: "끌리는 사람",
        body: female
          ? counts.관성 > 0
            ? `${counts.관성 >= 2 ? "책임감 있고 든든한" : "믿음이 가고 단정한"} 사람에게 끌리기 쉬워요. 말보다 행동으로 보여 주는 사람이 잘 맞아요.`
            : "조건보다 분위기와 대화가 통하는 사람에게 끌리는 편이에요. 천천히 알아가는 만남이 잘 맞아요."
          : counts.재성 > 0
            ? `${counts.재성 >= 2 ? "활발하고 매력이 넘치는" : "다정하고 현실적인"} 사람에게 끌리기 쉬워요. 함께 있을 때 편안한 사람이 잘 맞아요.`
            : "겉모습보다 대화와 취향이 통하는 사람에게 끌리는 편이에요. 천천히 알아가는 만남이 잘 맞아요.",
      });
      points.push({
        title: "매력 포인트",
        body: dohwa
          ? "분위기와 눈빛으로 호감을 끄는 매력이 있어요. 첫인상에서 사람들이 기억해 주는 타입이에요."
          : counts.식상 >= 2
            ? "말솜씨와 센스로 분위기를 부드럽게 만드는 매력이 있어요."
            : counts.인성 >= 2
              ? "상대 이야기를 잘 들어 주는 안정감이 큰 매력이에요."
              : `${josa(GROUP_TRAIT[dominant], "이/가")} 매력으로 드러나는 타입이에요.`,
      });
      if (ctx.level === "full") {
        if (dayRel("육합")) points.push({ title: "관계의 결", body: "마음을 연 사람과는 호흡이 잘 맞고 조화로운 관계를 만들기 쉬워요." });
        else if (dayRel("충") || dayRel("형") || dayRel("파")) points.push({ title: "관계의 결", body: "감정이 빠르게 오르내릴 수 있어서, 마음의 속도를 조금 늦추면 오래 가는 관계가 돼요." });
        else points.push({ title: "관계의 결", body: "큰 부딪힘 없이 천천히 깊어지는 흐름이에요. 서두르지 않아도 괜찮아요." });
      }
      break;
    }
    case "marriage": {
      const n = counts[partner];
      headline = n >= 2 ? "인연의 별이 또렷해서 만남의 기회가 열려 있는 편이에요" : "서로를 알아 가는 시간이 인연을 단단하게 해 주는 타입이에요";
      points.push({ title: "배우자 자리의 성향", body: spouseText });
      points.push({ title: "잘 맞는 유형", body: `${ctx.level === "full" ? "내 사주에서 비어 있는 기운을 채워 주는" : "나와 결이 다른 기운으로 균형을 맞춰 주는"} ${lucky.trait}과 잘 맞는 편이에요.` });
      points.push({
        title: "함께 만드는 가정",
        body: dominant === "비겁" ? "서로의 독립을 존중할수록 오래 가요. 각자의 시간과 함께하는 시간의 균형이 포인트예요." : dominant === "재성" ? "현실적인 계획을 함께 세우는 걸 좋아해요. 생활의 기반을 같이 만드는 과정이 큰 힘이 돼요." : dominant === "관성" ? "책임감 있게 가정을 꾸리는 스타일이에요. 짊어지기보다 나눌수록 편안해져요." : dominant === "식상" ? "대화와 표현이 풍부한 가정을 만들어요. 고마움을 말로 자주 전하면 더 좋아요." : "서로를 이해하고 보듬는 정서적 안정이 중요해요. 마음을 나누는 시간이 큰 힘이 돼요.",
      });
      if (ctx.level === "full") {
        points.push({ title: "관계의 결", body: dayRel("육합") ? "배우자 자리에 합의 기운이 있어서, 한 번 맺어진 인연은 서로 잘 맞춰 가는 편이에요." : dayRel("충") || dayRel("형") ? "배우자 자리에 부딪힘의 기운이 있어서, 의견이 갈릴 때 대화로 속도를 맞추면 오히려 단단해져요." : "배우자 자리가 비교적 조용해서, 서로의 리듬을 맞추는 만큼 편안해져요." });
      }
      break;
    }
    case "money": {
      const n = counts.재성;
      headline = n >= 3 ? "돈의 흐름을 읽는 감각이 살아 있는 편이에요" : n >= 1 ? "실속을 챙기면 차곡차곡 쌓이는 타입이에요" : "한 번에 큰 것보다 꾸준한 습관이 힘이 되는 타입이에요";
      points.push({
        title: "돈을 다루는 스타일",
        body: n >= 2 ? "수입과 지출의 흐름을 현실적으로 보는 감각이 있어요. 기회가 보이면 움직일 줄 아는 편이에요." : n === 1 ? "필요한 곳에 알맞게 쓰고 모으는, 균형 잡힌 스타일이에요." : "숫자보다 가치와 의미를 먼저 보는 편이라, 자동 저축 같은 장치가 도움이 돼요.",
      });
      points.push({
        title: "돈이 들어오는 길",
        body: counts.식상 >= 1 && counts.재성 >= 1 ? "재능과 아이디어가 수입으로 이어지는 구조예요. 잘하는 것을 꾸준히 보여 줄수록 좋아요." : counts.관성 >= 2 ? "조직과 직무 안에서 안정적으로 쌓는 길이 잘 맞아요." : counts.인성 >= 2 ? "배운 지식과 자격이 수입의 바탕이 돼요." : "내 강점을 하나 정해 꾸준히 키우는 쪽이 안정적이에요.",
      });
      points.push({
        title: "새는 곳 점검",
        body: counts.비겁 >= 3 ? "사람과의 관계나 경쟁 때문에 지출이 늘기 쉬워요. 모임·선물 예산을 미리 정해 두면 좋아요." : monthBranchGroup === "재성" ? "생활의 기본 흐름에 재물 기운이 있어, 고정 지출 정리만 해도 효과가 커요." : "충동 구매 전 하루만 미뤄 보세요. 작은 습관이 쌓여 큰 차이를 만들어요.",
      });
      break;
    }
    case "success": {
      headline = counts.관성 + counts.인성 >= 3 ? "인정받는 자리를 차근차근 만들어 가는 타입이에요" : counts.식상 >= 2 ? "재능을 드러낼 때 길이 열리는 타입이에요" : "나만의 방식으로 길을 만들어 가는 타입이에요";
      points.push({
        title: "일하는 스타일",
        body: dominant === "관성" ? "맡은 역할을 책임감 있게 해내는 스타일이에요. 신뢰가 곧 나의 경쟁력이에요." : dominant === "식상" ? "아이디어를 내고 표현하는 일에서 빛나요. 새로운 시도를 즐기는 편이에요." : dominant === "재성" ? "결과와 실속을 중시하는 현실파예요. 목표를 숫자로 정하면 속도가 붙어요." : dominant === "인성" ? "배우고 정리하며 실력을 쌓는 스타일이에요. 전문성이 가장 큰 무기예요." : "주관이 뚜렷하고 독립적으로 일할 때 능률이 올라요.",
      });
      points.push({ title: "잘 맞는 환경", body: counts.관성 >= 2 ? "체계와 역할이 분명한 조직에서 안정적으로 성장해요." : counts.식상 >= 2 ? "자율성과 창의성이 보장되는 환경에서 힘이 나요." : counts.비겁 >= 2 ? "내 결정권이 있는 독립적인 환경이 잘 맞아요." : "배울 점이 많은 사람들과 함께하는 환경이 성장에 좋아요." });
      points.push({ title: "성장 포인트", body: `${josa(GROUP_TRAIT[dominant], "이/가")} 강점이에요. ${lowest.name} 기운(${lucky.color})처럼 비어 있는 부분을 의식적으로 채우면 균형이 좋아져요.` });
      break;
    }
    case "health": {
      headline = `${highest.name} 기운이 넘치고 ${lowest.name} 기운이 비어 있는 컨디션 균형이 포인트예요`;
      const care: Record<string, string> = {
        목: "눈과 어깨·목 근육 쪽이 뻣뻣해지기 쉬워요. 스트레칭과 눈 휴식을 챙겨 보세요.",
        화: "열이 오르거나 잠이 얕아지기 쉬워요. 수면 시간과 가벼운 유산소 운동이 도움이 돼요.",
        토: "소화와 식사 리듬이 컨디션을 좌우해요. 규칙적인 식사와 천천히 먹기를 챙겨 보세요.",
        금: "호흡기와 피부가 건조해지기 쉬워요. 환기와 보습, 가벼운 심호흡을 챙겨 보세요.",
        수: "몸이 차가워지거나 붓기 쉬워요. 따뜻한 물과 보온, 하체 운동을 챙겨 보세요.",
      };
      const fill: Record<string, string> = {
        목: "초록 식물이나 숲 산책, 아침 스트레칭으로 채워 보세요.",
        화: "햇볕 쬐기와 활동적인 취미로 채워 보세요.",
        토: "따뜻하고 든든한 한 끼와 규칙적인 생활로 채워 보세요.",
        금: "깨끗한 환경 정리와 깊은 호흡 루틴으로 채워 보세요.",
        수: "충분한 수분과 숙면, 따뜻한 반신욕으로 채워 보세요.",
      };
      points.push({ title: "넘치는 기운", body: `${highest.name}(${highest.count}) 기운이 많은 편이에요. ${care[highest.name]}` });
      points.push({ title: "채워 주면 좋은 기운", body: `${lowest.name}(${lowest.count}) 기운이 적은 편이에요. ${fill[lowest.name]}` });
      points.push({ title: "마음 컨디션", body: counts.식상 >= 2 ? "생각과 감정을 밖으로 표현하면 마음이 한결 가벼워져요. 일기나 대화를 추천해요." : counts.관성 >= 2 ? "책임감이 클수록 긴장이 쌓이기 쉬워요. 하루 10분 멍때리는 시간이 필요해요." : counts.인성 >= 2 ? "생각이 많아지기 쉬워요. 몸을 움직이는 활동으로 머리를 쉬게 해 주세요." : "무리하지 않는 선에서 규칙적인 리듬을 지키는 게 가장 좋은 관리예요." });
      points.push({ title: "참고", body: "명리학 관점의 컨디션 관리 힌트일 뿐, 의학적 진단이 아니에요. 몸이 불편하면 병원 상담을 먼저 받으세요." });
      break;
    }
    case "study": {
      headline = counts.인성 >= 2 ? "깊이 이해하고 오래 기억하는 공부형이에요" : counts.식상 >= 2 ? "배운 걸 말하고 응용할 때 실력이 느는 공부형이에요" : "나만의 루틴을 만들면 속도가 붙는 공부형이에요";
      points.push({
        title: "공부 스타일",
        body: counts.인성 >= 2 ? "원리를 이해하고 정리해서 외우는 스타일이에요. 요약 노트가 큰 무기가 돼요." : counts.식상 >= 2 ? "설명하고 문제를 풀어 보며 익히는 스타일이에요. 친구에게 가르쳐 주기를 추천해요." : counts.관성 >= 2 ? "계획표와 시간표대로 움직일 때 능률이 올라요. 마감이 있으면 더 집중해요." : "혼자 몰입하는 시간이 길수록 성과가 커요. 방해받지 않는 환경을 만들어 보세요.",
      });
      points.push({ title: "시험·평가 운", body: counts.관성 >= 1 ? "규칙과 기준이 분명한 평가에 강한 편이에요. 출제 경향을 분석하는 전략이 잘 맞아요." : "정해진 틀보다 응용과 실전 연습에서 힘이 나요. 기출 문제를 풀어 보세요." });
      points.push({ title: "집중력 팁", body: counts.비겁 >= 3 ? "주변 비교에 흔들리기 쉬워요. 어제의 나와 비교하는 기록을 남겨 보세요." : `${lucky.color} 계열 소품이나 ${lucky.direction} 쪽 자리에서 집중이 잘 될 수 있어요. 기분 전환용 작은 장치로 활용해 보세요.` });
      break;
    }
    default: {
      headline = `${josa(GROUP_TRAIT[dominant], "이/가")} 돋보이는 하루가 될 수 있어요`;
      points.push({ title: "나의 기질", body: `${josa(GROUP_TRAIT[dominant], "이/가")} 가장 두드러지는 사주예요.` });
      points.push({ title: "채우면 좋은 기운", body: `${lowest.name} 기운(${lucky.color})이 적은 편이라, 그 색을 가까이 두면 기분 전환에 도움이 돼요.` });
    }
  }

  if (ctx.level === "full") {
    const sy = r.seyun.find((s) => s.year === r.currentYear);
    const syGroups = sy ? [groupOf(sy.tenGodStem), groupOf(sy.tenGodBranch)].filter((g): g is Group => g !== null) : [];
    const topicGroup: Group = topic === "love" || topic === "marriage" ? partner : topic === "money" ? "재성" : topic === "success" ? "관성" : topic === "study" ? "인성" : (syGroups[0] ?? dominant);
    if (sy) {
      const g = syGroups.includes(topicGroup) ? topicGroup : (syGroups[0] ?? topicGroup);
      const hit = syGroups.includes(topicGroup);
      timing.push({
        title: `${sy.year}년 흐름 · ${sy.ganzhi}`,
        body: `${hit ? `${meta.label}과 직접 닿는 기운이 들어오는 해예요. ` : ""}${FLOW_LINE[g]}`,
      });
    }
    const cur = r.daeun.current;
    if (cur) {
      const g = [groupOf(cur.stemTenGod), groupOf(cur.branchTenGod)].find((x): x is Group => x !== null) ?? dominant;
      timing.push({ title: `지금 대운 · ${cur.ganzhi} (${cur.startAge}~${cur.endAge}세)`, body: FLOW_LINE[g] });
    }
  }

  const tags = [KEYWORD[topic], GROUP_TAG[dominant], `#${lucky.color.replace(/\s/g, "")}`];

  return {
    key: topic,
    label: meta.label,
    emoji: meta.emoji,
    headline,
    points,
    timing,
    tags,
    quote: QUOTES[topic][dominant],
    lucky: { element: lowest.name, color: lucky.color, hex: lucky.hex, direction: lucky.direction },
  };
}
