import { describe, expect, it } from "vitest";
import { cleanFollowups, cleanVisual, cleanHistory, CRISIS_ANSWER, earlierQuestions, isCrisis, parseChatAnswer, parseChatReply, polishChatAnswer, recentEndings, usedBasis, usedActions, nowContext, visualAllowed, CHAT_SYSTEM_PROMPT } from "../chat";
import { parseCtx } from "@/lib/chatServer";
import { summarizeReport } from "@/lib/chatContext";

const long = (s: string) => s.repeat(12);

describe("도유 상담방", () => {
  it("대화 기록은 마지막이 사용자의 말이어야 해요", () => {
    expect(cleanHistory([{ role: "user", text: "안녕" }])).toHaveLength(1);
    expect(cleanHistory([{ role: "user", text: "안녕" }, { role: "dori", text: "응" }])).toBeNull();
    expect(cleanHistory([{ role: "admin", text: "x" }])).toBeNull();
    expect(cleanHistory("x")).toBeNull();
  });

  it("긴 말은 잘라요", () => {
    const h = cleanHistory([{ role: "user", text: "가".repeat(900) }]);
    expect(h![0].text.length).toBe(400);
  });

  it("마음이 힘든 말은 AI 없이 안내해요", () => {
    expect(isCrisis("요즘 죽고 싶어요")).toBe(true);
    expect(isCrisis("이직 시기가 궁금해")).toBe(false);
    expect(CRISIS_ANSWER).toContain("109");
  });

  it("답은 길이와 금지어를 검사해요", () => {
    expect(parseChatAnswer({ answer: "짧아" })).toBeNull();
    expect(parseChatAnswer({ answer: long("이혼 이야기는 하지 않아. ") })).toBeNull();
    expect(parseChatAnswer({ answer: long("연락이 뜸해지면 괜히 마음이 쓰이지. ") })).toBeTruthy();
  });

  it("결과 요약은 길이를 제한해요", () => {
    const s = summarizeReport({ topic: { label: "연애운", headline: "h", points: [{ title: "t", body: "b".repeat(500) }] }, concern: { text: "이직" } });
    expect(s).toContain("고민: 이직");
    expect(s.length).toBeLessThanOrEqual(1500);
  });

  it("후속 질문 칩은 걸러서 3개까지만 써요", () => {
    expect(cleanFollowups(["물 기운을 채우는 습관이 있어?", "물 기운을 채우는 습관이 있어?", "좋", 3, "이혼하면 어떻게 돼?", "다음 달엔 뭘 조심해?", "이번 주에 해 볼 일은?", "하나 더 물어봐도 돼?"])).toEqual(["물 기운을 채우는 습관이 있어?", "다음 달엔 뭘 조심해?", "이번 주에 해 볼 일은?"]);
    expect(cleanFollowups(undefined)).toEqual([]);
  });

  it("답이 괜찮으면 후속 질문이 없어도 통과해요", () => {
    const r = parseChatReply({ answer: long("연락이 뜸해지면 괜히 마음이 쓰이지. ") });
    expect(r?.followups).toEqual([]);
    expect(parseChatReply({ answer: "짧아", followups: ["물 기운은 어떻게 채워?"] })).toBeNull();
  });

  it("그림 카드: 종류·개수가 맞으면 쓰고, 어긋나면 카드만 빼요", () => {
    const it = (label: string, icon = "", sub = "", best = false) => ({ icon, label, sub, best });
    const note = cleanVisual({ kind: "note", title: "오늘의 노트", items: [it("마음에 남은 말 하나"), it("그때 내 기분 한 줄")] });
    expect(note?.kind).toBe("note");
    expect(note?.items[0].icon).toBe("");
    const pal = cleanVisual({ kind: "palette", title: "색", items: [it("펄 화이트", "", "맑고 차분"), it("아무색", "", "없는 색"), it("네이비", "", "깊은 밤")] });
    expect(pal?.items.map((i) => i.label)).toEqual(["펄 화이트", "네이비"]);
    expect(cleanVisual({ kind: "palette", title: "색", items: [it("없는색", "", "x"), it("펄 화이트", "", "y")] })).toBeNull();
    expect(cleanVisual({ kind: "spots", title: "자리", items: [it("책상 위", "", "노트 곁"), it("침대 곁", "", "잠들기 전"), it("화장실", "", "x")] })?.items.length).toBe(2);
    expect(cleanVisual({ kind: "spots", title: "자리", items: [it("책상 위", "", "a"), it("책상 위", "", "b")] })?.items.length).toBe(1);
    expect(cleanVisual({ kind: "none", title: "", items: [] })).toBeNull();
    expect(cleanVisual({ kind: "note", title: "노트", items: [it("한 줄")] })).toBeNull();
    expect(cleanVisual({ kind: "lucky", title: "소품", items: [it("머그컵", "", "따뜻한 차 한 잔"), it("없는물건", "", "x"), it("화분", "", "나무 기운")] })?.items.map((i) => i.label)).toEqual(["머그컵", "화분"]);
    expect(cleanVisual({ kind: "lucky", title: "소품", items: [it("머그컵", "", "a"), it("없는물건", "", "b"), it("또없는", "", "c")] })).toBeNull();
    expect(cleanVisual({ kind: "checklist", title: "약속", items: [it("이혼 준비하기"), it("물 마시기")] })).toBeNull();
  });

  it("시간표는 추천 한 곳만 남겨요", () => {
    const t = cleanVisual({ kind: "timeline", title: "시간표", items: [{ icon: "☀️", label: "아침", sub: "한 줄", best: true }, { icon: "🌤️", label: "오후", sub: "집중", best: true }, { icon: "🌙", label: "저녁 9시", sub: "노트", best: false }] });
    expect(t?.items.filter((i) => i.best).length).toBe(1);
  });

  it("답과 함께 카드가 와도 통과해요", () => {
    const r = parseChatReply({ answer: long("연락이 뜸해지면 괜히 마음이 쓰이지. "), visual: { kind: "checklist", title: "약속", items: [{ icon: "", label: "물 마시기", sub: "", best: false }, { icon: "", label: "한 줄 쓰기", sub: "", best: false }] } });
    expect(r?.visual?.kind).toBe("checklist");
    expect(parseChatReply({ answer: long("연락이 뜸해지면 괜히 마음이 쓰이지. ") })?.visual).toBeNull();
  });

  it("오래된 질문은 한 줄 요약으로 이어 붙여요", () => {
    const h = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 === 0 ? ("user" as const) : ("dori" as const), text: `말${i}` }));
    expect(earlierQuestions(h)).toBe("말0 / 말2");
    expect(earlierQuestions(h.slice(0, 5))).toBe("");
  });

  it("신년운 주제는 reading 에서만 받아요", () => {
    expect(parseCtx({ kind: "reading", summary: "", topic: "study" })?.topic).toBe("study");
    expect(parseCtx({ kind: "daily", summary: "", topic: "study" })?.topic).toBeNull();
    expect(parseCtx({ kind: "reading", summary: "", topic: "love" })?.topic).toBeNull();
  });
});

