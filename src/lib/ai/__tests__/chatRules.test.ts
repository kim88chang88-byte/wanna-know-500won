import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-ignore mjs 스크립트(타입 없음)
import { buildChatRulesSource } from "../../../../scripts/build-chat-rules.mjs";
import { CHAT_RULES, CHAT_RULE_FILES } from "../chatRules.generated";
import { renderChatRules } from "../chatRules";
import { CHAT_SYSTEM_PROMPT, buildChatPrompt, cleanFollowups, dropBannedSuggestions, elementBalance, fixTypos } from "../chat";
import { futureFacts } from "../futureFacts";
import { calculateSaju } from "@/lib/saju/calculate";

const root = join(__dirname, "../../../..");
const birth = { year: 1990, month: 5, day: 10, hour: 14, minute: 0, calendar: "solar", gender: "male" } as never;
const now = new Date("2026-11-28T01:00:00+09:00");

describe("상담실 기준 문서(md) → 프롬프트", () => {
  it("묶음 파일이 md 원본과 같아요 (고쳤으면 node scripts/build-chat-rules.mjs)", () => {
    const cur = readFileSync(join(root, "src/lib/ai/chatRules.generated.ts"), "utf8");
    expect(cur).toBe(buildChatRulesSource());
    expect(CHAT_RULE_FILES.length).toBeGreaterThanOrEqual(16);
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

describe("고민 상담 5단계", () => {
  it("5단계와 솔루션 기준이 프롬프트 앞쪽에 있어요", () => {
    const i5 = CHAT_SYSTEM_PROMPT.indexOf("고민 상담 답변 5단계");
    expect(i5).toBeGreaterThan(0);
    for (const k of ["① 공감", "② 사주로 본 지금 상황", "③ 고민에 적용", "④ 해답·솔루션", "⑤ 대화 잇기", "소름 돋는 솔루션 기준"]) expect(CHAT_SYSTEM_PROMPT).toContain(k);
    expect(CHAT_SYSTEM_PROMPT.indexOf("소름 돋는 솔루션 기준")).toBeGreaterThan(i5);
    expect(CHAT_SYSTEM_PROMPT.indexOf("그 밖의 첫 질문")).toBeGreaterThan(i5);
  });
  it("분량이 답 길이 상한 안에 있어요", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("1350자를 넘기지 마");
  });
});

describe("연애 30문 점검 후속 보정", () => {
  it("알림 내려두기 제안과 도리의 질문 꼴 칩을 걸러요", () => {
    const out = dropBannedSuggestions("답장이 늦는 건 상대가 바쁘거나 리듬이 다른 사람일 가능성이 더 커서, 지금은 네 마음을 급하게 판단하지 않아도 충분해. 이번 주말에는 스마트폰 알림을 잠시 내려두고 걸어 봐. 먼저 상대가 요즘 어떤 일로 바쁜지 가볍게 살펴보면서 속도를 맞춰 봐.", "썸 답장이 느려", true);
    expect(out).not.toContain("알림");
    expect(cleanFollowups(["요즘 일상에서 가장 마음이 쓰이는 건 뭐야?", "마음이 복잡할 때 어떤 생각을 주로 해?", "내년 연애운은 어떤 흐름이야?"])).toEqual(["내년 연애운은 어떤 흐름이야?"]);
  });
  it("오타·예언 표현을 고쳐요", () => {
    expect(fixTypos("신경 쓸 점은 속도를 지키는 것임.")).toContain("거야.");
    expect(fixTypos("불 기운이 세 개로 강하고쇠 기운이 없어서")).toContain("강하고 쇠 기운");
    expect(fixTypos("비슷한 불안이 반복될 확률이 높아서 조심해.")).toContain("반복될 수 있어서");
  });
  it("사기 경고는 사주를 이유로 쓰지 않는 규칙이 있어요", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("사주(기운·세운·충합)를 위험의 이유로 쓰지 마");
    expect(CHAT_SYSTEM_PROMPT).toContain("기운 개수에서 성격·행동을 억지로 끌어내지 마");
    expect(CHAT_SYSTEM_PROMPT).toContain("질문 유형별 필수 형태");
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
