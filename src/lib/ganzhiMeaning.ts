/** 천간·지지 한 글자의 쉬운 뜻. 오늘의 일진(예: 戊寅)이 무슨 뜻인지 한 줄로 풀어 줄 때 써요. */
const STEM_IMAGE: Record<string, string> = {
  甲: "큰 나무",
  乙: "풀과 꽃",
  丙: "환한 해",
  丁: "촛불",
  戊: "큰 산",
  己: "부드러운 논밭",
  庚: "단단한 바위",
  辛: "반짝이는 보석",
  壬: "넓은 강",
  癸: "이슬비",
};

const BRANCH_ANIMAL: Record<string, string> = {
  子: "쥐",
  丑: "소",
  寅: "호랑이",
  卯: "토끼",
  辰: "용",
  巳: "뱀",
  午: "말",
  未: "양",
  申: "원숭이",
  酉: "닭",
  戌: "개",
  亥: "돼지",
};

/** "戊寅" → "큰 산(戊)과 호랑이(寅)의 기운이 만나는 날이에요". 모르는 글자면 null */
export function ganzhiMeaning(ganzhi: string): string | null {
  const [stem, branch] = Array.from(ganzhi);
  const s = STEM_IMAGE[stem ?? ""];
  const b = BRANCH_ANIMAL[branch ?? ""];
  if (!s || !b) return null;
  return `오늘 하루의 기운 이름이에요. ${s}(${stem})${withBatchim(s) ? "과" : "와"} ${b}(${branch})의 기운이 만나는 날이래요.`;
}

/** 마지막 글자에 받침이 있으면 true (과/와 고르기) */
function withBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}
