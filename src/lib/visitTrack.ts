/** 방문 출처·핵심 행동(퍼널) 기록에 쓰는 공용 규칙. 서버와 브라우저가 같이 써요. 입력값(생일·글·이름)은 절대 넣지 않아요. */

export const TRACK_EVENTS = ["bday_read", "draw_start", "draw_done", "login_click", "chat_login_click", "login_done", "signup"] as const;
export type TrackEvent = (typeof TRACK_EVENTS)[number];

/** 관리자 화면에 보여 줄 순서와 이름 */
export const FUNNEL_STEPS: Array<{ key: "visit" | TrackEvent; label: string }> = [
  { key: "visit", label: "방문" },
  { key: "bday_read", label: "한마디 열람" },
  { key: "draw_start", label: "뽑기 시작" },
  { key: "draw_done", label: "뽑기 완료" },
  { key: "login_click", label: "로그인 클릭" },
  { key: "chat_login_click", label: "상담 로그인 클릭" },
  { key: "login_done", label: "로그인 완료" },
  { key: "signup", label: "신규 가입" },
];

export function isTrackEvent(v: unknown): v is TrackEvent {
  return typeof v === "string" && (TRACK_EVENTS as readonly string[]).includes(v);
}

/** 로그인 창이 거쳐 가는 주소는 '어디서 왔는지'가 아니라서 출처로 세지 않아요. */
const LOGIN_HOSTS = ["kauth.kakao.com", "accounts.kakao.com", "accounts.google.com", "nid.naver.com"];

/** 레퍼러 주소에서 도메인만 뽑아요. (경로·검색어는 버려요) 우리 사이트이거나 이상하면 빈 문자열 */
export function refererHost(referrer: string | null | undefined, ownHost: string | null | undefined): string {
  if (!referrer) return "";
  try {
    const h = new URL(referrer).hostname.toLowerCase().replace(/^(www|m|l|mobile)\./, "");
    if (!/^[a-z0-9.-]{3,60}$/.test(h)) return "";
    const own = (ownHost ?? "").toLowerCase().replace(/^www\./, "").replace(/:\d+$/, "");
    if (LOGIN_HOSTS.includes(h)) return "";
    if (own && (h === own || h.endsWith(`.${own}`))) return "";
    return h;
  } catch {
    return "";
  }
}

const cleanTag = (v: unknown): string => (typeof v === "string" ? v.toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 30) : "");

/** 처음 온 경로 이름. 친구 초대 > utm_source > 레퍼러 도메인 > 직접 접속 */
export function sourceLabel(input: { friend?: unknown; utm?: unknown; host?: unknown }): string {
  if (input.friend === true) return "friend";
  const utm = cleanTag(input.utm);
  if (utm) return `utm:${utm}`;
  const host = typeof input.host === "string" ? input.host.toLowerCase().replace(/[^a-z0-9.-]/g, "").slice(0, 60) : "";
  if (host.length >= 3) return `web:${host}`;
  return "direct";
}
