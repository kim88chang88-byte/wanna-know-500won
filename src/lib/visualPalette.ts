/* 도리 카드에 쓰는 색 이름 목록. 이 목록에 없는 색 이름은 카드로 만들지 않아요. */
export const PALETTE: Record<string, { hex: string; en: string }> = {
  "펄 화이트": { hex: "#F4F1EA", en: "PEARL WHITE" },
  "크림 베이지": { hex: "#E6D5B8", en: "CREAM BEIGE" },
  "라벤더 그레이": { hex: "#B7B0CF", en: "LAVENDER GRAY" },
  "스카이 블루": { hex: "#9CCBEA", en: "SKY BLUE" },
  "네이비": { hex: "#243B6B", en: "NAVY" },
  "민트 그린": { hex: "#A8DCC6", en: "MINT GREEN" },
  "올리브 그린": { hex: "#8A9A5B", en: "OLIVE GREEN" },
  "코랄": { hex: "#F08A76", en: "CORAL" },
  "로즈 핑크": { hex: "#E9A9B8", en: "ROSE PINK" },
  "버건디": { hex: "#7B2D3B", en: "BURGUNDY" },
  "머스터드": { hex: "#D9A93A", en: "MUSTARD" },
  "골드": { hex: "#C9A24B", en: "GOLD" },
  "실버": { hex: "#C3C7CE", en: "SILVER" },
  "차콜 그레이": { hex: "#4A4E57", en: "CHARCOAL" },
  "브라운": { hex: "#7A5436", en: "BROWN" },
  "로열 퍼플": { hex: "#6B4FC4", en: "ROYAL PURPLE" },
};

/* 방 그림(room-spots.webp, 905×632)에서 말풍선이 앉는 자리. 값은 그림 크기에 대한 % 예요. */
export const SPOTS: Record<string, { left: number; top: number; w: number }> = {
  "책상 위": { left: 74.5, top: 17.5, w: 21 },
  "침대 곁": { left: 34, top: 66, w: 22 },
  "창가 선반": { left: 0.4, top: 47.2, w: 22.5 },
};
