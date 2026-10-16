export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yang" | "yin";

export interface StemInfo {
  hanja: string;
  hangul: string;
  element: Element;
  yinYang: YinYang;
}

/** 지지는 음양을 의도적으로 두지 않았습니다. (체/용 관점에 따라 子·午·巳·亥의 음양이 달라져 십성 계산 때 혼동되기 쉬움) */
export interface BranchInfo {
  hanja: string;
  hangul: string;
  element: Element;
}

/** 천간 10개. 배열 순서가 갑자(甲子) 순환의 순서입니다. */
export const STEMS: readonly StemInfo[] = [
  { hanja: "甲", hangul: "갑", element: "wood", yinYang: "yang" },
  { hanja: "乙", hangul: "을", element: "wood", yinYang: "yin" },
  { hanja: "丙", hangul: "병", element: "fire", yinYang: "yang" },
  { hanja: "丁", hangul: "정", element: "fire", yinYang: "yin" },
  { hanja: "戊", hangul: "무", element: "earth", yinYang: "yang" },
  { hanja: "己", hangul: "기", element: "earth", yinYang: "yin" },
  { hanja: "庚", hangul: "경", element: "metal", yinYang: "yang" },
  { hanja: "辛", hangul: "신", element: "metal", yinYang: "yin" },
  { hanja: "壬", hangul: "임", element: "water", yinYang: "yang" },
  { hanja: "癸", hangul: "계", element: "water", yinYang: "yin" },
];

/** 지지 12개. 子시가 인덱스 0 입니다. */
export const BRANCHES: readonly BranchInfo[] = [
  { hanja: "子", hangul: "자", element: "water" },
  { hanja: "丑", hangul: "축", element: "earth" },
  { hanja: "寅", hangul: "인", element: "wood" },
  { hanja: "卯", hangul: "묘", element: "wood" },
  { hanja: "辰", hangul: "진", element: "earth" },
  { hanja: "巳", hangul: "사", element: "fire" },
  { hanja: "午", hangul: "오", element: "fire" },
  { hanja: "未", hangul: "미", element: "earth" },
  { hanja: "申", hangul: "신", element: "metal" },
  { hanja: "酉", hangul: "유", element: "metal" },
  { hanja: "戌", hangul: "술", element: "earth" },
  { hanja: "亥", hangul: "해", element: "water" },
];

export const ELEMENT_LABEL_KO: Record<Element, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};
