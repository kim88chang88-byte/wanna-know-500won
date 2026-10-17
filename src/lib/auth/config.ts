import type { GoogleConfig } from "./google";
import type { KakaoConfig } from "./kakao";
import type { NaverConfig } from "./naver";
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

/** 구글 로그인 설정. 클라이언트 ID·비밀번호·AUTH_SECRET 이 모두 있을 때만 값을 돌려줘요. */
export function loadGoogleAuthConfig(
  env: AuthEnv,
  requestUrl: string,
): { google: GoogleConfig; secret: string } | null {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !isSecretValid(env.AUTH_SECRET)) return null;
  const redirectUri = env.GOOGLE_REDIRECT_URI || new URL("/api/auth/google/callback", requestUrl).toString();
  return {
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, redirectUri },
    secret: env.AUTH_SECRET,
  };
}

/** 네이버 로그인 설정. 클라이언트 ID·시크릿·AUTH_SECRET 이 모두 있을 때만 값을 돌려줘요. */
export function loadNaverAuthConfig(
  env: AuthEnv,
  requestUrl: string,
): { naver: NaverConfig; secret: string } | null {
  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET || !isSecretValid(env.AUTH_SECRET)) return null;
  const redirectUri = env.NAVER_REDIRECT_URI || new URL("/api/auth/naver/callback", requestUrl).toString();
  return {
    naver: { clientId: env.NAVER_CLIENT_ID, clientSecret: env.NAVER_CLIENT_SECRET, redirectUri },
    secret: env.AUTH_SECRET,
  };
}
