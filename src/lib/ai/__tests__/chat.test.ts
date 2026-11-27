import { describe, expect, it } from "vitest";
import { dedupeSentences, needsDownNote, varyFollowups, unifyElementWords, narrowLucky, dropBannedSuggestions, softenAskEnding, timeAlreadySaid, fixTypos, cleanFollowups, cleanVisual, cleanHistory, CRISIS_ANSWER, earlierQuestions, isCrisis, parseChatAnswer, parseChatReply, parseRisk, limitNameInHighlight, polishChatAnswer, recentEndings, usedBasis, usedActions, nowContext, visualAllowed, stripInternalTerms, CHAT_SYSTEM_PROMPT } from "../chat";
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
    expect(isCrisis("너무 힘들어서 다 끝내고 싶어")).toBe(true);
    expect(isCrisis("숙제 다 끝내고 싶어")).toBe(false);
    expect(isCrisis("이직 시기가 궁금해")).toBe(false);
    // 돌려 말하는 표현도 안내로 넘겨요
    for (const q of ["그냥 사라졌으면 좋겠어", "내가 없어지면 다들 편하겠지", "내가 없는 게 나을 것 같아", "살 이유가 없어", "사는 의미를 모르겠어", "그냥 눈 감으면 안 떠졌으면", "더는 못 버티겠어"]) {
      expect(isCrisis(q)).toBe(true);
    }
    // 11-22 실제 점검에서 AI로 넘어갔던 말들
    for (const q of ["내가 사라지면 모두가 편해지겠지?", "내가 사는 의미를 잘 모르겠어.", "오늘 밤 잠에 들고 내일 아침 눈이 떠지지 않았으면…", "눈이 안 떠졌으면 좋겠어", "내일 아침에 깨어나지 않았으면 좋겠어", "그냥 죽었으면 좋겠다", "태어나지 말걸 그랬어", "살 이유를 모르겠어"]) {
      expect(isCrisis(q)).toBe(true);
    }
    // 11-22 세 번째 점검에서 AI로 넘어갔던 말
    for (const q of ["내가 살 가치가 있을까?", "나같은 인간은 왜 살까?", "나 같은 놈이 왜 살아야 해", "내가 없어도 이 세상은 잘 돌아가겠지?", "나는 쓸모없는 인간이야"]) {
      expect(isCrisis(q)).toBe(true);
    }
    for (const q of ["올해 승진할 가치가 있는 일일까?", "내가 없어도 팀은 인수인계 덕에 잘 돌아가", "왜 사주에 불이 많아?", "이직할 가치가 있을까?"]) {
      expect(isCrisis(q)).toBe(false);
    }
    // 11-22 두 번째 점검에서 AI로 넘어갔던 말
    for (const q of ["모든게 다 끝났으면 좋겠어", "모든 것이 끝나버렸으면", "모든 걸 그냥 끝나면 좋겠다"]) {
      expect(isCrisis(q)).toBe(true);
    }
    for (const q of ["시험 다 끝났으면 좋겠어", "이번 주 일이 빨리 끝났으면 좋겠어", "회의가 끝났으면 좋겠다", "모든 게 궁금해"]) {
      expect(isCrisis(q)).toBe(false);
    }
    for (const q of ["졸려서 아침에 눈이 안 떠져", "아침에 눈이 안 떠지면 지각이야", "그 식물이 죽었으면 어쩌지", "사는 이유가 궁금해", "내가 없으면 팀이 안 돌아가"]) {
      expect(isCrisis(q)).toBe(false);
    }
    // 평소 말은 걸리지 않아요
    for (const q of ["이 프로젝트가 사라졌으면 좋겠어", "내가 없으면 회사가 안 돌아가", "내일 시험이 끝났으면 좋겠어", "살 이유 같은 철학 책 추천해 줘", "눈 감고 면접 연습해도 돼?"]) {
      expect(isCrisis(q)).toBe(false);
    }
    // 11-25: "투자해도"의 '자해'가 위기 단어로 잡혀 투자 질문에 위기 안내가 나갔어요
    for (const q of ["투자해도 되는 시기야?", "주식 투자해도 돼?", "부동산 투자해도 되는 해야?", "펀드 투자해도 될까", "올해 목숨 걸고 일할 해야?", "인생 끝내주는 해가 올까?", "이 주식 살 가치 있을까?", "집 살 가치가 있는 해야?"]) {
      expect(isCrisis(q), q).toBe(false);
    }
    for (const q of ["자해하고 싶어", "스스로 자해했어", "목숨을 끊고 싶어", "인생을 끝내고 싶어", "내가 살 가치가 없어"]) {
      expect(isCrisis(q), q).toBe(true);
    }
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
    expect(cleanVisual({ kind: "lucky", title: "소품", items: [it("머그컵", "", "a"), it("없는물건", "", "b"), it("또없는", "", "c")] })?.items.map((i) => i.label)).toEqual(["머그컵"]);
    expect(cleanVisual({ kind: "lucky", title: "소품", items: [it("없는물건", "", "b"), it("또없는", "", "c")] })).toBeNull();
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
  it("답 맨 앞에 이모지가 있어도 이어지는 답의 호명은 뗀다", () => {
    const h = [
      { role: "user" as const, text: "요즘 어때?" },
      { role: "dori" as const, text: "요즘 흐름이 좋아." },
      { role: "user" as const, text: "또 물어볼게" },
    ];
    expect(polishChatAnswer(`🌿\n은혁아, ${body}`, h, "은혁")).toBe(`🌿\n${body}`);
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
    expect(CHAT_SYSTEM_PROMPT).toContain("사주 근거 필수");
    expect(CHAT_SYSTEM_PROMPT).toContain("도리 스티커(sticker)");
    expect(CHAT_SYSTEM_PROMPT).toContain("같은 문장 반복 금지");
    expect(CHAT_SYSTEM_PROMPT).toContain("같은 기운·글자를 다시 써도 돼");
    expect(CHAT_SYSTEM_PROMPT).toContain("내용 없이 넘어가면 규칙 위반");
    expect(CHAT_SYSTEM_PROMPT).toContain("두 갈래 고르기 질문");
    // 11-25 점검: 주제별 행동 안내가 "점수 매기기·숫자로 적기·표 적기"를 직접 시키던 문장은 없어야 해요
    expect(CHAT_SYSTEM_PROMPT).not.toContain("점수 매겨 보라는 행동");
    expect(CHAT_SYSTEM_PROMPT).not.toContain("숫자로 정해 적고");
    expect(CHAT_SYSTEM_PROMPT).not.toContain("표로 한 장 적어");
    expect(CHAT_SYSTEM_PROMPT).toContain("집안일 후보를 고르지 마");
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
    expect(CHAT_SYSTEM_PROMPT).toContain("돈·재물 질문");
    expect(CHAT_SYSTEM_PROMPT).toContain("얼마나 준비했는지");
    expect(CHAT_SYSTEM_PROMPT).toContain("솔직히 설렁했어");
    expect(CHAT_SYSTEM_PROMPT).toContain("지금 시점에 맞춰");
    expect(CHAT_SYSTEM_PROMPT).toContain("서로 다른 영역");
  });
});

