/** 사용자가 입력한 값이 잘못됐을 때 던지는 오류. API 라우트에서 400 으로 변환합니다. */
export class SajuInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SajuInputError";
  }
}
