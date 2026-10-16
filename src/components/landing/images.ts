import manifest from "./imageManifest.json";

/*
 * 랜딩 이미지 주소입니다.
 * imageManifest.json 에는 처음에 Stitch 가 호스팅한 주소가 들어 있고(만료될 수 있어요),
 * `npm run fetch-images` 를 한 번 실행하면 public/images/ 로 내려받고 이 파일의 값이 "/images/..." 로 바뀝니다.
 * 6종 자판기 카드는 모두 같은 이미지(machine)를 씁니다.
 */
export const HOBO_IMAGE: string = manifest.hobo;
export const PREMIUM_MACHINE_IMAGE: string = manifest.premiumMachine;
export const MACHINE_IMAGE: string = manifest.machine;