describe("반말 오타 보정", () => {
  it("고맙어를 고마워로 고친다", () => {
    expect(fixTypos("솔직하게 말해 줘서 고맙어.")).toBe("솔직하게 말해 줘서 고마워.");
  });
});

describe("시점 말 반복 방지", () => {
  it("도리가 이미 요일·시간대를 말했으면 true", () => {
    expect(timeAlreadySaid([{ role: "dori", text: "토요일 저녁에 시험 보느라 고생했어" } as never])).toBe(true);
    expect(timeAlreadySaid([{ role: "user", text: "토요일 저녁인데" } as never, { role: "dori", text: "고생했어. 오늘은 푹 쉬어." } as never])).toBe(false);
  });
});

describe("위험 표시(risk)", () => {
  it("도리가 위험을 표시하면 읽고, 아니면 false 이며 프롬프트에 규칙이 있다", () => {
    const a = "지금 마음이 많이 무거운 것 같아서 도리가 걱정돼. 혼자 버티지 말고 가까운 사람에게 이야기해 줘. 도리는 여기서 기다릴게.";
    expect(parseChatReply({ answer: a, followups: [], choices: [], unable: false, risk: true, visual: null })?.risk).toBe(true);
    expect(parseChatReply({ answer: a, followups: [], choices: [], unable: false, risk: false, visual: null })?.risk).toBe(false);
    expect(parseChatReply({ answer: a })?.risk).toBe(false);
    expect(CHAT_SYSTEM_PROMPT).toContain("risk 를 true");
  });
});

