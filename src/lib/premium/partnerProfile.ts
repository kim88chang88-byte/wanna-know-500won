import type { Element5 } from "@/lib/ai/image";

export interface PartnerProfileRow {
  label: "직업" | "MBTI" | "외모" | "성격" | "특징" | "연애 스타일" | "데이트 취향" | "말투·목소리" | "취미" | "처음 만나는 곳" | "인연이 깊어지는 계절";
  tags: string[];
}

/** 오행별 어울리는 인연의 분위기. 가볍게 읽는 재미용이라 사실처럼 단정하지 않는 말만 써요. */
/** 화면에서 "더 알아보기"로 접어 보여 주는 줄 */
export const MORE_LABELS: ReadonlyArray<string> = ["연애 스타일", "데이트 취향", "말투·목소리", "취미", "처음 만나는 곳", "인연이 깊어지는 계절"];
/** 한 문장으로 보여 주는 줄(알약 대신 문장 상자) */
export const SENTENCE_LABELS: ReadonlyArray<string> = ["연애 스타일", "말투·목소리", "인연이 깊어지는 계절"];

interface Extra {
  mbti: Array<[string, string]>;
  love: string[];
  date: string[];
  voice: string[];
  hobby: string[];
  meet: string[];
  season: string;
}

/** 오행별 MBTI·연애·취향. 이것도 재미로 읽는 분위기일 뿐이에요. */
const EXTRA: Record<Element5, Extra> = {
  wood: { mbti: [["ENFP", "재기발랄한 활동가"], ["ENFJ", "따뜻한 리더"], ["INFP", "다정한 몽상가"], ["ENTP", "아이디어 뱅크"]], love: ["천천히 마음을 키우는 연애", "같이 성장하는 걸 좋아함", "응원을 아끼지 않는 스타일"], date: ["산책과 카페", "전시·서점 데이트", "작은 여행"], voice: ["맑고 청량한 목소리", "말끝이 부드러움", "웃음이 먼저 나옴"], hobby: ["식물 키우기", "독서", "새로운 클래스 듣기"], meet: ["배울 때 만나는 자리", "친구의 소개", "여행지"], season: "봄" },
  fire: { mbti: [["ESFP", "분위기 메이커"], ["ENFP", "재기발랄한 활동가"], ["ESTP", "행동파 모험가"], ["ENFJ", "따뜻한 리더"]], love: ["표현이 시원하고 직진", "기념일을 잘 챙김", "사랑하면 티가 나는 스타일"], date: ["맛집 투어", "공연·축제", "활동적인 데이트"], voice: ["웃음소리가 큼", "목소리에 에너지가 있음", "말이 빠르고 신남"], hobby: ["운동", "맛집 탐방", "사진 찍기"], meet: ["모임·행사", "운동하는 곳", "친구들과의 자리"], season: "여름" },
  earth: { mbti: [["ISFJ", "든든한 수호자"], ["ESFJ", "다정한 살림꾼"], ["ISTJ", "믿음직한 원칙주의자"], ["ESTJ", "듬직한 관리자"]], love: ["천천히, 그러나 오래가는 연애", "말보다 행동으로 챙김", "한 번 마음 주면 한결같음"], date: ["집밥과 카페", "동네 산책", "익숙한 단골집"], voice: ["낮고 차분한 목소리", "말수는 적지만 따뜻함", "느긋한 말투"], hobby: ["요리", "정리정돈", "드라마·영화 감상"], meet: ["직장·가까운 동네", "오래된 지인의 소개", "가족 모임"], season: "환절기" },
  metal: { mbti: [["ISTJ", "믿음직한 원칙주의자"], ["INTJ", "전략가"], ["ESTJ", "듬직한 관리자"], ["ISTP", "냉철한 장인"]], love: ["겉은 차갑고 속은 다정", "약속과 시간을 소중히 여김", "선물을 센스 있게 고름"], date: ["분위기 좋은 레스토랑", "전시·공연", "조용한 드라이브"], voice: ["또렷하고 시원한 말투", "말이 간결함", "웃을 때 반전 매력"], hobby: ["자기계발", "미술관 가기", "정리·수집"], meet: ["일하다가", "전문 모임·스터디", "지인의 소개"], season: "가을" },
  water: { mbti: [["INFJ", "조용한 통찰가"], ["INTP", "호기심 많은 사색가"], ["INFP", "다정한 몽상가"], ["ISFP", "감성 예술가"]], love: ["대화가 잘 통하면 깊어지는 연애", "마음을 천천히 열지만 깊음", "말없이 곁을 지켜 줌"], date: ["밤 산책과 음악", "조용한 카페·바", "영화·전시"], voice: ["맑고 조용한 목소리", "말이 부드럽고 낮음", "귀 기울여 들어 줌"], hobby: ["음악 듣기", "글쓰기", "여행 계획 세우기"], meet: ["온라인·취미 모임", "밤에 여는 모임", "여행 중"], season: "겨울" },
};

