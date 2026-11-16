/*
 * 공유·초대 링크와 카드에 넣는 "대표 주소"예요.
 * 이전 주소(vercel.app)나 미리보기 주소로 들어온 사람이 공유해도 친구에게는 항상 대표 도메인이 가도록,
 * NEXT_PUBLIC_SITE_URL(https 주소)이 있으면 그 주소를 쓰고, 없으면 지금 접속한 주소를 그대로 써요.
 */

/** 설정값이 올바른 https 주소면 그 주소(경로 없이)를, 아니면 current 를 돌려줘요. */
export function canonicalOrigin(configured: string | undefined | null, current: string): string {
  const c = (configured ?? "").trim();
  if (c) {
    try {
      const u = new URL(c);
      if (u.protocol === "https:" && !u.username && !u.password) return u.origin;
    } catch {
      // 잘못된 설정값이면 지금 주소를 써요
    }
  }
  return current;
}

/** 브라우저에서 공유 링크의 기준 주소. (서버 렌더링 중에는 빈 문자열) */
export function siteOrigin(): string {
  const current = typeof window === "undefined" ? "" : window.location.origin;
  return canonicalOrigin(process.env.NEXT_PUBLIC_SITE_URL, current);
}

/** 카드 아래에 작게 적는 주소 글자 (예: www.doyusaju.com) */
export function siteHost(): string {
  try {
    return new URL(siteOrigin()).host;
  } catch {
    return "";
  }
}