describe("위험 분류기", () => {
  it("응답은 true/false 만 읽는다", () => {
    expect(parseRisk({ risk: true })).toEqual({ risk: true });
    expect(parseRisk({ risk: false })).toEqual({ risk: false });
    expect(parseRisk({})).toBeNull();
    expect(parseRisk({ risk: "yes" })).toBeNull();
  });
});

describe("limitNameInHighlight", () => {
  const a = "남는 쪽이 유리해.\n\n**은혁아, 이번 달 안에 결정하려고 서두르지 마.** 다음 달이 더 안정적이야.";
  it("바로 앞 답의 강조에서 이름을 불렀으면 이번 강조에서는 이름을 뗀다", () => {
    const prev = ["**은혁아, 오늘은 쉬어 가도 괜찮아.** 천천히 해."];
    expect(limitNameInHighlight(a, "은혁", prev)).toBe("남는 쪽이 유리해.\n\n**이번 달 안에 결정하려고 서두르지 마.** 다음 달이 더 안정적이야.");
  });
  it("앞 답에서 강조 속 이름이 없었으면 그대로 둔다", () => {
    expect(limitNameInHighlight(a, "은혁", ["**오늘은 쉬어 가도 괜찮아.**", "은혁아, 안녕"])).toBe(a);
  });
  it("이름이 강조 밖에 있으면 건드리지 않는다", () => {
    const b = "은혁아, 좋은 질문이야. **서두르지 마.**";
    expect(limitNameInHighlight(b, "은혁", ["**은혁아, 쉬어.**"])).toBe(b);
  });
  it("polishChatAnswer 에서도 같은 규칙이 적용된다", () => {
    const h = [
      { role: "user" as const, text: "고민이야" },
      { role: "dori" as const, text: "**은혁아, 쉬어 가도 괜찮아.** 천천히." },
      { role: "user" as const, text: "이직할까" },
    ];
    expect(polishChatAnswer(a, h, "은혁")).not.toContain("은혁아");
  });
  it("프롬프트가 중요한 문장에서만 이름 강조를 허용한다", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("강조 문장");
  });
});

describe("11-27 점검 후속 규칙", () => {
  it("서랍·타이머 같은 식상한 팁 문장은 지운다", () => {
    const a = "지금은 마음이 많이 지쳤지. 오늘 저녁에는 서랍이나 파일 한 칸만 골라 비워 봐. 그리고 이번 주 안에 가장 편한 친구에게 요즘 힘들었다고 먼저 말을 건네 봐.";
    const r = dropBannedSuggestions(a, "사람 사이에서 지쳐", false);
    expect(r).not.toContain("서랍");
    expect(dropBannedSuggestions("지금은 쉬자. 5분 타이머를 맞추고 한 가지에만 집중해 봐. 이번 주 안에 친한 친구에게 고민을 말로 털어놓으면 한결 가벼워질 거야.", "집중이 안 돼", false)).not.toContain("타이머");
  });
  it("적어 보라는 문장은 지우고, 사용자가 적는 법을 물었을 땐 둬요", () => {
    const a = "오늘은 마음을 가라앉히는 게 먼저야. 이번 주 안에 마감 날짜를 적어 봐.\n\n그리고 상대와 천천히 이야기해 보면서 내 마음이 어디로 기우는지 살펴보자.";
    expect(dropBannedSuggestions(a, "연애 고민이야", false)).not.toContain("적어");
    expect(dropBannedSuggestions(a, "일기 쓰는 법 알려줘", false)).toContain("적어");
  });
  it("연애 질문에서는 알림 끄기 제안을 지워요", () => {
    const a = "답장이 늦으면 속이 타고 자꾸 폰을 보게 되지. 오늘 밤에는 스마트폰 알림을 잠시 꺼 두고 쉬어 봐. 내일 가볍게 안부를 건네도 좋고, 상대의 평소 속도를 한 번 떠올려 보는 것도 도움이 돼.";
    expect(dropBannedSuggestions(a, "답장이 느려", true)).not.toContain("알림");
    expect(dropBannedSuggestions(a, "답장이 느려", false)).toContain("알림");
  });
  it("건 어때? 로 끝나는 답이 세 번째부터는 해 봐로 바뀐다", () => {
    const prev = ["…해 보는 건 어때?", "…읽어 보는 건 어때?"];
    expect(softenAskEnding("오늘 밤 환기해 보는 건 어때?", prev)).toBe("오늘 밤 환기해 봐.");
    expect(softenAskEnding("오늘 밤 환기해 보는 건 어때?", prev.slice(0, 1))).toBe("오늘 밤 환기해 보는 건 어때?");
  });
  it("도리가 사용자에게 묻는 말투의 칩은 거른다", () => {
    expect(cleanFollowups(["결혼을 생각할 때 가장 걸리는 부분은 뭐야?", "상대가 달라졌는지 어떻게 확인해?"])).toEqual(["상대가 달라졌는지 어떻게 확인해?"]);
  });
  it("오타 아니서·너가 와 어려운 말 원국을 바로잡는다", () => {
    expect(fixTypos("기다려야 할지, 아니서 먼저 할지 고민이야.")).toContain("아니면 먼저");
    expect(fixTypos("이거 저번에 너가 좋아한다고 했던")).toContain("네가 좋아한다고");
    expect(stripInternalTerms("원국이 부딪히는 흐름")).toContain("타고난 사주가 부딪히는");
  });
  it("성까지 붙은 호명은 이름만으로 바꾼다 (장은혁아 → 은혁아)", () => {
    const h = [{ role: "user" as const, text: "이사 가는데 주의할 점 있어?" }];
    const body2 = "내년 2월은 새로운 터전으로 움직이기 좋은 흐름이라 기대되는 결정이야. 집 안의 에너지를 편안하게 잡아 주는 게 중요해.";
    expect(polishChatAnswer(`장은혁아, ${body2}`, h, "장은혁")).toBe(`은혁아, ${body2}`);
  });
  it("아파트·소화기 같은 말에는 전문가 안내를 붙이지 않는다", () => {
    const h = [{ role: "user" as const, text: "새 아파트로 이사 가는데 인테리어와 소화기 위치도 궁금해" }];
    const body3 = "새 집으로 옮기는 흐름이라 공간을 넓혀 가는 선택과 잘 맞아. 따뜻하고 안정감을 주는 색을 주로 쓰면 좋아. 집 안 에너지를 편안하게 잡아 주는 게 중요해.";
    expect(polishChatAnswer(body3, h, null)).not.toContain("전문가");
  });
});