describe("polishChatAnswer", () => {
  const body = "오늘은 무리하지 말고 천천히 걸어 보는 게 좋아. 아까 말한 것처럼 물 기운을 채워 주면 한결 편해질 거야.";
  it("앞선 답에서 이미 이름을 불렀으면 맨 앞 호칭을 뗀다", () => {
    const h = [
      { role: "user" as const, text: "요즘 어때?" },
      { role: "dori" as const, text: "은혁님, 요즘 흐름이 좋아." },
      { role: "user" as const, text: "또 물어볼게" },
    ];
    expect(polishChatAnswer(`은혁님, ${body}`, h, "은혁")).toBe(body);
  });
  it("반말 호칭(은혁아)도 앞선 답에서 불렀으면 뗀다", () => {
    const h = [
      { role: "user" as const, text: "요즘 어때?" },
      { role: "dori" as const, text: "은혁아, 요즘 흐름이 좋아." },
      { role: "user" as const, text: "또 물어볼게" },
    ];
    expect(polishChatAnswer(`은혁아, ${body}`, h, "은혁")).toBe(body);
  });
  it("첫 답에서는 이름을 그대로 둔다", () => {
    const h = [{ role: "user" as const, text: "처음 질문" }];
    expect(polishChatAnswer(`은혁님, ${body}`, h, "은혁")).toBe(`은혁님, ${body}`);
  });
  it("몸 증상 질문에는 전문가 안내 한 줄을 붙인다", () => {
    const h = [{ role: "user" as const, text: "다리가 자주 저려요" }];
    expect(polishChatAnswer(body, h, null)).toContain("전문가");
  });
  it("이미 전문가 안내가 있으면 중복해서 붙이지 않는다", () => {
    const h = [{ role: "user" as const, text: "다리가 자주 저려요" }];
    const a = `${body} 계속되면 전문가와 이야기해 봐.`;
    expect(polishChatAnswer(a, h, null)).toBe(a);
  });
  it("증상이 아닌 질문엔 아무것도 붙이지 않는다", () => {
    const h = [{ role: "user" as const, text: "이직 흐름이 궁금해" }];
    expect(polishChatAnswer(body, h, null)).toBe(body);
  });
});

