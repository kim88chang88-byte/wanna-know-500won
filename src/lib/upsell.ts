/*
 * 500원 풀이 끝에 붙는 '다음 이야기' 안내. 500원 풀이는 그 자체로 완결된 답이고,
 * 여기서는 그 답에서 이어지는 궁금증(언제·누구·어떻게)이 프리미엄에 있다는 것만 부드럽게 알려줘요.
 * 압박하는 말(지금 안 보면…)이나 근거 없는 약속은 쓰지 않아요.
 */

export interface Upsell {
  /** 가리키는 프리미엄 카드 이름 */
  title: string;
  hooks: string[];
}

export function upsellFor(fortune: string): Upsell | null {
  if (fortune.includes("성공") || fortune.includes("재물")) {
    return {
      title: "올해 재물·직장 운 리포트",
      hooks: ["움직이기 좋은 달이 언제인지, 월별 12개월 흐름", "앞으로 10년, 대운이 어떻게 바뀌는지", "직장·재물 자리를 내 사주로 더 자세히"],
    };
  }
  if (fortune.includes("연애") || fortune.includes("결혼")) {
    return {
      title: "연애 매력 리포트",
      hooks: ["인연이 들어오기 쉬운 시기가 언제인지", "배우자 자리로 보는 인연의 결", "인연을 부르는 작은 습관 처방"],
    };
  }
  return null;
}
