/**
 * 질문지에서 말하는 도리의 얼굴. 자판기 카드·상담실 대화방과 같은 동물이야.
 * 성공=용, 재물=부자 토끼, 연애·결혼=판다 커플, 궁합=판다 웨딩, 건강=달리는 여우, 신년=새해 수달, 그 밖=수달
 */
export function doriFace(fortune: string, _premium?: boolean): string {
  const img = (n: string) => `/images/animal-${n}.webp`;
  if (/궁합/.test(fortune)) return img("panda-wedding");
  if (/연애|결혼/.test(fortune)) return img("panda-couple");
  if (/재물/.test(fortune)) return img("rabbit-rich");
  if (/건강/.test(fortune)) return img("fox-run");
  if (/성공/.test(fortune)) return img("dragon");
  if (/신년/.test(fortune)) return img("otter-newyear");
  return img("otter");
}
