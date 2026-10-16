import type { KakaoConfig } from "./kakao";
import { isSecretValid } from "./session";

export interface AuthEnv {
  KAKAO_CLIENT_ID?: string;
  KAKAO_CLIENT_SECRET?: string;
  KAKAO_REDIRECT_URI?: string;
  AUTH_SECRET?: string;
}

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
