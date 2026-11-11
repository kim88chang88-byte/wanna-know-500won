import { isCompatFortune } from "@/lib/premium/compat";

/** 질문지에서 말하는 도리의 얼굴: 보고 있는 풀이에 맞는 모습으로 보여 줘. (프리미엄은 진화한 도리) */
export function doriFace(fortune: string, premium?: boolean): string {
  const img = (n: string) => `/images/animal-${n}.webp`;
  if (premium && !isCompatFortune(fortune)) return img("otter-awakened");
  if (isCompatFortune(fortune)) return img("panda-wedding");
  if (/신년/.test(fortune)) return img("otter-newyear");
  if (/연애|결혼/.test(fortune)) return img("panda-couple");
  if (/재물/.test(fortune)) return img("rabbit-rich");
  if (/건강/.test(fortune)) return img("fox-run");
  if (/성공/.test(fortune)) return img("dragon");
  return img("otter");
}
