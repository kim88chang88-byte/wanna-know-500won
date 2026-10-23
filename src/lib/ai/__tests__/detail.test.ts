import { describe, expect, it } from "vitest";
import { DETAIL_SCHEMA, parseDetail } from "../detail";

const long = (s: string, n: number) => s.repeat(n);
const story = long("오늘은 마음이 포근하게 풀리는 날이라 서두르지 않아도 괜찮아 💕 ", 8);
const fold = long("물 기운이 든든하게 받쳐 주니까 천천히 가도 괜찮아 🫧 ", 8);
const ok = { story, today: fold, nature: fold, flow: fold, action: fold, lucky: fold };

describe("parseDetail", () => {
  it("알맞은 글은 살린다", () => {
    const d = parseDetail(ok);
    expect(d?.story).toBe(story.trim());
    expect(Object.keys(d?.folds ?? {}).length).toBe(5);
  });
  it("접이식 글은 일부만 있어도 살린다", () => {
    const d = parseDetail({ ...ok, flow: "짧음", lucky: "" });
    expect(d?.folds.flow).toBeUndefined();
    expect(d?.folds.today).toBe(fold.trim());
  });
  it("요약 문단이 짧으면 버린다", () => {
    expect(parseDetail({ ...ok, story: "너무 짧아요" })).toBe(null);
  });
  it("금지 표현이 있으면 버린다", () => {
    expect(parseDetail({ ...ok, action: fold + " 큰 재앙이 올 수 있어" })).toBe(null);
  });
  it("스키마에 지원하지 않는 키워드가 없다", () => {
    const t = JSON.stringify(DETAIL_SCHEMA);
    for (const k of ["minimum", "maximum", "minLength", "maxLength"]) expect(t.includes(`"${k}"`)).toBe(false);
  });
});
