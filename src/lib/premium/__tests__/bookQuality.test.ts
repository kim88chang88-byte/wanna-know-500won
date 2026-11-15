import { describe, expect, it } from "vitest";
import { analyzeBook, compareQuality, overallLevel, sentencesOf } from "../bookQuality";
import type { BookPage } from "../types";

const page = (no: number, bodies: string[], extra: Partial<BookPage> = {}): BookPage =>
  ({ no, key: `k${no}`, title: `제${no}쪽`, subtitle: "", lead: "", sections: bodies.map((b, i) => ({ heading: `소제목${i}`, body: b })), tables: [], ...extra }) as unknown as BookPage;

describe("프리미엄 책 품질 점검", () => {
  it("문장을 나눈다", () => {
    expect(sentencesOf("첫 번째 문장이에요. 두 번째 문장도 있어요!\n세 번째 문장입니다.").length).toBe(3);
  });
  it("같은 끝맺음이 많으면 실패로 본다", () => {
    const body = Array.from({ length: 11 }, (_, i) => `이번 ${i}번째 상황에서는 천천히 이번 주에는 해 보세요.`).join(" ");
    const r = analyzeBook({ book: [page(1, [body])], viewerName: null });
    expect(r.metrics.find((m) => m.id === "endings")?.level).toBe("fail");
    expect(overallLevel(r)).toBe("fail");
  });
  it("깨끗한 글은 통과하고, 자리표시·금지어·이름 오타는 잡는다", () => {
    const ok = analyzeBook({ book: [page(1, ["오늘은 일을 하나씩 끝내는 쪽이 맞아요. 점심 뒤에 십 분만 걸어 보세요. 저녁에는 연락을 하나만 정리해 봐요."])], viewerName: "장은혁" });
    expect(ok.metrics.every((m) => m.level === "ok")).toBe(true);
    const bad = analyzeBook({ book: [page(1, ["장이름님은 파산할 수 있어요. 장은혁님과 장능혁님이 같이 있어요. 너를 믿어 봐요."])], viewerName: "장은혁" });
    const lv = (id: string) => bad.metrics.find((m) => m.id === id)?.level;
    expect(lv("names")).toBe("fail");
    expect(lv("forbidden")).toBe("fail");
    expect(lv("tone")).toBe("warn");
  });
  it("비유가 여러 쪽에 걸치면 알려 준다", () => {
    const book = [1, 2, 3, 4, 5].map((n) => page(n, ["이 장은 저수지처럼 차분하게 흘러가는 시기예요."]));
    expect(analyzeBook({ book, viewerName: null }).metrics.find((m) => m.id === "metaphor")?.level).toBe("fail");
  });
  it("이전 점검과 비교해서 줄었는지 늘었는지 알려 준다", () => {
    const rep = (n: number) => analyzeBook({ book: [page(1, [Array.from({ length: n }, (_, i) => `이번 ${i}번째 상황에서는 천천히 이번 주에는 해 보세요.`).join(" ")])], viewerName: null });
    const ch = compareQuality(rep(11), rep(3));
    const e = ch.find((c) => c.id === "endings");
    expect(e?.trend).toBe("better");
    expect(e?.before).toBeGreaterThan(e?.after ?? 99);
    expect(compareQuality(rep(3), rep(3)).every((c) => c.trend === "same")).toBe(true);
  });
});
