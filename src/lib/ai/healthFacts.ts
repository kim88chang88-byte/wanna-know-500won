import type { SajuChart } from "@/lib/saju/types";
import { BRANCHES } from "@/lib/saju/constants";
import { analyzeChart } from "@/lib/saju/analysis";
import { branchRelation } from "@/lib/ai/dailyFacts";
import { sewoonBranch } from "@/lib/ai/loveFacts";
import { EL_KO, type Element } from "@/lib/ai/menuHobby";

/*
 * 몸·컨디션 질문("감기가 자주 걸려", "요즘 피곤해", "잠을 못 자")일 때만 프롬프트에 넣는 "건강 재료".
 * 도리가 "오행 두어 개 + 쉬어라"로 끝내지 않고, 일지·태어난 계절·오행 개수·없는 오행이 맡는 몸 쪽·올해 세운의 충합을
 * 하나의 이야기로 이어서 "왜 이 증상이 반복되는지"를 풀게 해요. 진단이 아니라 생활 컨디션의 결로만 말해요.
 */

export const HEALTH_Q = /감기|기침|목감기|콧물|몸살|열이|열나|아프|아파(?!트)|아픈|통증|두통|어지러|피곤|피로(?!연)|지쳐|체력|면역|컨디션|건강|체질|불면|잠을?\s?못|잠이\s?안|소화|체했|속이|배탈|허리|어깨|목이|뻐근|붓|부어|저리|저려|다크서클|환절기/;

/** 오행이 맡는 몸의 쪽(사주 풀이 쪽 말이에요. 의학 설명이 아니라 생활 컨디션 힌트로만 써요) */
const BODY: Record<Element, string> = {
  wood: "간·눈·근육과 힘줄, 피로가 풀리는 속도, 신경이 쉽게 곤두서는 정도",
  fire: "심장·혈액순환·열감, 얼굴로 오르는 열, 잠들기 전 가슴이 뛰는 정도",
  earth: "위장·소화, 입맛, 몸을 받쳐 주는 기초 체력",
  metal: "목·기관지·코·폐 같은 호흡기, 피부, 대장, 바깥 기운(감기)을 막아 주는 방어력",
  water: "신장·방광, 몸속 수분과 체온, 귀·허리·무릎, 잠과 회복력",
};

/** 오행이 비었거나 얇을 때 곁들이면 좋은 생활 쪽(증상과 이어질 때만 골라 써요) */
const FILL: Record<Element, string> = {
  wood: "몸을 가볍게 펴 주는 움직임(기지개·가까운 곳 걷기), 눈을 쉬게 하는 시간",
  fire: "손발·배를 따뜻하게 두기, 낮에 햇볕 잠깐 쬐기",
  earth: "끼니를 거르지 않고 따뜻한 밥을 천천히 먹기, 속이 편한 음식",
  metal: "목·코 점막을 마르지 않게(미지근한 물을 자주 나눠 마시기, 밤에 방 습도 챙기기, 목 따뜻하게 감싸기, 건조한 곳에선 마스크)",
  water: "수분을 자주 나눠 마시기, 몸이 식지 않게 하기, 잠자는 시간을 일정하게",
};

/** 오행이 넘칠 때 덜어 줄 생활 쪽 */
const EASE: Record<Element, string> = {
  wood: "한 번에 여러 일을 벌이지 않기, 화가 올라올 때 자리를 잠깐 옮기기",
  fire: "밤늦게까지 머리 쓰는 일 줄이기, 카페인·자극적인 음식 줄이기, 열이 오를 때 쉬는 틈 만들기",
  earth: "오래 앉아만 있지 않기, 과식·야식 줄이기, 걱정을 혼자 곱씹는 시간 줄이기",
  metal: "너무 팽팽하게 몰아붙이지 않기, 마른 공기에 오래 머물지 않기",
  water: "몸이 차가워지지 않게 하기, 걱정이 밤새 이어지지 않게 잠들기 전 생각 접기",
};

const SEASON = (branch: string): string => {
  if ("寅卯辰".includes(branch)) return "봄(기운이 올라오는 때)";
  if ("巳午未".includes(branch)) return "여름(뜨겁고 습한 때)";
  if ("申酉戌".includes(branch)) return "가을(건조해지는 때)";
  return "겨울(차갑고 움츠러드는 때)";
};

