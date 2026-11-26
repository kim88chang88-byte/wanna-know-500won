/** 도리 스티커: 답 끝에 붙는 작은 그림. AI 는 아래 이름 중 하나를 고르고(없으면 none), 그림은 미리 만들어 둔 것만 써요. */
export const STICKERS = [
  { id: "hello", hint: "첫 인사·반가운 인사" },
  { id: "congrats", hint: "좋은 소식·합격·좋은 흐름을 축하할 때" },
  { id: "curious", hint: "되묻거나 근거를 풀어 줄 때" },
  { id: "heart", hint: "연애·설레는 이야기" },
  { id: "fighting", hint: "도전·일·시험을 응원할 때(재물 이야기 포함)" },
  { id: "bokchae", hint: "프리미엄 풀이를 안내하는 답" },
  { id: "pat", hint: "위로·토닥여 줄 때(가장 자주 어울려요)" },
  { id: "thanks", hint: "사용자가 고맙다고 했을 때" },
  { id: "sleep", hint: "밤 시간 마무리·푹 자라고 할 때" },
  { id: "cry", hint: "이별·서운함·속상함에 같이 아파할 때" },
  { id: "shock", hint: "뜻밖의 일에 놀랄 때" },
  { id: "hmm", hint: "판단 기준을 같이 따져 볼 때" },
  { id: "study", hint: "시험·공부 질문" },
  { id: "drained", hint: "번아웃·지쳐서 방전됐다는 말" },
  { id: "unfair", hint: "억울함·화나는 일(직장·관계)" },
  { id: "tea", hint: "정말 지쳤다고 한 사람에게 잠깐 쉬어 가자고 할 때" },
  { id: "money", hint: "돈 걱정·지출이 고민일 때" },
  { id: "nod", hint: "'이렇게 해 봐' 하고 한 가지를 짚어 주는 마무리" },
] as const;

export type StickerId = (typeof STICKERS)[number]["id"];

export const STICKER_IDS: string[] = STICKERS.map((s) => s.id);

/** 모르는 이름이거나 none 이면 null */
export function cleanSticker(v: unknown): StickerId | null {
  return typeof v === "string" && STICKER_IDS.includes(v) ? (v as StickerId) : null;
}

/** 스티커가 들어갈 말풍선 자리: 말풍선 사이에 끼워 넣어 실제 대화처럼 보이게 해요. (0 = 첫 말풍선 바로 뒤) */
const EARLY: string[] = ["hello", "pat", "cry", "shock", "thanks", "congrats", "heart", "unfair", "drained", "curious"];
const MID: string[] = ["hmm", "study", "money", "fighting"];
export function stickerAfter(id: string, bubbles: number): number {
  const last = Math.max(0, bubbles - 1);
  if (EARLY.includes(id)) return Math.min(0, last);
  if (MID.includes(id)) return Math.floor(last / 2);
  return last;
}
