/*
 * 상담실 메뉴·취미 추천 카드의 그림 목록. 그림은 미리 만들어 둔 스티커(public/images/foods, public/images/hobbies)를 써요.
 * 파일이 아직 없으면 화면이 이모지로 대신 보여 줘요. [영문 파일 이름, 대신 보일 이모지]
 */
export const FOOD_ART: Record<string, [string, string]> = {
  "샐러드": ["salad", "🥗"], "과일 요거트": ["fruit-yogurt", "🍓"], "나물 비빔밥": ["namul-bibimbap", "🍚"], "쌈밥": ["ssambap", "🥬"], "비빔국수": ["bibim-guksu", "🍜"], "나물 정식": ["namul-set", "🍱"],
  "채소 샤브샤브": ["veg-shabu", "🍲"], "보쌈과 쌈 채소": ["bossam", "🥬"], "오이·부추 반찬 한 상": ["veg-banchan", "🥒"],
  "따뜻한 죽": ["porridge", "🥣"], "토스트와 따뜻한 차": ["toast-tea", "🍞"], "불향 볶음밥": ["fried-rice", "🍳"], "매콤한 덮밥": ["spicy-donburi", "🌶️"], "닭갈비": ["dakgalbi", "🍗"], "삼겹살 구이": ["samgyeopsal", "🥓"], "카레": ["curry", "🍛"], "마라 계열 요리": ["mala", "🌶️"],
  "고구마": ["sweet-potato", "🍠"], "단호박죽": ["pumpkin-porridge", "🎃"], "곡물 시리얼": ["cereal", "🥣"], "비빔밥": ["bibimbap", "🍚"], "곡물밥 정식": ["grain-set", "🍱"], "감자 요리": ["potato", "🥔"], "찜닭": ["jjimdak", "🍗"], "수육": ["suyuk", "🥩"],
  "배나 사과": ["pear-apple", "🍐"], "흰죽": ["white-porridge", "🥣"], "두부 요리": ["tofu", "🧈"], "흰살생선 구이": ["white-fish", "🐟"], "두부 정식": ["tofu-set", "🍱"], "닭가슴살 샐러드": ["chicken-salad", "🥗"], "담백한 생선구이": ["grilled-fish", "🐟"], "닭백숙": ["baeksuk", "🍲"], "무 요리": ["radish", "🥕"],
  "미역국": ["miyeokguk", "🍲"], "따뜻한 두유": ["soymilk", "🥛"], "국물 칼국수": ["kalguksu", "🍜"], "순두부찌개": ["sundubu", "🍲"], "해물탕": ["haemultang", "🦐"], "해산물 요리": ["seafood", "🦐"], "전복죽": ["abalone-porridge", "🥣"], "검은콩 요리": ["black-bean", "🫘"],
};

export const HOBBY_ART: Record<string, [string, string]> = {
  "화분 가꾸기": ["gardening-pot", "🪴"], "스트레칭·요가": ["yoga", "🧘"], "독서": ["reading", "📖"], "독서 모임": ["book-club", "📚"], "원데이 클래스": ["oneday-class", "🎨"], "가벼운 등산": ["hiking", "🥾"], "공원 산책": ["park-walk", "🌳"],
  "노래나 악기": ["sing-play", "🎤"], "그림": ["drawing", "🖍️"], "영상 만들기": ["video-making", "🎬"], "공연 보러 가기": ["concert", "🎭"], "댄스 수업": ["dance", "💃"], "친구 모임": ["friends", "🥳"], "캠핑 불멍": ["camping-fire", "🔥"], "야외 공연": ["outdoor-show", "🎪"],
  "베이킹·요리": ["baking", "🧁"], "도예": ["pottery", "🏺"], "방 정리": ["tidy-room", "🧺"], "가족·친구와 같이 요리": ["cook-together", "🍳"], "텃밭 가꾸기": ["vegetable-garden", "🥕"], "느긋한 걷기": ["slow-walk", "🚶"],
  "캘리그라피": ["calligraphy", "🖌️"], "퍼즐": ["puzzle", "🧩"], "악기 연주": ["instrument", "🎹"], "보드게임": ["boardgame", "🎲"], "스터디 모임": ["study-group", "✏️"], "실내 클라이밍": ["climbing", "🧗"], "수영": ["swimming", "🏊"],
  "일기·글쓰기": ["journaling", "📓"], "음악 감상": ["listening", "🎧"], "명상": ["meditation", "🧘"], "깊은 대화 모임": ["deep-talk", "💬"], "영화 모임": ["movie-night", "🎞️"], "물가 산책": ["waterside-walk", "🌊"], "온천·찜질": ["hot-spring", "♨️"],
};

/** 카드 한 칸의 그림 주소와 대신 보일 이모지. 목록에 없으면 null */
export function artFor(kind: "food" | "hobby", label: string): { src: string; emoji: string } | null {
  const hit = (kind === "food" ? FOOD_ART : HOBBY_ART)[label];
  return hit ? { src: `/images/${kind === "food" ? "foods" : "hobbies"}/${hit[0]}.webp`, emoji: hit[1] } : null;
}
