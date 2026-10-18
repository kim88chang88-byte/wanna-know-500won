/**
 * 관리자 판별. 로그인한 회원의 고유번호(session.sub)가 ADMIN_USER_IDS 목록에 있을 때만 관리자예요.
 * 목록은 환경변수에만 두고(쉼표로 구분), 코드나 화면에는 넣지 않아요. 비어 있으면 아무도 관리자가 아니에요.
 * 고유번호 모양: 카카오 "12345678", 구글 "g_...", 네이버 "n_..."
 */
export function adminIds(env: Record<string, string | undefined>): string[] {
  return (env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAdmin(sub: string | null | undefined, env: Record<string, string | undefined>): boolean {
  return !!sub && adminIds(env).includes(sub);
}
