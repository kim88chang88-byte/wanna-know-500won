import { describe, expect, it } from "vitest";
import { resultToText } from "../resultText";
import type { PremiumReportView } from "@/lib/premium/types";

const report = {
  level: "full",
  summary: "구조 요약",
  geukguk: "인수격",
  yongsin: ["丙(병)"],
  hourUnknown: true,
  concern: null,
  compat: null,
  topic: { label: "재물운" },
  book: [
    {
      no: 2,
      key: "x",
      title: "제7장 · 재물운",
      subtitle: "",
      lead: "한 줄",
      sections: [
        { heading: "돈이 들어오는 길", body: "본문 내용" },
        { heading: "잠긴 글", body: "가려짐", locked: true },
      ],
      tables: [{ title: "표", rows: [{ label: "항목", value: "값", note: "메모" }, { label: "잠김", value: "x", locked: true }] }],
    },
  ],
} as unknown as PremiumReportView;

describe("resultToText", () => {
  it("쪽·소제목 순서로 이어 붙이고 잠긴 글은 빼요", () => {
    const t = resultToText(report, null, { topic: "재물운", name: "철수", at: new Date("2026-11-02T00:00:00Z") });
    expect(t).toContain("# 결과 복사 — 재물운");
    expect(t).toContain("태어난 시간 모름");
    expect(t).toContain("## 2쪽 · 제7장 · 재물운");
    expect(t).toContain("### 돈이 들어오는 길\n본문 내용");
    expect(t).not.toContain("가려짐");
    expect(t).toContain("- 항목: 값 (메모)");
    expect(t).not.toContain("잠김");
  });
  it("일반 풀이(reading)도 이어 붙여요", () => {
    const t = resultToText({ ...report, book: [] }, { keyword: "키워드", total: { summary: "총운" }, kkotgeoji: "한마디", story: "이야기", folds: { a: "접이식 글" }, heads: { a: "제목" } });
    expect(t).toContain("키워드: 키워드");
    expect(t).toContain("### 요약하자면\n이야기");
    expect(t).toContain("### 제목\n접이식 글");
  });
});
