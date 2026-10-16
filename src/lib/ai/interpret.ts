import type { SajuChart } from "@/lib/saju/types";

/**
 * 계산된 사주 명식을 받아 풀이 문장을 생성합니다.
 *
 * TODO: Claude API 연동
 *  - 서버에서만 호출 (ANTHROPIC_API_KEY 는 절대 클라이언트로 내보내지 않기)
 *  - 명식(JSON)을 근거로 풀이하도록 프롬프트 설계
 *  - 500원 가격에 맞는 모델/토큰 예산 결정
 */
export async function interpretSaju(_chart: SajuChart): Promise<string> {
  throw new Error("NOT_IMPLEMENTED: interpretSaju");
}
