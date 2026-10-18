import { timingSafeEqual } from "node:crypto";

/**
 * 카카오 "연결 끊기 웹훅" 처리 도우미예요.
 * 이용자가 카카오 계정 설정에서 이 서비스 연결을 끊거나 카카오 계정을 지우면, 카카오가 우리 주소로 알려줘요.
 * 요청은 `Authorization: KakaoAK ${앱 어드민 키}` 헤더로 카카오가 보낸 것인지 확인해요.
 */

/** 카카오 회원번호는 숫자예요. 구글(g_…)·네이버(n_…) 회원은 이 웹훅으로 지우지 않아요. */
const KAKAO_ID = /^\d{1,20}$/;

/** 어드민 키가 맞는지 시간 차이로 새어 나가지 않게(timing-safe) 비교해요. */
export function verifyKakaoAdminAuth(header: string | null, adminKey: string | undefined): boolean {
  const key = adminKey?.trim();
  if (!key || !header) return false;
  const m = /^KakaoAK\s+(.+)$/i.exec(header.trim());
  if (!m) return false;
  const given = Buffer.from(m[1].trim());
  const expected = Buffer.from(key);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export interface UnlinkEvent {
  /** 카카오 회원번호(숫자 문자열) */
  userId: string;
  /** ACCOUNT_DELETE, UNLINK_FROM_APPS 등. 로그용이에요. */
  referrerType: string;
}

/** 쿼리(GET) 또는 폼(POST)에서 회원번호와 사유를 읽어요. 이상하면 null. */
export function parseUnlinkParams(params: URLSearchParams): UnlinkEvent | null {
  const userId = params.get("user_id")?.trim() ?? "";
  if (!KAKAO_ID.test(userId)) return null;
  const referrerType = (params.get("referrer_type") ?? "").trim().replace(/[^A-Z_]/g, "").slice(0, 40) || "UNKNOWN";
  return { userId, referrerType };
}
