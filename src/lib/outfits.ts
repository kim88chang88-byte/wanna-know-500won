/**
 * 도유 상담실 "코디 카드": 이용자가 옷 이야기를 물으면 성별과 색에 맞는 착장 이미지를 골라 보여 줘요.
 * 이미지는 미리 만들어 둔 것만 써요(public/images/outfits). 새로 만들지 않아요.
 */
export interface Outfit {
  key: string;
  g: "m" | "f";
  name: string;
  /** 색 계열 (· 로 구분) */
  cols: string;
  mood: string;
}

export const OUTFITS: readonly Outfit[] = [
  { key: "m-cream-sweater", g: "m", name: "크림 니트 + 하늘색 소매 · 아이보리 슬랙스", cols: "크림·베이지·스카이블루", mood: "포근·단정" },
  { key: "f-lavender-cardigan", g: "f", name: "라벤더 케이블 가디건 · 파스텔 플리츠 스커트", cols: "라벤더·보라·핑크", mood: "부드러움·단정" },
  { key: "m-beige-knit", g: "m", name: "베이지 꽈배기 니트 · 카멜 팬츠", cols: "베이지·카멜·브라운", mood: "포근·캐주얼" },
  { key: "m-denim", g: "m", name: "데님 재킷 + 흰 후디 · 네이비 카고 팬츠", cols: "블루·네이비·화이트", mood: "캐주얼·활동적" },
  { key: "m-black-suit", g: "m", name: "블랙 블레이저 + 그레이 터틀넥 · 블랙 슬랙스", cols: "블랙·그레이", mood: "격식·세련" },
  { key: "m-grey-fleece", g: "m", name: "그레이 플리스 집업 · 그레이 조거 팬츠", cols: "그레이", mood: "편안·집콕" },
  { key: "m-green-jacket", g: "m", name: "카키 그린 점퍼 · 올리브 팬츠", cols: "그린·카키·올리브", mood: "내추럴·캐주얼" },
  { key: "f-denim-overall", g: "f", name: "데님 멜빵 원피스 + 줄무늬 티", cols: "블루·데님·화이트", mood: "캐주얼·발랄" },
  { key: "f-camel-duffle", g: "f", name: "베이지 더플코트 · 베이지 롱스커트 · 부츠", cols: "베이지·카멜·브라운", mood: "포근·따뜻" },
  { key: "m-burgundy-knit", g: "m", name: "버건디 니트 + 흰 셔츠 · 그레이 슬랙스", cols: "버건디·와인·레드·그레이", mood: "단정·차분" },
  { key: "f-black-tweed", g: "f", name: "블랙 트위드 재킷 · 블랙 플리츠 스커트", cols: "블랙", mood: "격식·단정" },
  { key: "f-grey-knit", g: "f", name: "그레이 니트 원피스 + 가디건 · 어그부츠", cols: "그레이", mood: "포근·편안" },
  { key: "f-green-dress", g: "f", name: "민트 그린 가디건 · 화이트 티어드 원피스", cols: "그린·민트·화이트", mood: "청순·내추럴" },
  { key: "f-red-cardigan", g: "f", name: "레드 재킷 · 크림 플리츠 롱스커트", cols: "레드·크림·베이지", mood: "화사·단정" },
  { key: "m-beige-blazer", g: "m", name: "베이지 블레이저 + 흰 티 · 베이지 슬랙스", cols: "베이지·크림·화이트", mood: "단정·세미캐주얼" },
  { key: "m-pink-knit", g: "m", name: "핑크 니트 · 연청 데님", cols: "핑크·블루", mood: "부드러움·캐주얼" },
  { key: "m-blue-shirt", g: "m", name: "하늘색 셔츠 · 네이비 슬랙스 · 브라운 구두", cols: "블루·스카이블루·네이비", mood: "단정·깔끔" },
  { key: "m-black-fleece", g: "m", name: "블랙 보아 점퍼 + 그레이 티 · 그레이 코듀로이 팬츠", cols: "블랙·그레이", mood: "따뜻·캐주얼" },
  { key: "m-grey-coat", g: "m", name: "그레이 체크 코트 + 터틀넥 · 차콜 슬랙스", cols: "그레이·차콜", mood: "세련·겨울" },
  { key: "f-pink-hoodie", g: "f", name: "핑크 크롭 후디 · 화이트 플리츠 스커트", cols: "핑크·화이트", mood: "발랄·캐주얼" },
  { key: "f-beige-blazerdress", g: "f", name: "베이지 블레이저 원피스 · 베이지 힐", cols: "베이지·크림·브라운", mood: "단정·세련" },
  { key: "f-blue-shirt-navy", g: "f", name: "하늘색 셔츠 · 네이비 롱스커트 · 네이비 플랫", cols: "블루·스카이블루·네이비", mood: "단정·깔끔" },
  { key: "f-black-casual", g: "f", name: "블랙 재킷 + 줄무늬 티 · 블랙 와이드 팬츠 · 로퍼", cols: "블랙·화이트", mood: "시크·캐주얼" },
  { key: "f-green-cardigan", g: "f", name: "딥그린 자수 가디건 · 크림 플리츠 롱스커트", cols: "그린·카키·크림", mood: "내추럴·차분" },
  { key: "f-grey-pinafore", g: "f", name: "차콜 점퍼스커트 + 흰 블라우스 · 무릎 양말", cols: "그레이·차콜·화이트", mood: "단정·클래식" },
  { key: "m-green-turtleneck", g: "m", name: "딥그린 터틀넥 · 베이지 치노 · 브라운 부츠", cols: "그린·베이지·브라운", mood: "포근·내추럴" },
];

