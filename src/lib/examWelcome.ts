/*
 * 수험생 환영 팝업: 수능이 끝난 시기에 첫 화면에서 한 번 보여 줘요.
 * "오늘 하루 보지 않기"를 체크하고 닫으면 그날(KST)은 다시 보여주지 않고,
 * 마지막 날(EXAM_WELCOME_UNTIL) 다음 날부터는 아예 뜨지 않아요.
 */
export const EXAM_WELCOME_KEY = "wanna500_exam_welcome_hide";
/** 이 날짜(KST, 포함)까지만 보여 줘요 */
export const EXAM_WELCOME_UNTIL = "2026-12-31";

export function shouldShowExamWelcome(stored: string | null, today: string): boolean {
  if (today > EXAM_WELCOME_UNTIL) return false;
  return stored !== today;
}
