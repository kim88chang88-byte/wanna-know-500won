/**
 * 상담실 "여행 추천" 카드의 지역 목록. 이 목록에 없는 지역은 카드로 만들지 않아요(AI 가 지역을 지어내지 못하게).
 * 지역 그림은 public/images/travel/<slug>.webp (AI 일러스트). 이동 시간은 서울(수도권)·인천 출발 기준의 대략값이에요.
 * 숙소·식당·카페 상호는 싣지 않아요. 지역과 명소, 활동 종류까지만 써요.
 * move1: 국내는 대중교통, 해외는 비행. move2: 국내는 자차, 해외는 현지 이동.
 */
export type TravelFit = "편안" | "보통" | "빡빡";
export interface TravelPlace {
  slug: string;
  intl: boolean;
  el: "목" | "화" | "토" | "금" | "수";
  mood: string;
  move1: string;
  move2: string;
  point: string;
  fit: TravelFit;
}

export const TRAVEL: Record<string, TravelPlace> = {
  "강릉": { slug: "gangneung", intl: false, el: "수", mood: "힐링·감성", move1: "KTX 약 2시간", move2: "자차 약 2.5~3시간", point: "겨울 바다·일출, 안목해변 커피거리, 경포호 산책, 주문진 시장", fit: "편안" },
  "속초": { slug: "sokcho", intl: false, el: "수", mood: "힐링·미식", move1: "고속버스 약 2.5시간", move2: "자차 약 2.5시간", point: "설악산 눈 소식, 속초해변, 중앙시장 먹거리", fit: "편안" },
  "양양": { slug: "yangyang", intl: false, el: "수", mood: "활동·감성", move1: "버스 약 2.5시간", move2: "자차 약 2시간", point: "죽도 서핑 해변 산책, 낙산사 일출", fit: "편안" },
  "경주": { slug: "gyeongju", intl: false, el: "토", mood: "역사·감성", move1: "KTX 약 2시간(신경주)", move2: "자차 약 3.5시간", point: "대릉원·첨성대, 동궁과 월지 야경, 황리단길", fit: "편안" },
  "전주": { slug: "jeonju", intl: false, el: "토", mood: "미식·역사", move1: "KTX 약 1시간 50분", move2: "자차 약 2.5시간", point: "한옥마을 산책, 남부시장, 경기전", fit: "편안" },
  "안동": { slug: "andong", intl: false, el: "토", mood: "역사·힐링", move1: "KTX 약 2시간", move2: "자차 약 3시간", point: "하회마을, 월영교 야경, 찜닭 골목", fit: "편안" },
  "통영": { slug: "tongyeong", intl: false, el: "수", mood: "감성·미식", move1: "버스 약 4시간", move2: "자차 약 4시간", point: "동피랑, 미륵산 케이블카, 중앙시장 해산물", fit: "보통" },
  "여수": { slug: "yeosu", intl: false, el: "수", mood: "감성·미식", move1: "KTX 약 2시간 50분", move2: "자차 약 4.5시간", point: "여수 밤바다, 향일암 일출, 해상 케이블카", fit: "보통" },
  "순천": { slug: "suncheon", intl: false, el: "목", mood: "힐링·걷기", move1: "KTX 약 2시간 40분", move2: "자차 약 4시간", point: "순천만 갈대와 겨울 철새, 국가정원", fit: "보통" },
  "남해": { slug: "namhae", intl: false, el: "수", mood: "힐링·감성", move1: "버스 약 4.5시간", move2: "자차 약 4.5시간", point: "독일마을, 다랭이마을 바다 풍경", fit: "빡빡" },
  "담양": { slug: "damyang", intl: false, el: "목", mood: "걷기·힐링", move1: "버스 약 3시간", move2: "자차 약 3시간", point: "메타세쿼이아길, 죽녹원 대숲", fit: "보통" },
  "목포": { slug: "mokpo", intl: false, el: "수", mood: "역사·미식", move1: "KTX 약 2시간 30분", move2: "자차 약 4시간", point: "유달산, 갓바위, 근대 역사 거리", fit: "보통" },
  "부산": { slug: "busan", intl: false, el: "수", mood: "도시·미식", move1: "KTX 약 2시간 30분", move2: "자차 약 4.5시간", point: "해운대·광안리 야경, 감천문화마을", fit: "편안" },
  "포항": { slug: "pohang", intl: false, el: "수", mood: "활동·감성", move1: "KTX 약 2시간 40분", move2: "자차 약 4시간", point: "호미곶 일출, 영일대 해변", fit: "보통" },
  "대구": { slug: "daegu", intl: false, el: "화", mood: "도시·미식", move1: "KTX 약 1시간 50분", move2: "자차 약 3.5시간", point: "김광석길, 근대골목, 서문시장", fit: "편안" },
  "거제": { slug: "geoje", intl: false, el: "수", mood: "힐링·감성", move1: "버스 약 4.5시간", move2: "자차 약 4.5시간", point: "바람의 언덕, 해금강·외도 유람", fit: "빡빡" },
  "태안": { slug: "taean", intl: false, el: "수", mood: "힐링·노을", move1: "버스 약 2.5시간", move2: "자차 약 2.5시간", point: "안면도 노을, 신두리 해안사구", fit: "편안" },
  "강화": { slug: "ganghwa", intl: false, el: "수", mood: "근교·노을", move1: "버스 약 1.5시간", move2: "자차 약 1.5시간", point: "석모도 노을, 전등사 산책", fit: "편안" },
  "가평": { slug: "gapyeong", intl: false, el: "목", mood: "힐링·걷기", move1: "ITX·버스 약 1.5시간", move2: "자차 약 1.5시간", point: "남이섬, 자라섬 산책", fit: "편안" },
  "양평": { slug: "yangpyeong", intl: false, el: "목", mood: "힐링·감성", move1: "경의중앙선 약 1.5시간", move2: "자차 약 1시간", point: "두물머리 새벽 안개, 세미원", fit: "편안" },
  "춘천": { slug: "chuncheon", intl: false, el: "수", mood: "힐링·미식", move1: "ITX 약 1시간 10분", move2: "자차 약 1.5시간", point: "소양강 스카이워크, 닭갈비 골목", fit: "편안" },
  "단양": { slug: "danyang", intl: false, el: "목", mood: "활동·걷기", move1: "버스 약 3시간", move2: "자차 약 2.5시간", point: "도담삼봉, 만천하 스카이워크", fit: "보통" },
  "평창": { slug: "pyeongchang", intl: false, el: "목", mood: "힐링·눈", move1: "KTX 약 1시간 40분(진부)", move2: "자차 약 2.5시간", point: "오대산 월정사 전나무길, 눈 풍경", fit: "편안" },
  "제주": { slug: "jeju", intl: false, el: "수", mood: "힐링·활동", move1: "비행 약 1시간 10분", move2: "렌터카·버스", point: "겨울 동백 시작, 오름 걷기, 해안도로 드라이브", fit: "편안" },
  "후쿠오카": { slug: "fukuoka", intl: true, el: "화", mood: "온천·미식", move1: "비행 약 1시간 30분", move2: "지하철·버스 / 렌터카", point: "온천 근교(유후인·벳푸), 야타이 거리, 도시 산책", fit: "편안" },
  "오사카·교토": { slug: "osaka-kyoto", intl: true, el: "화", mood: "미식·역사", move1: "비행 약 1시간 50분", move2: "전철 환승 / 렌터카 드묾", point: "교토 단풍 11월 하순, 나라 공원, 도톤보리", fit: "편안" },
  "도쿄": { slug: "tokyo", intl: true, el: "금", mood: "도시·감성", move1: "비행 약 2시간 20분", move2: "지하철·전철 / 렌터카 드묾", point: "일루미네이션 시즌(연말), 근교 가마쿠라 산책", fit: "편안" },
  "삿포로": { slug: "sapporo", intl: true, el: "수", mood: "눈·온천", move1: "비행 약 2시간 40분", move2: "지하철·JR / 렌터카", point: "첫눈 풍경, 오타루 운하, 노천온천", fit: "편안" },
  "오키나와": { slug: "okinawa", intl: true, el: "수", mood: "휴양·바다", move1: "비행 약 2시간 30분", move2: "모노레일·버스 / 렌터카", point: "겨울에도 따뜻한 바다 드라이브, 츄라우미", fit: "보통" },
  "타이베이": { slug: "taipei", intl: true, el: "화", mood: "미식·감성", move1: "비행 약 2시간 30분", move2: "MRT / 택시", point: "야시장, 지우펀 야경, 베이터우 온천", fit: "편안" },
  "홍콩": { slug: "hongkong", intl: true, el: "금", mood: "도시·야경", move1: "비행 약 3시간 40분", move2: "MTR·트램 / 택시", point: "빅토리아 피크 야경, 딤섬, 연말 조명", fit: "편안" },
  "다낭": { slug: "danang", intl: true, el: "수", mood: "휴양·미식", move1: "비행 약 4시간 30분", move2: "택시·그랩 / 렌터카 드묾", point: "미케비치 해변, 호이안 등불 거리", fit: "보통" },
  "방콕": { slug: "bangkok", intl: true, el: "화", mood: "도시·미식", move1: "비행 약 5시간 30분", move2: "BTS·지하철 / 택시·그랩", point: "사원 투어, 야시장, 수상 마켓", fit: "보통" },
  "치앙마이": { slug: "chiangmai", intl: true, el: "목", mood: "힐링·감성", move1: "비행 약 5시간 40분", move2: "썽태우·그랩 / 오토바이·렌터카", point: "올드타운 산책, 산속 카페, 11~12월 건기", fit: "보통" },
  "세부": { slug: "cebu", intl: true, el: "수", mood: "휴양·바다", move1: "비행 약 4시간 30분", move2: "택시·그랩 / 렌터카", point: "바다 액티비티, 섬 투어", fit: "보통" },
  "코타키나발루": { slug: "kotakinabalu", intl: true, el: "수", mood: "휴양·노을", move1: "비행 약 5시간 30분", move2: "택시·그랩 / 렌터카", point: "바닷가 노을, 섬 투어", fit: "보통" },
  "싱가포르": { slug: "singapore", intl: true, el: "금", mood: "도시·야경", move1: "비행 약 6시간 30분", move2: "MRT / 택시·그랩", point: "가든스 바이 더 베이, 연말 조명", fit: "빡빡" },
  "발리": { slug: "bali", intl: true, el: "수", mood: "휴양·감성", move1: "비행 약 7시간", move2: "그랩·기사 포함 차량 / 렌터카", point: "우붓 논뷰 산책, 해변 노을", fit: "빡빡" },
  "괌": { slug: "guam", intl: true, el: "수", mood: "휴양·바다", move1: "비행 약 4시간 30분", move2: "셔틀 / 렌터카", point: "투몬 해변, 노을", fit: "보통" },
};

