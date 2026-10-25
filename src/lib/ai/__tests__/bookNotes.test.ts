import { describe, expect, it } from "vitest";
import type { Concern } from "@/lib/concerns";
import type { BookPage } from "@/lib/premium/types";
import { addBookNotes, parseNotes, summarizeBook } from "../bookNotes";

const pages: BookPage[] = [1, 2, 3].map((no) => ({
  no,
  key: `k${no}`,
  title: `제목${no}`,
  subtitle: "부제",
  lead: `요약${no}`,
  sections: [
    { heading: "열린 풀이", body: "열려 있는 내용이에요." },
    { heading: "잠긴 풀이", body: "도리운세사주도리운세사주", locked: true },
  ],
  tables: [],
}));

const okBody = (obj: unknown, stop = "end_turn") =>
  new Response(JSON.stringify({ stop_reason: stop, content: [{ type: "text", text: JSON.stringify(obj) }] }), { status: 200 });

describe("summarizeBook", () => {
  it("잠긴 내용은 AI 에게 넘기지 않고, 고민은 데이터로 넣는다", () => {
    const t = summarizeBook(pages, "compat", { tags: ["job"], text: "이직할까" });
    expect(t).toContain("열려 있는 내용");
    expect(t).not.toContain("도리운세사주도리운세사주");
    expect(t).toContain("이직할까");
    expect(t).toContain("둘의 궁합 리포트");
  });
});

describe("parseNotes", () => {
  it("쪽 번호가 맞고 길이·금지어를 통과한 줄만 받는다", () => {
    const m = parseNotes(
      { notes: [{ no: 1, note: "오늘은 서로의 속도를 한 번만 물어봐 주세요." }, { no: 2, note: "짧음" }, { no: 9, note: "없는 쪽 번호에 붙은 한 줄이에요, 무시돼요." }, { no: 3, note: "이혼수가 걱정되는 말은 걸러져야 하는 한 줄이에요." }] },
      [1, 2, 3],
    );
    expect([...m.keys()]).toEqual([1]);
  });
});

describe("addBookNotes", () => {
  it("성공하면 쪽마다 note 가 붙는다", async () => {
    const fetchImpl = (async () =>
      okBody({ notes: pages.map((p) => ({ no: p.no, note: `${p.no}쪽: 오늘은 작은 안부 한 줄부터 건네 보세요.` })) })) as unknown as typeof fetch;
    const out = await addBookNotes(pages, { kind: "personal", apiKey: "k", fetchImpl });
    expect(out.every((p) => typeof p.note === "string")).toBe(true);
  });
  it("키가 없거나 응답이 이상하면 원래 쪽을 그대로 돌려준다", async () => {
    expect(await addBookNotes(pages, { kind: "personal", apiKey: "" , fetchImpl: (async () => okBody({})) as unknown as typeof fetch })).toEqual(pages);
    const bad = (async () => new Response("x", { status: 500 })) as unknown as typeof fetch;
    expect(await addBookNotes(pages, { kind: "personal", apiKey: "k", fetchImpl: bad })).toEqual(pages);
    const cut = (async () => okBody({ notes: [] }, "max_tokens")) as unknown as typeof fetch;
    expect(await addBookNotes(pages, { kind: "personal", apiKey: "k", fetchImpl: cut })).toEqual(pages);
  });
  it("유료 모델 기본값을 쓴다", async () => {
    let body: any;
    const fetchImpl = (async (_u: any, init: any) => { body = JSON.parse(init.body); return okBody({ notes: [] }); }) as unknown as typeof fetch;
    await addBookNotes(pages, { kind: "personal", apiKey: "k", fetchImpl });
    expect(body.model).toBe("claude-sonnet-5-5");
  });
});

describe("맞춤 조언(advice)", () => {
  const advice = "이직 고민이 길어져 마음이 무거웠죠. 일지의 흐름을 보면 차분히 준비할 때 힘이 붙는 구조예요. 이번 주엔 가고 싶은 회사 두 곳의 공고만 저장해 두세요.";
  const mk = (adv: string) =>
    (async () => okBody({ notes: pages.map((p) => ({ no: p.no, note: `${p.no}쪽: 오늘은 작은 안부 한 줄부터 건네 보세요.` })), advice: adv })) as unknown as typeof fetch;

  it("고민이 있으면 마지막 쪽에만 붙는다", async () => {
    const out = await addBookNotes(pages, { kind: "personal", apiKey: "k", fetchImpl: mk(advice), concern: { tags: ["job"], text: "이직" } });
    expect(out[2].advice).toBe(advice);
    expect(out[0].advice).toBeUndefined();
  });
  it("고민이 없으면 붙이지 않는다", async () => {
    const out = await addBookNotes(pages, { kind: "personal", apiKey: "k", fetchImpl: mk(advice) });
    expect(out.every((p) => p.advice === undefined)).toBe(true);
  });
  it("너무 짧거나 금지 표현이 있으면 버린다", async () => {
    const c: Concern = { tags: ["job"], text: "이직" };
    const a = await addBookNotes(pages, { kind: "personal", apiKey: "k", fetchImpl: mk("힘내요"), concern: c });
    const b = await addBookNotes(pages, { kind: "personal", apiKey: "k", fetchImpl: mk(`${advice} 이혼수가 있어요.`), concern: c });
    expect(a[2].advice).toBeUndefined();
    expect(b[2].advice).toBeUndefined();
  });
});
