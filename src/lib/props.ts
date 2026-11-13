/**
 * 상담실 "소품 추천" 카드의 소품 목록. 이 목록에 없는 이름은 카드로 만들지 않아요.
 * 그림은 미리 만들어 둔 스티커(public/images/props)를 그대로 써요. el 은 어울리는 오행이에요.
 */
export type PropEl = "목" | "화" | "토" | "금" | "수";

export const PROPS: Record<string, { key: string; el: PropEl }> = {
  "손수건": { key: "handkerchief", el: "수" },
  "키링": { key: "keyring", el: "금" },
  "파우치": { key: "pouch", el: "토" },
  "에코백": { key: "ecobag", el: "목" },
  "목걸이": { key: "necklace", el: "금" },
  "팔찌": { key: "bracelet", el: "금" },
  "목도리": { key: "scarf", el: "수" },
  "머리끈": { key: "hairtie", el: "수" },
  "양말": { key: "socks", el: "토" },
  "메모장": { key: "notepad", el: "금" },
  "펜": { key: "pen", el: "금" },
  "연필": { key: "pencil", el: "목" },
  "포스트잇": { key: "postit", el: "금" },
  "다이어리": { key: "diary", el: "목" },
  "책": { key: "book", el: "목" },
  "화분 머그": { key: "plant-mug", el: "목" },
  "책갈피": { key: "bookmark", el: "목" },
  "스티커": { key: "sticker", el: "화" },
  "작은 달력": { key: "calendar", el: "토" },
  "머그컵": { key: "mug", el: "토" },
  "텀블러": { key: "tumbler", el: "수" },
  "찻잔": { key: "teacup", el: "토" },
  "허브티": { key: "herbtea", el: "목" },
  "물병": { key: "waterbottle", el: "수" },
  "따뜻한 차": { key: "warmtea", el: "화" },
  "딸기": { key: "strawberry", el: "화" },
  "체리": { key: "cherry", el: "화" },
  "초콜릿": { key: "chocolate", el: "토" },
  "양초": { key: "candle", el: "화" },
  "무드등": { key: "moodlight", el: "화" },
  "쿠션": { key: "cushion", el: "토" },
  "담요": { key: "blanket", el: "토" },
  "화분": { key: "plant", el: "목" },
  "작은 선인장": { key: "cactus", el: "목" },
  "디퓨저": { key: "diffuser", el: "목" },
  "방향제": { key: "airfreshener", el: "목" },
  "조약돌": { key: "pebble", el: "토" },
  "유리병": { key: "glassjar", el: "수" },
  "꽃 한 송이": { key: "flower", el: "목" },
  "나뭇잎": { key: "leaf", el: "목" },
  "조개껍데기": { key: "shell", el: "수" },
  "작은 거울": { key: "mirror", el: "금" },
  "시계": { key: "clock", el: "금" },
  "별 모양 소품": { key: "star", el: "화" },
  "달 모양 소품": { key: "moon", el: "수" },
  "우산": { key: "umbrella", el: "수" },
  "향초 받침": { key: "candleholder", el: "화" },
  "작은 곰 인형": { key: "bear", el: "토" },
};

export const propSrc = (label: string): string | null => {
  const p = PROPS[label];
  return p ? `/images/props/${p.key}.webp` : null;
};

/** 프롬프트에 넣는 "이름(오행)" 목록 */
export const propCatalog = (): string => Object.entries(PROPS).map(([n, p]) => `${n}(${p.el})`).join(", ");
