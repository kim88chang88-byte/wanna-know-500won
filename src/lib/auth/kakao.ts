const AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
const TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const ME_URL = "https://kapi.kakao.com/v2/user/me";

export interface KakaoConfig {
  clientId: string;
  /** 카카오 개발자 콘솔에서 Client secret 을 켜 두었다면 필요해요. */
  clientSecret?: string;
  redirectUri: string;
}

export interface KakaoProfile {
  id: string;
  nickname?: string;
}

export class KakaoAuthError extends Error {}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** 닉네임 동의항목 ID. 아직 동의하지 않은 사용자에게는 로그인 때 동의를 한 번 더 물어요. (콘솔에서 닉네임 동의항목을 켜 둬야 해요) */
export const NICKNAME_SCOPE = "profile_nickname";

/** 카카오 로그인 화면 주소. 받는 정보는 닉네임뿐이에요. */
export function buildAuthorizeUrl(config: KakaoConfig, state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", NICKNAME_SCOPE);
  return url.toString();
}

/**
 * 인가 코드를 받아 카카오 회원번호·닉네임만 가져와요.
 * 액세스 토큰은 이 함수 안에서만 쓰고 저장하지 않아요. 오류 메시지에는 상태 코드만 담아요(키·응답 본문 제외).
 */
export async function fetchKakaoProfile(
  config: KakaoConfig,
  code: string,
  fetchImpl: FetchLike = fetch,
): Promise<KakaoProfile> {
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code,
  });
  if (config.clientSecret) form.set("client_secret", config.clientSecret);

  const tokenRes = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: form.toString(),
  });
  if (!tokenRes.ok) throw new KakaoAuthError(`token HTTP ${tokenRes.status}`);
  const token = (await tokenRes.json()) as { access_token?: unknown };
  if (typeof token.access_token !== "string" || !token.access_token) {
    throw new KakaoAuthError("token missing");
  }

  const meRes = await fetchImpl(ME_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) throw new KakaoAuthError(`me HTTP ${meRes.status}`);
  const me = (await meRes.json()) as {
    id?: unknown;
    kakao_account?: { profile?: { nickname?: unknown } };
    properties?: { nickname?: unknown };
  };
  if (typeof me.id !== "number" && typeof me.id !== "string") throw new KakaoAuthError("me missing id");
  // 예전 방식(properties)으로만 내려오는 경우도 있어서 함께 확인해요.
  const nick = me.kakao_account?.profile?.nickname ?? me.properties?.nickname;
  return {
    id: String(me.id),
    nickname: typeof nick === "string" && nick.trim() ? nick.trim().slice(0, 20) : undefined,
  };
}
