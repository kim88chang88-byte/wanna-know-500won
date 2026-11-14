/**
 * 상담실 "노래 추천" 카드의 곡 목록. 이 목록에 없는 곡은 카드로 만들지 않아요(AI 가 곡을 지어내지 못하게).
 * 국내곡은 멜론 TOP100(2026-09-08 기준)과 오래 사랑받는 곡, 해외곡은 멜론 2026 상반기 결산 해외팝에서 골랐어요.
 * 가사는 싣지 않아요. 곡명·가수만 써요. 새 곡은 이 파일에 한 줄 더하면 돼요.
 * el: 어울리는 기운(목화토금수), mood: 분위기.
 */
export type SongMood = "차분" | "위로" | "신남" | "연주" | "연말";
export type SongEl = "목" | "화" | "토" | "금" | "수";

export const SONGS: Record<string, { el: SongEl; mood: SongMood }> = {
  // 차분한 밤
  "아이유 - 밤편지": { el: "수", mood: "차분" },
  "폴킴 - 모든 날, 모든 순간": { el: "수", mood: "차분" },
  "정승환 - 눈사람": { el: "수", mood: "차분" },
  "적재 - 별 보러 가자": { el: "수", mood: "차분" },
  "검정치마 - Everything": { el: "수", mood: "차분" },
  "한로로 - 0+0": { el: "수", mood: "차분" },
  "최유리 - 생각을 멈추다 보면": { el: "수", mood: "차분" },
  "순순희(지환) - 눈을 감아도(2026)": { el: "수", mood: "차분" },
  "WOODZ - Drowning": { el: "수", mood: "차분" },
  "김나영 - 봄 내음보다 너를": { el: "목", mood: "차분" },
  "Fiji Blue - Baby Blue": { el: "수", mood: "차분" },
  "Stella Lefty - Thinking 'bout You": { el: "수", mood: "차분" },
  "Arlo Parks - Get Go": { el: "금", mood: "차분" },
  "Johnny Stimson - Magical Afternoon": { el: "토", mood: "차분" },
  // 위로·마음 풀기
  "이적 - 걱정말아요 그대": { el: "토", mood: "위로" },
  "이하이 - 한숨": { el: "수", mood: "위로" },
  "AKMU - 어떻게 이별까지 사랑하겠어, 널 사랑하는 거지": { el: "수", mood: "위로" },
  "AKMU - 기쁨, 슬픔, 아름다운 마음": { el: "토", mood: "위로" },
  "임영웅 - 사랑은 늘 도망가": { el: "수", mood: "위로" },
  "다비치 - 타임캡슐": { el: "토", mood: "위로" },
  "카더가든 - 그대 작은 나의 세상이 되어": { el: "토", mood: "위로" },
  "황가람 - 나는 반딧불": { el: "금", mood: "위로" },
  "한로로 - 사랑은 봄비처럼": { el: "수", mood: "위로" },
  "데이식스 - 한 페이지가 될 수 있게": { el: "토", mood: "위로" },
  "성시경 - 두 사람": { el: "토", mood: "위로" },
  "아이유 - Love wins all": { el: "수", mood: "위로" },
  "Mimi Webb - Eyes Closed": { el: "수", mood: "위로" },
  "Lukas Graham - Second Chance": { el: "토", mood: "위로" },
  "Niall Horan - End of an Era": { el: "토", mood: "위로" },
  "Holly Humberstone - To Love Somebody": { el: "수", mood: "위로" },
  // 기운 북돋기
  "김동률 - 출발": { el: "목", mood: "신남" },
  "이무진 - 신호등": { el: "목", mood: "신남" },
  "아이유 - 좋은 날": { el: "목", mood: "신남" },
  "10cm - 그라데이션": { el: "목", mood: "신남" },
  "볼빨간사춘기 - 여름아 부탁해": { el: "목", mood: "신남" },
  "AKMU - 소문의 낙원": { el: "목", mood: "신남" },
  "I.O.I - 갑자기": { el: "목", mood: "신남" },
  "데이식스 - HAPPY": { el: "화", mood: "신남" },
  "데이식스 - 예뻤어": { el: "화", mood: "신남" },
  "너드커넥션 - 그대만 있다면": { el: "화", mood: "신남" },
  "태연 - 만찬가": { el: "화", mood: "신남" },
  "aespa - LEMONADE": { el: "화", mood: "신남" },
  "보이넥스트도어 - 오늘만 I LOVE YOU": { el: "목", mood: "신남" },
  "Maroon 5 - Heroine": { el: "화", mood: "신남" },
  "Bruno Mars - I Just Might": { el: "화", mood: "신남" },
  "OneRepublic - Need Your Love": { el: "화", mood: "신남" },
  "Nick Jonas - Sweet To Me": { el: "목", mood: "신남" },
  "Jessie Ware - Superbloom": { el: "목", mood: "신남" },
  "aron! - Wonderful Thing": { el: "목", mood: "신남" },
  "almost monday - leaving is easy": { el: "금", mood: "신남" },
  // 연말·겨울 감성
  "에일리 - 첫눈처럼 너에게 가겠다": { el: "수", mood: "연말" },
  "잔나비 - 주저하는 연인들을 위해": { el: "수", mood: "연말" },
  "새소년 - 난춘": { el: "금", mood: "연말" },
  "멜로망스 - 사랑인가 봐": { el: "목", mood: "연말" },
  // 가사 없는 연주·집중
  "이루마 - River Flows in You": { el: "수", mood: "연주" },
  "이루마 - Kiss the Rain": { el: "수", mood: "연주" },
  "유키 구라모토 - Lake Louise": { el: "토", mood: "연주" },
  "사카모토 류이치 - Merry Christmas, Mr. Lawrence": { el: "금", mood: "연주" },
  "Bill Evans - Waltz for Debby": { el: "토", mood: "연주" },
  "Nujabes - Aruarian Dance": { el: "금", mood: "연주" },
  "히사이시 조 - Summer": { el: "목", mood: "연주" },
};

/** 프롬프트에 넣는 "가수 - 곡명(오행·분위기)" 목록 */
export const songCatalog = (): string => Object.entries(SONGS).map(([n, s]) => `${n}(${s.el}·${s.mood})`).join(" / ");

/** 듣기 링크: 특정 곡 주소가 아니라 검색 주소라서 깨질 일이 없어요. */
export const songSearchUrl = (label: string): string => `https://www.youtube.com/results?search_query=${encodeURIComponent(label)}`;
