/**
 * 프리미엄 첫 장의 "이게 내 글자야" 장면. 여덟 글자 중 대장 노릇을 하는 글자(일간) 하나를
 * 자연 풍경(이슬비·큰 산…) 위에 크게 보여 줘요.
 */
export interface DayMasterInfo {
  /** 한글 이름 (예: 계수) */
  ko: string;
  /** 오행 한자 (예: 水) */
  el: string;
  /** 자연 비유 (예: 이슬비) */
  nature: string;
  /** 풍경에 흩뿌릴 그림 */
  emoji: string;
  /** 풍경 배경 그라데이션 (안쪽, 바깥쪽) */
  bg: [string, string];
  /** 한자 글자색 */
  ink: string;
  say: string;
  tags: [string, string, string];
}

export const DAY_MASTER: Record<string, DayMasterInfo> = {
  甲: { ko: "갑목", el: "木", nature: "큰 나무", emoji: "🌳", bg: ["#3f8f4f", "#1d4d2e"], ink: "#7fe0a0", say: "곧게 위로 뻗는 큰 나무 같은 사람이야. 시작하는 힘이 세고 정직해서 앞장서는 걸 좋아해.", tags: ["개척", "정직", "추진력"] },
  乙: { ko: "을목", el: "木", nature: "덩굴·풀꽃", emoji: "🌿", bg: ["#6fb27f", "#2c5a3a"], ink: "#a6e8b8", say: "바람에 휘어도 꺾이지 않는 풀꽃 같은 사람이야. 부드럽게 어우러지면서 끈질기게 살아남아.", tags: ["유연함", "적응력", "끈기"] },
  丙: { ko: "병화", el: "火", nature: "해", emoji: "☀️", bg: ["#f0902c", "#8a3b12"], ink: "#ffd27a", say: "세상을 환하게 비추는 해 같은 사람이야. 밝고 열정적이라 어디서든 분위기를 끌어올려.", tags: ["열정", "솔직함", "리더십"] },
  丁: { ko: "정화", el: "火", nature: "촛불", emoji: "🕯️", bg: ["#c8602a", "#4a2013"], ink: "#ffc78c", say: "어둠 속을 은은하게 밝히는 촛불 같은 사람이야. 따뜻하고 섬세해서 마음을 오래 데워 줘.", tags: ["따뜻함", "섬세함", "집중력"] },
  戊: { ko: "무토", el: "土", nature: "큰 산", emoji: "⛰️", bg: ["#a98748", "#5a4524"], ink: "#f0d9a0", say: "묵직하게 자리를 지키는 큰 산 같은 사람이야. 믿음직하고 포용력이 커서 곁에 있으면 든든해.", tags: ["신뢰", "포용", "안정"] },
  己: { ko: "기토", el: "土", nature: "부드러운 논밭", emoji: "🌾", bg: ["#b99650", "#5c4a22"], ink: "#ffe2a0", say: "씨앗을 키워 내는 논밭 같은 사람이야. 다정하게 보살피고 현실 감각도 좋아.", tags: ["보살핌", "실속", "꼼꼼함"] },
  庚: { ko: "경금", el: "金", nature: "단단한 바위", emoji: "🪨", bg: ["#8892a6", "#3b4252"], ink: "#dfe6f5", say: "단단한 바위 같은 사람이야. 결단력과 의리가 있어서 한 번 정하면 끝까지 밀고 가.", tags: ["결단", "의리", "강단"] },
  辛: { ko: "신금", el: "金", nature: "반짝이는 보석", emoji: "💎", bg: ["#9aa3d8", "#3a3a5c"], ink: "#e6ebff", say: "갈고닦을수록 빛나는 보석 같은 사람이야. 섬세하고 감각이 좋아서 완성도에 진심이야.", tags: ["섬세", "미적 감각", "자존심"] },
  壬: { ko: "임수", el: "水", nature: "넓은 강", emoji: "🌊", bg: ["#2f7fd0", "#12356b"], ink: "#9fd0ff", say: "넓게 흘러가는 강 같은 사람이야. 스케일이 크고 생각이 자유로워서 길을 잘 찾아내.", tags: ["지혜", "융통성", "큰 그림"] },
  癸: { ko: "계수", el: "水", nature: "이슬비", emoji: "🌧️", bg: ["#5b8fc4", "#1d3b63"], ink: "#9cc7f2", say: "조용히 스며드는 이슬비 같은 사람이야. 관찰력이 뛰어나고 직관이 좋아서 분위기를 잘 읽어.", tags: ["직관", "관찰력", "은근한 끈기"] },
};

export const dayMasterOf = (stem: string | null | undefined): DayMasterInfo | null => (stem ? DAY_MASTER[stem] ?? null : null);