const POOL: Record<Element5, { job: string[]; look: string[]; nature: string[]; trait: string[] }> = {
  wood: {
    job: ["교육·강의", "기획·콘텐츠", "디자인", "환경·식물", "출판·번역", "여행·레저", "공방·원예", "웹·앱 서비스"],
    look: ["쭉 뻗은 체형", "맑은 눈매", "싱그러운 인상", "단정한 이마", "시원한 웃음", "가벼운 걸음걸이", "초록이 어울리는 분위기", "청량한 목소리"],
    nature: ["상냥함", "성장 지향", "배려심", "솔직함", "호기심 많음", "낙천적", "부지런함", "열린 마음"],
    trait: ["웃을 때 편안함", "새로운 걸 배움", "함께 있으면 힘이 남", "산책과 식물을 좋아함", "계획 세우는 걸 즐김", "칭찬을 아끼지 않음"],
  },
  fire: {
    job: ["방송·미디어", "마케팅", "요리·외식", "공연·예술", "행사·이벤트", "영업·세일즈", "스포츠·트레이너", "패션 스타일링"],
    look: ["환한 미소", "또렷한 이목구비", "생기 있는 피부", "표정이 풍부함", "반짝이는 눈빛", "활기찬 걸음", "웃음소리가 큼", "화사한 분위기"],
    nature: ["활발함", "표현이 솔직", "열정적", "유쾌함", "정이 많음", "추진력 있음", "승부욕", "사교적"],
    trait: ["분위기 메이커", "리액션이 좋음", "첫인상이 강렬", "기념일을 잘 챙김", "맛집을 잘 앎", "감정 표현이 시원함"],
  },
  earth: {
    job: ["공무·안정적인 직장", "금융·회계", "부동산·건축", "의료·돌봄", "농식품·유통", "교육 행정", "인사·총무", "제조·품질관리"],
    look: ["둥근 인상", "든든한 어깨선", "따뜻한 눈빛", "편안한 미소", "넉넉한 분위기", "차분한 손짓", "부드러운 턱선", "포근한 인상"],
    nature: ["듬직함", "한결같음", "신중함", "포용력", "인내심", "성실함", "현실적", "다정다감"],
    trait: ["약속을 잘 지킴", "곁에 있으면 안정감", "음식 취향이 확실", "집밥과 카페를 좋아함", "기억력이 좋음", "말보다 행동이 먼저"],
  },
  metal: {
    job: ["전문직(법·세무)", "IT·엔지니어링", "금융·분석", "패션·뷰티", "연구개발", "컨설팅", "품질·인증", "보석·정밀 기술"],
    look: ["깔끔한 이목구비", "하얀 피부톤", "단정한 옷차림", "또렷한 턱선", "곧은 자세", "정돈된 헤어", "맑고 선명한 눈", "세련된 분위기"],
    nature: ["이성적", "책임감", "차분함", "결단력", "꼼꼼함", "원칙주의", "정직함", "절제력"],
    trait: ["센스 있는 말투", "정리정돈을 잘함", "겉은 차갑고 속은 다정", "시간 약속이 철저", "선물 고르는 눈이 좋음", "결정이 빠름"],
  },
  water: {
    job: ["심리·상담", "연구·과학", "작가·기획", "유통·무역", "영상·사진", "음악·사운드", "데이터·AI", "여행·항공"],
    look: ["뽀얀 피부", "깊은 눈매", "부드러운 선", "정적인 분위기", "촉촉한 눈빛", "조용한 미소", "단아한 손", "맑은 목소리"],
    nature: ["침착함", "신비로움", "깊은 배려", "생각이 깊음", "적응력 좋음", "유연함", "직관적", "경청을 잘함"],
    trait: ["분위기로 끌림", "지적인 매력", "대화가 잘 통함", "밤 시간과 음악을 좋아함", "혼자만의 시간이 필요", "비 오는 날을 좋아함"],
  },
};

/** 생년월일시로 만든 숫자. 같은 사람이면 같은 값이고, 사람마다 넓게 퍼져요. (복장 번호 seed 6가지보다 훨씬 다양해요) */
export function profileSeed(b: { year: number; month: number; day: number; hour?: number | null }): number {
  let h = 2166136261;
  for (const ch of `profile:${b.year}-${b.month}-${b.day}-${b.hour ?? "x"}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** 작은 난수 생성기(같은 씨앗이면 같은 순서) */
function rng(seed: number): () => number {
  let a = (Math.floor(Math.abs(seed)) ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 같은 씨앗이면 같은 결과로, 목록에서 겹치지 않게 n개를 골라요. */
function pick<T>(list: T[], seed: number, n: number): T[] {
  const r = rng(seed);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** 운명의 짝의 간단한 프로필(직업·외모·성격·특징). 키는 상대 성별에 맞는 범위에서 골라요. */
export function partnerProfile(partner: "male" | "female", element: Element5, seed: number): PartnerProfileRow[] {
  const p = POOL[element];
  const r = rng(seed * 7 + 1);
  const height = partner === "female" ? 158 + Math.floor(r() * 9) : 172 + Math.floor(r() * 11);
  const x = EXTRA[element];
  return [
    { label: "직업", tags: pick(p.job, seed + 11, 3) },
    { label: "MBTI", tags: pick(x.mbti, seed + 61, 1)[0] },
    { label: "외모", tags: [`${height}cm`, ...pick(p.look, seed + 23, 2)] },
    { label: "성격", tags: pick(p.nature, seed + 37, 2) },
    { label: "특징", tags: pick(p.trait, seed + 53, 2) },
    { label: "연애 스타일", tags: pick(x.love, seed + 67, 1) },
    { label: "데이트 취향", tags: pick(x.date, seed + 71, 2) },
    { label: "말투·목소리", tags: pick(x.voice, seed + 73, 1) },
    { label: "취미", tags: pick(x.hobby, seed + 79, 2) },
    { label: "처음 만나는 곳", tags: pick(x.meet, seed + 83, 2) },
    { label: "인연이 깊어지는 계절", tags: [`${x.season}에 마음이 가까워지기 쉬워`] },
  ];
}

/** 제목: "<닉네임> 님의 미래 운명의 짝". 닉네임이 없으면 "당신" */
export function partnerTitle(name: string | null | undefined): string {
  return `${name || "당신"} 님의 미래 운명의 짝`;
}