export interface OutfitPick {
  /** 보여 줄 착장 key (많아야 3개) */
  keys: string[];
  /** 질문한 색과 정확히 맞으면 true, 가까운 색으로 고른 것이면 false */
  exact: boolean;
  /** 질문한 색 계열 */
  fam: string;
  /** 정확한 색이 없어 대신 고른 계열 */
  near?: string;
}

const FAM: Record<string, string[]> = {
  크림: ["크림", "아이보리"],
  베이지: ["베이지", "카멜"],
  블랙: ["블랙", "검정", "검은"],
  그레이: ["그레이", "회색", "차콜"],
  블루: ["블루", "파랑", "파란", "스카이", "하늘", "데님", "네이비"],
  그린: ["그린", "초록", "카키", "올리브", "민트"],
  핑크: ["핑크", "분홍"],
  레드: ["레드", "빨강", "빨간", "버건디", "와인"],
  라벤더: ["라벤더", "보라", "퍼플"],
  브라운: ["브라운", "갈색"],
  화이트: ["화이트", "흰", "하양"],
};

/** 정확한 색이 없을 때 가까운 계열 (앞에 있는 것부터) */
const NEAR: Record<string, string[]> = {
  레드: ["버건디", "핑크", "브라운"],
  라벤더: ["핑크", "블루", "그레이"],
  화이트: ["크림", "베이지", "블루"],
  핑크: ["라벤더", "레드", "크림"],
  브라운: ["카멜", "베이지", "그레이"],
  크림: ["베이지", "화이트"],
  베이지: ["크림", "카멜", "브라운"],
};

/** 옷 이야기인지: "~옷 입어볼까?", "무슨 색 입을까?", "코디 추천해 줘" 같은 질문 */
export function isOutfitQuestion(text: string): boolean {
  return /(옷|코디|착장|입어|입을|입고|입을까|입는|룩|스타일링|패션)/.test(text);
}

/** 글에서 색 계열 하나를 찾아요. 가장 먼저 나온 것. */
export function colorFamilyOf(text: string): string | null {
  let best: { fam: string; at: number } | null = null;
  for (const [fam, words] of Object.entries(FAM)) {
    for (const w of words) {
      const at = text.indexOf(w);
      if (at >= 0 && (best === null || at < best.at)) best = { fam, at };
    }
  }
  return best?.fam ?? null;
}

function hasColor(o: Outfit, word: string): boolean {
  return o.cols.includes(word);
}

/** 성별과 질문에 맞는 착장을 골라요. 맞는 게 하나도 없으면 null (이미지 없이 색 카드만 보여 줘요). */
export function pickOutfit(gender: "male" | "female" | string | undefined, text: string, extraColors: string[] = []): OutfitPick | null {
  const g = gender === "female" ? "f" : gender === "male" ? "m" : null;
  if (!g) return null;
  const fam = colorFamilyOf(text) ?? colorFamilyOf(extraColors.join(" "));
  if (!fam) return null;
  const pool = OUTFITS.filter((o) => o.g === g);
  const words = [fam, ...FAM[fam]];
  const exact = pool.filter((o) => words.some((w) => hasColor(o, w)));
  if (exact.length > 0) return { keys: exact.slice(0, 3).map((o) => o.key), exact: true, fam };
  for (const n of NEAR[fam] ?? []) {
    const list = pool.filter((o) => hasColor(o, n));
    if (list.length > 0) return { keys: list.slice(0, 3).map((o) => o.key), exact: false, fam, near: n };
  }
  return null;
}

export function outfitByKey(key: string): Outfit | null {
  return OUTFITS.find((o) => o.key === key) ?? null;
}

export const outfitSrc = (key: string): string => `/images/outfits/${key}.webp`;
