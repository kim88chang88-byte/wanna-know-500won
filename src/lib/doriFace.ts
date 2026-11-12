/** 질문지에서 말하는 도리의 얼굴: 프리미엄 본문에 나오는 도리와 같은 모습이야. (연애·결혼 = 토끼, 그 밖 = 수달) */
export function doriFace(fortune: string, _premium?: boolean): string {
  const img = (n: string) => `/images/animal-${n}.webp`;
  if (/연애|결혼/.test(fortune)) return img("rabbit");
  return img("otter");
}
