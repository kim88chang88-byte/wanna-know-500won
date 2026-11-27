import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-ignore mjs 스크립트(타입 없음)
import { buildChatRulesSource } from "../../../../scripts/build-chat-rules.mjs";
import { CHAT_RULES, CHAT_RULE_FILES } from "../chatRules.generated";
import { renderChatRules } from "../chatRules";
import { CHAT_SYSTEM_PROMPT, buildChatPrompt } from "../chat";
import { futureFacts } from "../futureFacts";
import { calculateSaju } from "@/lib/saju/calculate";

const root = join(__dirname, "../../../..");
const birth = { year: 1990, month: 5, day: 10, hour: 14, minute: 0, calendar: "solar", gender: "male" } as never;
const now = new Date("2026-11-28T01:00:00+09:00");

describe("상담실 기준 문서(md) → 프롬프트", () => {
  it("묶음 파일이 md 원본과 같아요 (고쳤으면 node scripts/build-chat-rules.mjs)", () => {
    const cur = readFileSync(join(root, "src/lib/ai/chatRules.generated.ts"), "utf8");
    expect(cur).toBe(buildChatRulesSource());
    expect(CHAT_RULE_FILES.length).toBeGreaterThanOrEqual(14);
  });
  it("자리표시자가 모두 채워지고 프롬프트에 남지 않아요", () => {
    expect(CHAT_SYSTEM_PROMPT).not.toMatch(/\{\{[A-Z_]+\}\}/);
    expect(CHAT_RULES).toMatch(/\{\{PALETTE\}\}/);
    expect(() => renderChatRules("{{NOPE}}", {})).toThrow();
  });
  it("프롬프트의 핵심 구간이 순서대로 있어요", () => {
    const at = (s: string) => CHAT_SYSTEM_PROMPT.indexOf(s);
    expect(at("\n말투\n")).toBeGreaterThanOrEqual(0);
    expect(at("\n사실과 한계\n")).toBeGreaterThan(at("\n말투\n"));
    expect(at("\n지켜야 할 선\n")).toBeGreaterThan(at("\n사실과 한계\n"));
    expect(CHAT_SYSTEM_PROMPT.trimEnd().endsWith("반드시 지정된 JSON 으로만 답해.")).toBe(true);
  });
});

describe("골든 질문: 질문마다 맞는 사주 재료가 붙어요", () => {
  const md = readFileSync(join(root, "docs/상담실-기준/골든-질문.md"), "utf8");
  const cases = [...md.matchAll(/^- \[([^\]]+)\]\s+(.+)$/gm)].map((m) => ({ keys: m[1].split(",").map((s) => s.trim()), q: m[2].trim() }));
  it("골든 질문이 충분히 있어요", () => expect(cases.length).toBeGreaterThanOrEqual(8));
  const chart = calculateSaju(birth);
  for (const c of cases) {
    it(`${c.q.slice(0, 30)} → ${c.keys.join("·")}`, () => {
      const future = futureFacts(birth, c.q, now);
      const p = buildChatPrompt({ kind: "reading", name: "테스트", summary: "요약", chart, core: null, future } as never, [{ role: "user", text: c.q }] as never, now);
      for (const k of c.keys) expect(p, `"${k}" 재료가 입력에 없어요`).toContain(`"${k}"`);
    });
  }
});
