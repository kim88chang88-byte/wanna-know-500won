/**
 * 도리 카드의 "어울리는 향" 목록. 이 목록에 없는 향 이름은 카드로 만들지 않아요.
 * 이미지는 미리 만들어 둔 그림(public/images/scents)을 그대로 써요.
 */
export const SCENTS: Record<string, { key: string; en: string }> = {
  "그린 허브": { key: "green-herb", en: "GREEN HERB" },
  라벤더: { key: "lavender", en: "LAVENDER" },
  우드: { key: "wood", en: "WOOD" },
  시트러스: { key: "citrus", en: "CITRUS" },
  페퍼민트: { key: "peppermint", en: "PEPPERMINT" },
  바닐라: { key: "vanilla", en: "VANILLA" },
  장미: { key: "rose", en: "ROSE" },
  머스크: { key: "musk", en: "MUSK" },
  샌들우드: { key: "sandalwood", en: "SANDALWOOD" },
  베르가못: { key: "bergamot", en: "BERGAMOT" },
  재스민: { key: "jasmine", en: "JASMINE" },
  "클린 코튼": { key: "clean-cotton", en: "CLEAN COTTON" },
  시더우드: { key: "cedar", en: "CEDARWOOD" },
  유칼립투스: { key: "eucalyptus", en: "EUCALYPTUS" },
  티트리: { key: "tea-tree", en: "TEA TREE" },
  "바다 소금": { key: "sea-salt", en: "SEA SALT" },
};

export const scentSrc = (label: string): string | null => {
  const s = SCENTS[label];
  return s ? `/images/scents/${s.key}.webp` : null;
};
