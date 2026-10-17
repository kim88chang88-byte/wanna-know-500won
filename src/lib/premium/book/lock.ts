import type { BookPage, BookRow, BookSection } from "../types";

/*
 * 궁금증을 남기는 잠금. 페이지마다 앞부분(핵심 진단)은 열어 두고, '구체적인 처방·흐름·타이밍' 풀이를 잠가요.
 * 잠긴 글은 화면에서만 흐리게 하는 게 아니라 서버에서 같은 길이의 의미 없는 글자로 바꿔서 내려보내요.
 * (개발자 도구로 열어 봐도 진짜 문장은 없어요.)
 */

const FILLER = ["도", "리", "운", "세", "사", "주", "물", "빛", "달", "별", "꿈", "길"];

/** 글자 수와 띄어쓰기 모양은 그대로, 내용은 의미 없는 글자로 */
export function maskText(text: string): string {
  let i = 0;
  return Array.from(text)
    .map((ch) => {
      if (/\s/.test(ch) || /[.,!?·~()'"“”‘’:;-]/.test(ch)) return ch;
      i += 7;
      return FILLER[i % FILLER.length];
    })
    .join("");
}

const MASK_VALUE = "●●●●●";

function lockSection(s: BookSection, heading?: string): BookSection {
  return { heading: heading ?? s.heading, body: maskText(s.body), locked: true };
}

function lockRow(r: BookRow): BookRow {
  return { ...r, value: MASK_VALUE, note: r.note ? "●●" : undefined, locked: true };
}

type SecRule = (s: BookSection, nth: number) => { lock: boolean; heading?: string };

const startsWithAny = (h: string, list: string[]) => list.some((x) => h.startsWith(x));

function rulesFor(page: BookPage, year: number): { sec: SecRule; row?: (r: BookRow, i: number, rows: BookRow[], title: string) => boolean } {
  switch (page.key) {
    case "overview":
      return {
        sec: (s) => ({ lock: s.heading.startsWith(`${year}년`) }),
        row: (r) => r.label === "용신",
      };
    case "pillars":
      return {
        sec: (s) => ({ lock: /^(육합|삼합|반합|방합|충|형|파|해|원진|귀문|천간)/.test(s.heading) || /^십성으로 읽는 (월주|일주|시주)/.test(s.heading) }),
      };
    case "nature":
      return { sec: (s) => ({ lock: ["연애에서의 나", "스트레스 신호", "회복하는 법"].includes(s.heading) }) };
    case "elements":
      return { sec: (s) => ({ lock: s.heading === "균형 맞추는 생활 팁" }) };
    case "tengods":
      return { sec: (s) => ({ lock: s.heading === "어울리는 분야" || s.heading.startsWith("채워 가면 좋은 기운") }) };
    case "geukguk": {
      let n = 0;
      return {
        sec: (s) => {
          if (s.heading.startsWith("용신") && s.heading !== "용신 활용법") return { lock: true, heading: `용신 ${["①", "②", "③", "④"][n++] ?? "·"} 나를 돕는 기운` };
          return { lock: s.heading.endsWith("사주의 인생 전략") };
        },
      };
    }
    case "topic":
      return { sec: (s) => ({ lock: startsWithAny(s.heading, ["상황별 가이드", "실천 처방", "줄이면 좋은 습관"]) || /^\d{4}년 흐름|^지금 대운/.test(s.heading) }) };
    case "daeun": {
      const curStart = Number(/^지금 대운 · .*\((\d+)~/.exec(page.sections.find((x) => x.heading.startsWith("지금 대운"))?.heading ?? "")?.[1] ?? NaN);
      return {
        sec: (s) => {
          if (s.heading.startsWith("다음 대운")) return { lock: true, heading: "다음 대운 · 곧 바뀌는 계절" };
          if (s.heading.startsWith("지난 대운")) return { lock: true, heading: "지난 대운 돌아보기" };
          const m = /^(\d+)~(\d+)세 · /.exec(s.heading);
          if (m && Number(m[1]) > curStart) return { lock: true, heading: `${m[1]}~${m[2]}세 · ●●` };
          return { lock: false };
        },
        row: (r, i, rows) => {
          const cur = rows.findIndex((x) => x.highlight);
          return cur >= 0 && i > cur;
        },
      };
    }
    case "years":
      return {
        sec: (s) => {
          if (s.heading.startsWith(`${year + 1}년`)) return { lock: true, heading: `${year + 1}년 · 내년의 흐름` };
          return { lock: /^\d분기/.test(s.heading) || s.heading.endsWith("포인트 달") };
        },
        row: (r, i, rows, title) => {
          if (title.includes("월별")) return i >= 2;
          const cur = rows.findIndex((x) => x.highlight);
          return cur >= 0 && i > cur;
        },
      };
    case "lucky":
      return {
        sec: (s) => ({ lock: ["한 달 행운 처방전", "마무리 편지", "잘 맞는 사람의 결", "서로 맞춰 가면 좋은 결"].includes(s.heading) }),
        row: (r, i) => i >= 1,
      };
    default:
      return { sec: () => ({ lock: false }) };
  }
}

export function applyLocks(pages: BookPage[], year: number): BookPage[] {
  return pages.map((p) => {
    const rules = rulesFor(p, year);
    return {
      ...p,
      sections: p.sections.map((s, n) => {
        const r = rules.sec(s, n);
        return r.lock ? lockSection(s, r.heading) : s;
      }),
      tables: p.tables.map((t) => ({
        ...t,
        rows: t.rows.map((r, i) => (rules.row?.(r, i, t.rows, t.title) ? lockRow(r) : r)),
      })),
    };
  });
}

/** 잠긴 풀이 수 (화면 안내용) */
export function countLocked(pages: BookPage[]): number {
  return pages.reduce((a, p) => a + p.sections.filter((s) => s.locked).length, 0);
}
