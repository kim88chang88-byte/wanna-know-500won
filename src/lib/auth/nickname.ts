/*
 * 이메일 로그인 회원이 직접 정하는 닉네임 규칙.
 * 풀이 속에서 부르는 이름이라 글자·숫자·공백만 2~10자로 제한해요. (callName 과 같은 문자 범위)
 */
export const NICK_MIN = 2;
export const NICK_MAX = 10;

/** 운영자를 사칭하거나 거친 말이 들어간 이름은 막아요. 공백을 뺀 소문자 기준으로 포함 여부를 봐요. */
const BLOCKED = ["운영자", "관리자", "도유사주", "도리", "admin", "administrator", "operator", "staff", "official", "시발", "씨발", "병신", "개새", "좆", "fuck", "shit"];

export type NickCheck = { ok: true; nick: string } | { ok: false; error: string };

export function checkNickname(raw: unknown): NickCheck {
  if (typeof raw !== "string") return { ok: false, error: "닉네임을 입력해 주세요." };
  const nick = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  if (nick.length < NICK_MIN) return { ok: false, error: `닉네임은 ${NICK_MIN}자 이상으로 써 주세요.` };
  if (nick.length > NICK_MAX) return { ok: false, error: `닉네임은 ${NICK_MAX}자까지 쓸 수 있어요.` };
  if (!/^[0-9A-Za-z가-힣 ]+$/.test(nick)) return { ok: false, error: "닉네임에는 한글·영문·숫자·공백만 쓸 수 있어요. (이모지·특수문자는 안 돼요)" };
  const flat = nick.replace(/ /g, "").toLowerCase();
  if (BLOCKED.some((w) => flat.includes(w))) return { ok: false, error: "쓸 수 없는 이름이에요. 다른 이름으로 정해 주세요." };
  return { ok: true, nick };
}
