import manifest from "./imageManifest.json";

/*
 * 랜딩 이미지 주소입니다. (수달 도사 '도리' 테마)
 * imageManifest.json 에는 처음에 Stitch 가 호스팅한 주소가 들어 있고(만료될 수 있어요),
 * `npm run fetch-images` 를 실행하거나 public/images/<이름>.png 로 직접 저장해 두면 "/images/..." 로 바뀝니다.
 * 이미지가 없거나 불러오지 못해도 화면이 깨지지 않도록 SafeImage 가 이모지 자리 표시로 바꿔 보여줘요.
 */
export const IMAGES = manifest as Readonly<Record<string, string>>;

export const LOGO_IMAGE: string = manifest.logo;
export const HERO_IMAGE: string = manifest.hero;
