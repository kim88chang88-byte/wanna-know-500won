import type { Element5 } from "@/lib/ai/image";

export interface PartnerProfileRow {
  label: "직업" | "외모" | "성격" | "특징";
  tags: string[];
}

/** 오행별 어울리는 인연의 분위기. 가볍게 읽는 재미용이라 사실처럼 단정하지 않는 말만 써요. */
const POOL: Record<Element5, { job: string[]; look: string[]; nature: string[]; trait: string[] }> = {
  wood: {
    job: ["교육·강의", "기획·콘텐츠", "디자인", "환경·식물"],
    look: ["쭉 뻗은 체형", "맑은 눈매", "싱그러운 인상", "단정한 이마"],
    nature: ["상냥함", "성장 지향", "배려심", "솔직함"],
    trait: ["웃을 때 편안함", "새로운 걸 배움", "함께 있으면 힘이 남"],
  },
  fire: {
    job: ["방송·미디어", "마케팅", "요리·외식", "공연·예술"],
    look: ["환한 미소", "또렷한 이목구비", "생기 있는 피부", "표정이 풍부함"],
    nature: ["활발함", "표현이 솔직", "열정적", "유쾌함"],
    trait: ["분위기 메이커", "리액션이 좋음", "첫인상이 강렬"],
  },
  earth: {
    job: ["공무·안정적인 직장", "금융·회계", "부동산·건축", "의료·돌봄"],
    look: ["둥근 인상", "든든한 어깨선", "따뜻한 눈빛", "편안한 미소"],
    nature: ["듬직함", "한결같음", "신중함", "포용력"],
    trait: ["약속을 잘 지킴", "곁에 있으면 안정감", "음식 취향이 확실"],
  },
  metal: {
    job: ["전문직(법·세무)", "IT·엔지니어링", "금융·분석", "패션·뷰티"],
    look: ["깔끔한 이목구비", "하얀 피부톤", "단정한 옷차림", "또렷한 턱선"],
    nature: ["이성적", "책임감", "차분함", "결단력"],
    trait: ["센스 있는 말투", "정리정돈을 잘함", "겉은 차갑고 속은 다정"],
  },
  water: {
    job: ["심리·상담", "연구·과학", "작가·기획", "유통·무역"],
    look: ["뽀얀 피부", "깊은 눈매", "부드러운 선", "정적인 분위기"],
    nature: ["침착함", "신비로움", "깊은 배려", "생각이 깊음"],
    trait: ["분위기로 끌림", "지적인 매력", "대화가 잘 통함"],
  },
};

/** 같은 사람이면 같은 모습이 나오도록 seed 로 고르는 간단한 방법 */
function pick<T>(list: T[], seed: number, n: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < list.length && out.length < n; i++) out.push(list[(Math.abs(Math.floor(seed)) + i) % list.length]);
  return [...new Set(out)];
}

/** 운명의 짝의 간단한 프로필(직업·외모·성격·특징). 키는 상대 성별에 맞는 범위에서 골라요. */
export function partnerProfile(partner: "male" | "female", element: Element5, seed: number): PartnerProfileRow[] {
  const p = POOL[element];
  const height = partner === "female" ? 158 + (Math.abs(Math.floor(seed)) % 9) : 172 + (Math.abs(Math.floor(seed)) % 11);
  return [
    { label: "직업", tags: pick(p.job, seed, 1) },
    { label: "외모", tags: [`${height}cm`, ...pick(p.look, seed + 1, 2)] },
    { label: "성격", tags: pick(p.nature, seed + 2, 2) },
    { label: "특징", tags: pick(p.trait, seed + 3, 2) },
  ];
}

/** 제목: "<닉네임> 님의 미래 운명의 짝". 닉네임이 없으면 "당신" */
export function partnerTitle(name: string | null | undefined): string {
  return `${name || "당신"} 님의 미래 운명의 짝`;
}
