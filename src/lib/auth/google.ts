const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleProfile {
  /** 카카오 회원번호와 겹치지 않도록 g_ 접두어를 붙인 회원 식별자 */
  id: string;
  nickname?: string;
}

export class GoogleAuthError extends Error {}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** 구글 계정 고유번호(sub)와 이름만 받아요. 이메일·사진은 요청하지 않아요. */
export const GOOGLE_SCOPE = "openid profile";

/** 구글 로그인 화면 주소 */
export function buildGoogleAuthorizeUrl(config: GoogleConfig, state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPE);
  url.searchParams.set("state", state);
  return url.toString();
}

/** 인가 코드를 받아 구글 고유번호·이름만 가져와요. 액세스 토큰은 저장하지 않고, 오류 메시지에는 상태 코드만 담아요. */
export async function fetchGoogleProfile(
  config: GoogleConfig,
  code: string,
  fetchImpl: FetchLike = fetch,
): Promise<GoogleProfile> {
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
  });
  const tokenRes = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!tokenRes.ok) throw new GoogleAuthError(`token HTTP ${tokenRes.status}`);
  const token = (await tokenRes.json()) as { access_token?: unknown };
  if (typeof token.access_token !== "string" || !token.access_token) {
    throw new GoogleAuthError("token missing");
  }

  const meRes = await fetchImpl(USERINFO_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) throw new GoogleAuthError(`me HTTP ${meRes.status}`);
  const me = (await meRes.json()) as { sub?: unknown; name?: unknown; given_name?: unknown };
  if (typeof me.sub !== "string" || !/^[0-9A-Za-z_-]{1,60}$/.test(me.sub)) {
    throw new GoogleAuthError("me missing sub");
  }
  const nick = typeof me.name === "string" && me.name.trim() ? me.name : me.given_name;
  return {
    id: `g_${me.sub}`,
    nickname: typeof nick === "string" && nick.trim() ? nick.trim().slice(0, 20) : undefined,
  };
}
