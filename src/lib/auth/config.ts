import type { KakaoConfig } from "./kakao";
import { isSecretValid } from "./session";

/** 환경변수 모음. (process.env 를 그대로 넘길 수 있게 아무 이름이나 받아요) */
export type AuthEnv = Record<string, string | undefined>;

/** 로그인에 필요한 설정이 다 있을 때만 값을 돌려줘요. (없으면 null → "준비 중" 안내) */
export function loadAuthConfig(
  env: AuthEnv,
  requestUrl: string,
): { kakao: KakaoConfig; secret: string } | null {
  if (!env.KAKAO_CLIENT_ID || !isSecretValid(env.AUTH_SECRET)) return null;
  const redirectUri = env.KAKAO_REDIRECT_URI || new URL("/api/auth/kakao/callback", requestUrl).toString();
  return {
    kakao: { clientId: env.KAKAO_CLIENT_ID, clientSecret: env.KAKAO_CLIENT_SECRET || undefined, redirectUri },
    secret: env.AUTH_SECRET,
  };
}
