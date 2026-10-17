const AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize";
const TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
const ME_URL = "https://openapi.naver.com/v1/nid/me";

export interface NaverConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface NaverProfile {
  /** 다른 로그인과 겹치지 않도록 n_ 접두어를 붙인 회원 식별자 */
  id: string;
  nickname?: string;
}

export class NaverAuthError extends Error {}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** 네이버 로그인 화면 주소. 받을 정보(회원 이름·별명 등)는 네이버 개발자센터의 '제공 정보 선택'에서 정해요. */
export function buildNaverAuthorizeUrl(config: NaverConfig, state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

/**
 * 인가 코드를 받아 네이버 회원 고유 ID·별명만 가져와요.
 * 액세스 토큰은 저장하지 않고, 오류 메시지에는 상태 코드만 담아요.
 */
export async function fetchNaverProfile(
  config: NaverConfig,
  code: string,
  state: string,
  fetchImpl: FetchLike = fetch,
): Promise<NaverProfile> {
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    state,
  });
  const tokenRes = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!tokenRes.ok) throw new NaverAuthError(`token HTTP ${tokenRes.status}`);
  const token = (await tokenRes.json()) as { access_token?: unknown; error?: unknown };
  // 네이버는 실패해도 200 으로 error 필드를 줄 때가 있어요.
  if (typeof token.access_token !== "string" || !token.access_token) {
    throw new NaverAuthError("token missing");
  }

  const meRes = await fetchImpl(ME_URL, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!meRes.ok) throw new NaverAuthError(`me HTTP ${meRes.status}`);
  const me = (await meRes.json()) as { resultcode?: unknown; response?: { id?: unknown; nickname?: unknown } };
  const id = me.response?.id;
  if (me.resultcode !== "00" || typeof id !== "string" || !/^[0-9A-Za-z_-]{1,60}$/.test(id)) {
    throw new NaverAuthError("me missing id");
  }
  const nick = me.response?.nickname;
  return {
    id: `n_${id}`,
    nickname: typeof nick === "string" && nick.trim() ? nick.trim().slice(0, 20) : undefined,
  };
}