describe("끝맺음 반복 막기", () => {
  const h = [
    { role: "user" as const, text: "올해 흐름이 궁금해" },
    { role: "dori" as const, text: "올해는 불이 강해. 가벼운 산책을 하면서 생각을 정리해 보는 건 어때?" },
    { role: "user" as const, text: "더 알려줘" },
    { role: "dori" as const, text: "다음 달 첫 주가 좋아. 중요한 결정은 주변 이야기를 듣고 정해 보는 건 어때?" },
  ];
  it("직전 도리 답의 마지막 문장을 모아요", () => {
    const e = recentEndings(h);
    expect(e).toContain("정리해 보는 건 어때?");
    expect(e).toContain("정해 보는 건 어때?");
    expect(recentEndings([{ role: "user", text: "안녕" }])).toBe("");
  });
  it("프롬프트에 직전 끝맺음 경고가 들어가고, 시스템 프롬프트에 질문 종류별 규칙이 있어요", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("마음이 힘들다는 말");
    expect(CHAT_SYSTEM_PROMPT).toContain("인사·짧은 안부");
    expect(CHAT_SYSTEM_PROMPT).toContain("구체적으로");
    expect(recentEndings(h).length).toBeGreaterThan(10);
  });

  it("이미 풀어 쓴 사주 근거 기운을 모은다", () => {
    const h = [
      { role: "user" as const, text: "대화 팁" },
      { role: "dori" as const, text: "네 사주에는 단단한 [[땅]] 기운이 있어서 차분해." },
      { role: "user" as const, text: "또?" },
      { role: "dori" as const, text: "아까처럼 토 기운이 받아주고, 화 기운이 활발해." },
    ];
    expect(usedBasis(h).sort()).toEqual(["땅 기운(2번)", "불 기운(1번)"].sort());
    expect(usedBasis([{ role: "user", text: "땅 기운 알려줘" }])).toEqual([]);
  });

  it("카드는 사용자가 그 종류를 물었을 때만 붙인다", () => {
    expect(visualAllowed("lucky", "상대의 말이 길어질 때는?")).toBe(false);
    expect(visualAllowed("lucky", "곁에 두면 좋은 소품 추천해줘")).toBe(true);
    expect(visualAllowed("palette", "내일 어울리는 색이 있어?")).toBe(true);
    expect(visualAllowed("scent", "향을 피우기 좋은 시간대가 있어?")).toBe(true);
    expect(visualAllowed("timeline", "향을 피우기 좋은 시간대가 있어?")).toBe(true);
    expect(visualAllowed("note", "오해를 줄이는 대화법이 궁금해")).toBe(true);
    expect(visualAllowed("note", "상대의 말이 길어질 때는?")).toBe(false);
  });

  it("프롬프트에 근거 일관성·반복 금지·카드 조건이 들어 있다", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("이 대화에서 쓸 사주 기운");
    expect(CHAT_SYSTEM_PROMPT).toContain("이미 말한 사주 근거");
    expect(CHAT_SYSTEM_PROMPT).toContain("직접 묻지 않았는데");
  });
});

describe("구체성·시점·행동 반복 방지", () => {
  it("시점 문구: 토요일 낮은 주말 점심 무렵", () => {
    const t = nowContext(new Date("2026-11-14T12:38:00+09:00"));
    expect(t).toContain("11월 14일");
    expect(t).toContain("토요일(주말)");
    expect(t).toContain("점심 무렵");
    expect(t).toContain("늦가을");
  });
  it("평일 저녁", () => {
    expect(nowContext(new Date("2026-03-04T20:00:00+09:00"))).toContain("수요일(평일) 저녁, 봄");
  });
  it("이미 권한 행동을 센다", () => {
    const h = [
      { role: "user" as const, text: "a" },
      { role: "dori" as const, text: "퇴근길에 폰 메모장에 적어 봐" },
      { role: "user" as const, text: "b" },
      { role: "dori" as const, text: "노트에 한 줄 적어 보고 따뜻한 차 한 잔 해" },
    ];
    const u = usedActions(h);
    expect(u).toContain("메모·노트에 적기(2번)");
    expect(u).toContain("차·음료 마시기(1번)");
  });
  it("시스템 프롬프트에 새 규칙이 있다", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("돈·생계·살림 걱정");
    expect(CHAT_SYSTEM_PROMPT).toContain("지금 시점에 맞춰");
    expect(CHAT_SYSTEM_PROMPT).toContain("서로 다른 영역");
  });
});
