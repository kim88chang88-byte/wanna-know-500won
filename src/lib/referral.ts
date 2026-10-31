/*
 * 친구 초대(추천 코드)의 브라우저 쪽 도우미예요.
 * 코드는 영문 대문자·숫자 8자리의 무작위 값이라 이름·연락처가 드러나지 않아요.
 */

export const REF_KEY = "wanna500:ref:v1";
export const MYCODE_KEY = "wanna500:mycode:v1";
const CODE = /^[A-Z0-9]{6,12}$/;

import type { StorageLike } from "./drawCounter";

type Store = StorageLike | null;

/** 입력·주소에서 읽은 값을 코드 모양으로 다듬어요. 아니면 null. */
export function cleanRefCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toUpperCase();
  return CODE.test(c) ? c : null;
}

/** 주소(?ref=CODE)에서 추천 코드를 읽어요. */
export function refFromSearch(search: string): string | null {
  try {
    return cleanRefCode(new URLSearchParams(search).get("ref"));
  } catch {
    return null;
  }
}

export function saveRef(st: Store, code: string) {
  try {
    st?.setItem(REF_KEY, code);
  } catch {
    // 저장이 막혀 있으면 이번 방문에서만 써요
  }
}
export function readRef(st: Store): string | null {
  try {
    return cleanRefCode(st?.getItem(REF_KEY));
  } catch {
    return null;
  }
}
export function clearRef(st: Store) {
  try {
    st?.setItem(REF_KEY, ""); // 저장소 규격에 삭제가 없어서 빈 값으로 덮어써요 (읽을 때 코드 모양이 아니면 없는 걸로 봐요)
  } catch {
    // 무시
  }
}

export function saveMyCode(st: Store, code: string) {
  try {
    st?.setItem(MYCODE_KEY, code);
  } catch {
    // 무시
  }
}
export function readMyCode(st: Store): string | null {
  try {
    return cleanRefCode(st?.getItem(MYCODE_KEY));
  } catch {
    return null;
  }
}

/** 공유 주소에 내 추천 코드를 붙여요. (로그인하지 않았거나 코드를 모르면 그대로) */
export function withRef(url: string, code: string | null): string {
  if (!code) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("ref", code);
    return u.toString();
  } catch {
    return url;
  }
}

/** 서버가 돌려준 입력 결과를 쉬운 말로 바꿔요. */
export function redeemMessage(result: string): { ok: boolean; text: string } {
  switch (result) {
    case "ok":
      return { ok: true, text: "친구 초대 코드가 적용됐어요! 첫 풀이를 마치면 두 분 모두 500원 뽑기 1회를 받아요 🎁" };
    case "bad_code":
      return { ok: false, text: "없는 코드예요. 친구에게 코드를 다시 확인해 보세요." };
    case "self":
      return { ok: false, text: "내 코드는 내가 입력할 수 없어요. 친구에게 공유해 주세요." };
    case "already":
      return { ok: false, text: "이미 친구 초대 코드를 입력하셨어요." };
    case "too_old":
      return { ok: false, text: "초대 코드는 가입 후 7일 안에만 입력할 수 있어요." };
    case "used_draw":
      return { ok: false, text: "이미 뽑기를 해 보신 계정은 입력할 수 없어요. 새로 가입한 친구에게 공유해 주세요." };
    default:
      return { ok: false, text: "지금은 코드를 확인하지 못했어요. 잠시 뒤에 다시 해 주세요." };
  }
}

/** 다시 시도해도 결과가 같은 실패라서, 저장해 둔 코드를 지워도 되는 결과인지 */
export function isFinalRedeem(result: string): boolean {
  return result !== "failed" && result !== "";
}