export const travelImg = (name: string): string | null => (TRAVEL[name] ? `/images/travel/${TRAVEL[name].slug}.webp` : null);

/** 프롬프트에 넣는 짧은 목록: 지역(기운·분위기·일정 적합도) */
export const travelCatalog = (): string => Object.entries(TRAVEL).map(([n, p]) => `${n}(${p.intl ? "해외" : "국내"}·${p.el}·${p.mood}·${p.fit})`).join(" / ");

/** 지역 하나의 코스 재료(이동·이번 철 포인트). 코스를 짤 때 프롬프트에 붙여요. */
export const travelFacts = (name: string): string => {
  const p = TRAVEL[name];
  if (!p) return "";
  return `${name}: 가는 길 ${p.move1} / ${p.intl ? "현지 이동" : "자차"} ${p.move2} / 갈 만한 곳·이번 철 포인트: ${p.point} / 2박 3일 ${p.fit === "빡빡" ? "빠듯해서 3박 4일 권장" : p.fit}`;
};

/** 글(질문·기록)에서 언급된 지역 이름 */
export const regionsIn = (text: string): string[] => Object.keys(TRAVEL).filter((n) => text.includes(n));

/** 지도 검색 링크 (특정 장소 주소가 아니라 검색 주소라서 깨지지 않아요) */
export const travelMapUrl = (name: string): string => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