const level = (n: number) => (n >= 4 ? "아주 많음" : n === 3 ? "많은 편" : n === 2 ? "보통" : n === 1 ? "적은 편" : "아예 없음");

const REL_HEALTH: Record<"합" | "충" | "해", string> = {
  합: "합 — 서로 끌어당겨 큰 부딪힘은 적은 흐름",
  충: "충 — 정면으로 부딪혀 몸과 마음이 분주해지기 쉬운 흐름(나쁘다고 단정 금지)",
  해: "해 — 사소하게 어긋나 신경이 쓰이는 흐름",
};

export function healthFacts(chart: SajuChart, now: Date): Record<string, unknown> {
  const f = analyzeChart(chart);
  const els = Object.keys(f.elementCounts) as Element[];
  const counts = f.elementCounts;
  const min = Math.min(...els.map((e) => counts[e]));
  const max = Math.max(...els.map((e) => counts[e]));
  const lack = min <= 1 ? els.filter((e) => counts[e] === min) : [];
  const heavy = max >= 3 ? els.filter((e) => counts[e] === max) : [];
  const out: Record<string, unknown> = {
    오행개수: els.map((e) => `${EL_KO[e]} ${counts[e]}글자(${level(counts[e])})`).join(", "),
  };
  const dayB = chart.day.branch;
  const dayInfo = BRANCHES.find((b) => b.hanja === dayB);
  out.일지 = `${dayB}(${dayInfo?.hangul ?? ""}) ${dayInfo ? EL_KO[dayInfo.element as Element] : ""} 기운 — 내 몸의 안쪽 자리`;
  if (chart.month?.branch) {
    const mInfo = BRANCHES.find((b) => b.hanja === chart.month.branch);
    out.태어난계절 = `월지 ${chart.month.branch}(${mInfo?.hangul ?? ""}) — ${SEASON(chart.month.branch)}. 이 계절의 기운이 사주의 밑바탕 온도`;
  }
  if (lack.length) {
    out.부족한기운과몸 = lack.map((e) => `${EL_KO[e]} 기운 ${counts[e]}글자 → ${BODY[e]}`);
    out.부족할때생활 = lack.map((e) => `${EL_KO[e]}: ${FILL[e]}`);
  }
  if (heavy.length) {
    out.넘치는기운 = heavy.map((e) => `${EL_KO[e]} 기운 ${counts[e]}글자 — 힘이 한쪽으로 몰려 ${e === "fire" ? "열이 오르고 마음이 바쁘기" : e === "earth" ? "무겁게 쌓아 두고 곱씹기" : e === "metal" ? "팽팽하게 조이기" : e === "water" ? "차갑게 가라앉고 걱정이 깊어지기" : "신경이 곤두서기"} 쉬운 결`);
    out.넘칠때덜어줄생활 = heavy.map((e) => `${EL_KO[e]}: ${EASE[e]}`);
  }
  const sw = sewoonBranch(now);
  const swInfo = BRANCHES.find((b) => b.hanja === sw.branch);
  const rel = (b: string) => {
    const r = branchRelation(sw.branch, b);
    return r ? REL_HEALTH[r] : "특별한 합·충 없음";
  };
  out.올해세운 = `${sw.year}년 ${sw.branch}(${swInfo?.hangul ?? ""}) ${swInfo ? EL_KO[swInfo.element as Element] : ""} 기운`;
  out.올해세운과일지 = `${sw.branch} ↔ 일지 ${dayB}: ${rel(dayB)}`;
  if (chart.month?.branch) out.올해세운과월지 = `${sw.branch} ↔ 월지 ${chart.month.branch}: ${rel(chart.month.branch)}`;
  out.말하는법 = "①사용자가 말한 증상·횟수 되받아 공감 → ②이 질문과 이어지는 근거 3~4개를 이야기처럼 이어서(일지·태어난 계절·오행 개수·없거나 넘치는 오행이 맡는 몸 쪽·올해 세운의 충합) → ③비유 한 문장 → ④병원·약사 안내 한 줄 + 생활 행동 1~2개(위 생활 항목에서 증상과 이어지는 것만) → ⑤자책 풀기 → ⑥지금 상태 되묻기. 진단·원인 단정 금지, 경향으로만.";
  return out;
}
