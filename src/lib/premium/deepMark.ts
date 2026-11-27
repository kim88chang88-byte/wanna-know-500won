/* 십성 장처럼 "먼저 보이는 부분 + 눌러서 펼치는 깊은 해설"로 쓴 글을 가르는 표시예요. 본문 한가운데 한 줄로 들어가요. */
export const DEEP_MARK = "[더 깊이]";

/** 본문을 (처음부터 보이는 부분, 접어 둔 부분)으로 나눠요. 표시가 없으면 접힌 부분은 빈 글이에요. */
export function splitDeep(body: string): { shown: string; deep: string } {
  const i = body.indexOf(DEEP_MARK);
  if (i < 0) return { shown: body, deep: "" };
  return { shown: body.slice(0, i).trim(), deep: body.slice(i + DEEP_MARK.length).trim() };
}

/** 표시를 문단 나눔으로 바꿔 한 덩어리 글로 돌려줘요. (관리자 보기·요약처럼 접기가 없는 곳에서 써요) */
export function flattenDeep(body: string): string {
  return body.includes(DEEP_MARK) ? body.replace(DEEP_MARK, "\n\n") : body;
}