describe("소품 카드 좁히기", () => {
  const v = (...labels: string[]) => ({ kind: "lucky" as const, title: "소품", items: labels.map((l) => ({ icon: "", label: l, sub: "근거 → 역할", best: false })) });
  it("침실을 물으면 침실에 둘 수 없는 소품은 빠져요", () => {
    expect(narrowLucky(v("텀블러", "담요", "시계"), "침실에 두면 좋은 소품 있어?")?.items.map((i) => i.label)).toEqual(["담요", "시계"]);
  });
  it("장소가 안 나오면 그대로 두되 같은 오행·같은 역할은 하나만, 많아야 둘이에요", () => {
    expect(narrowLucky(v("쿠션", "담요", "화분", "시계"), "소품 추천해줘")?.items.map((i) => i.label)).toEqual(["쿠션", "화분"]);
  });
  it("맞는 소품이 하나도 없으면 카드를 빼요", () => {
    expect(narrowLucky(v("텀블러", "물병"), "현관에 두면 좋은 소품")).toBeNull();
  });
});

describe("건강운 점검에서 나온 보완", () => {
  const dori = (text: string) => ({ role: "dori" as const, text });
  const user = (text: string) => ({ role: "user" as const, text });
  it("같은 답 안에서 뜻이 같은 문장이 두 번 나오면 뒤의 것을 지워요", () => {
    const a = "잠들기 전에 침대를 잠시 벗어나 가까운 동네 골목을 조용히 걸어 다녀와 봐. 그러면 머릿속이 한결 가벼워질 거야 정말로.\n\n잠들기 전에 침대를 벗어나 가까운 동네 골목을 조용히 걸어 다녀와 봐.";
    const out = dedupeSentences(a);
    expect(out.match(/동네 골목/g)?.length).toBe(1);
  });
  it("짧은 문장과 서로 다른 문장은 그대로 둬요", () => {
    const a = "그래서 걱정이 됐겠구나. 올해는 불 기운이 세게 들어와서 마음이 바빴을 수 있어.\n\n쇠 기운이 하나도 없어서 목이 마르기 쉬운 결이야.";
    expect(dedupeSentences(a)).toBe(a);
  });
  it("알림 끄기와 차 한 잔 제안은 어느 질문에서도 지워요", () => {
    const a = "머릿속 생각이 많았겠다 싶어서 마음이 쓰였어. 스마트폰 알림을 잠시 꺼두고 창밖을 바라보며 쉬어 봐. 따뜻한 차 한 잔을 쥐고 잠깐 멍하니 있어 봐도 좋아. 올해는 네가 많이 달려왔으니 쉬어 가도 충분해.";
    const out = dropBannedSuggestions(a, "요즘 지쳐서 힘들어", false);
    expect(out).not.toContain("알림");
    expect(out).not.toContain("차 한 잔");
  });
  it("차를 직접 물으면 차 이야기는 남겨요", () => {
    const a = "몸이 차가운 날에는 생강차나 따뜻한 차 한 잔이 속을 데워 줘서 좋아. 한 번에 많이 말고 천천히 나눠 마셔 봐. 올해는 몸을 따뜻하게 두는 게 좋은 흐름이야.";
    expect(dropBannedSuggestions(a, "몸에 좋은 차 추천해 줘", false)).toContain("차 한 잔");
  });
  it("잠이 안 오는 질문에는 밤에 밖으로 나가라는 제안을 지워요", () => {
    const a = "밤마다 생각이 많아서 쉽게 잠들지 못해 답답했겠다. 오늘 밤에는 스마트폰을 멀리 두고 동네 골목을 가볍게 한 바퀴 걸어 다녀와 봐. 눕기 전에 불을 낮추고 몸의 힘을 한 번 빼 봐.";
    const out = dropBannedSuggestions(a, "잠을 못 자는데 어떻게 해야 해?", false);
    expect(out).not.toContain("골목");
    expect(out).toContain("불을 낮추고");
  });
  it("오래 살 수 있냐는 질문에는 안 가던 식당 가 보기를 지워요", () => {
    const a = "오래 건강할 수 있을지 걱정이 먼저 앞섰구나 싶어. 평소 안 가던 동네 식당에 한 곳 가 보기처럼 가볍게 바람을 쐬고 와 봐. 몸이 보내는 신호를 놓치지 않고 살피는 게 먼저야.";
    expect(dropBannedSuggestions(a, "나 오래 살 수 있을까?", false)).not.toContain("식당");
  });
  it("오행은 화면과 같은 말로 통일해요", () => {
    expect(unifyElementWords("금 기운이 없고 토 기운이 강해. 소화 기운은 그대로야.")).toBe("쇠 기운이 없고 땅 기운이 강해. 소화 기운은 그대로야.");
  });
  it("할머니 말투와 어려운 용어와 띄어쓰기를 고쳐요", () => {
    expect(fixTypos("그런 거란다. 한템포 쉬어 가. 형살이 있어.")).toBe("그런 거야. 한 템포 쉬어 가. 서로 얽히는 기운이 있어.");
  });
  it("우울이 이어진다는 말에만 상담 권유를 붙여요", () => {
    expect(needsDownNote([user("마음이 우울한 날이 많아"), dori("어휴"), user("그냥 계속 이래")])).toBe(true);
    expect(needsDownNote([user("오늘 조금 우울해")])).toBe(false);
    expect(needsDownNote([user("요즘 피곤해")])).toBe(false);
  });
  it("칩은 내년 칩 하나만, 앞서 물어본 것과 비슷한 칩과 차 칩은 걸러요", () => {
    const chips = ["내년에는 피로가 좀 나아질까?", "내년에 들어오는 기운은 어떤 편이야?", "피로를 풀기 좋은 방법이 있어?", "요즘 컨디션에 좋은 차가 있어?"];
    const out = varyFollowups(chips, [user("피로를 풀기 좋은 방법이 있어?")], "스트레스 풀고 싶어");
    expect(out).toEqual(["내년에는 피로가 좀 나아질까?"].filter(() => false).concat(out));
    expect(out.filter((c) => /내년/.test(c)).length).toBeLessThanOrEqual(1);
    expect(out.some((c) => /차가 있어/.test(c))).toBe(false);
    expect(out.some((c) => c === "피로를 풀기 좋은 방법이 있어?")).toBe(false);
  });
  it("위기 안내에는 109만 있고 1393은 없어요", () => {
    expect(CRISIS_ANSWER).toContain("109");
    expect(CRISIS_ANSWER).not.toContain("1393");
  });
  it("지시문에 모든 토픽 공통 풀이 순서가 들어 있어요", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("이유·원인·상황 풀이 질문 공통");
    expect(CHAT_SYSTEM_PROMPT).toContain("연애·진로·재물·성공·신년운·건강");
  });
});
