import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-ignore mjs 스크립트(타입 없음)
import { buildChatRulesSource } from "../../../../scripts/build-chat-rules.mjs";
import { CHAT_RULES, CHAT_RULE_FILES } from "../chatRules.generated";
import { renderChatRules } from "../chatRules";
import { CHAT_SYSTEM_PROMPT, buildChatPrompt, dropBannedSuggestions, elementBalance } from "../chat";
import { futureFacts } from "../futureFacts";
import { calculateSaju } from "@/lib/saju/calculate";

const root = join(__dirname, "../../../..");
const birth = { year: 1990, month: 5, day: 10, hour: 14, minute: 0, calendar: "solar", gender: "male" } as never;
const now = new Date("2026-11-28T01:00:00+09:00");

describe("상담실 기준 문서(md) → 프롬프트", () => {
  it("묶음 파일이 md 원본과 같아요 (고쳤으면 node scripts/build-chat-rules.mjs)", () => {
    const cur = readFileSync(join(root, "src/lib/ai/chatRules.generated.ts"), "utf8");
    expect(cur).toBe(buildChatRulesSource());
    expect(CHAT_RULE_FILES.length).toBeGreaterThanOrEqual(15);
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

describe("후속·추천 규칙과 보정", () => {
  it("프롬프트에 후속·추천·실무 규칙이 있어요", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("기운균형");
    expect(CHAT_SYSTEM_PROMPT).toContain("기운 → 장소·활동 연결");
    expect(CHAT_SYSTEM_PROMPT).toContain("십성 → 현실 과제 연결");
  });
  it("'적응'이 쓰기 요청으로 오인되지 않고, 금지 규칙을 말하는 문장은 지워요", () => {
    const a = "아이들과 천천히 동네를 익혀 봐. 가장 먼저 확인할 것 한 가지를 폰에 적어 두지 말고 마음속으로 정해 봐. 한강공원 쪽으로 가볍게 걸어 봐도 좋아.";
    const out = dropBannedSuggestions(a, "그 동네에서 잘 적응하고 살 수 있을지 걱정돼", false);
    expect(out).not.toContain("적어 두지 말고");
    expect(out).toContain("한강공원");
  });
  it("부족한 기운과 많은 기운을 줘요", () => {
    const b = elementBalance(calculateSaju(birth));
    expect(b.부족한기운).toMatch(/기운 \d개/);
    expect(b.많은기운).toMatch(/기운 \d개/);
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
