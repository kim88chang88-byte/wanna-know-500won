import { CONCERN_CHIPS, concernLabel, type ConcernId } from "@/lib/concerns";
import type { ConcernLogRow, ReviewRow } from "@/lib/db/supabase";
import { reasonLabel } from "@/lib/reviews";
import { kstDay } from "@/lib/db/kst";

/** 관리자 화면에 내려주는 집계 결과. 개인 식별 정보(회원번호·생년월일)는 들어 있지 않아요. */
export interface AdminStats {
  days: number;
  sinceDay: string;
  totals: { users: number; profiles: number; draws: number; concernLogs: number; reviews: number };
  /** 기간 안의 날짜별 뽑기 수 (빈 날도 0으로 채워요) */
  drawsByDay: Array<{ day: string; count: number }>;
  drawsByTopic: Array<{ topic: string; count: number }>;
  signupsByDay: Array<{ day: string; count: number }>;
  concernsInPeriod: number;
  concernTags: Array<{ id: string; label: string; count: number }>;
  /** 나이대 × 고민 (고민 버튼을 고른 줄만) */
  concernByAge: Array<{ ageBand: string; total: number; tags: Array<{ id: string; label: string; count: number }> }>;
  genderSplit: Array<{ gender: string; count: number }>;
  reviews: {
    /** 기간 안의 후기 수 (숨긴 것 제외) */
    count: number;
    /** 평균 별점 (숨긴 것 제외, 없으면 null) */
    average: number | null;
    /** 별점별 개수 [1점, 2점, 3점, 4점, 5점] */
    distribution: number[];
    reasons: Array<{ id: string; label: string; count: number }>;
    list: Array<{ id: number; day: string; rating: number; text: string; reasons: string[]; topic: string; premium: boolean; hidden: boolean }>;
  };
  recentTexts: Array<{ day: string; ageBand: string; gender: string; topic: string; tags: string[]; text: string }>;
}

const TOPIC_LABEL: Record<string, string> = { general: "오늘의 운", love: "연애운", marriage: "결혼운", money: "재물운", success: "성공운", health: "건강운", study: "2027 신년운" };

/** since 부터 오늘까지 모든 날짜를 만들어요 (KST 기준). */
export function daysBetween(sinceDay: string, today: string): string[] {
  const out: string[] = [];
  const d = new Date(`${sinceDay}T00:00:00Z`);
  const end = new Date(`${today}T00:00:00Z`);
  while (d <= end && out.length < 400) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function sinceDayFor(days: number, now: Date = new Date()): string {
  const d = new Date(`${kstDay(now)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

function tally<K extends string>(keys: K[]): Map<K, number> {
  const m = new Map<K, number>();
  for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

const sortDesc = <T extends { count: number }>(a: T, b: T) => b.count - a.count;

export function buildStats(input: {
  days: number;
  now?: Date;
  totals: AdminStats["totals"];
  draws: Array<{ day: string; topic: string }>;
  signups: Array<{ created_at: string }>;
  concerns: ConcernLogRow[];
  reviews?: ReviewRow[];
  textLimit?: number;
  reviewLimit?: number;
}): AdminStats {
  const now = input.now ?? new Date();
  const today = kstDay(now);
  const sinceDay = sinceDayFor(input.days, now);
  const range = daysBetween(sinceDay, today);

  const dayCounts = tally(input.draws.map((d) => d.day));
  const signupDays = tally(input.signups.map((s) => kstDay(new Date(s.created_at))));
  const topicCounts = tally(input.draws.map((d) => d.topic || "general"));

  const known = new Set<string>(CONCERN_CHIPS.map((c) => c.id));
  const tagLabel = (id: string) => (known.has(id) ? concernLabel(id as ConcernId) : id);
  const allTags = tally(input.concerns.flatMap((c) => (c.tags ?? []).filter((t) => known.has(t))));

  // 나이대별
  const byAge = new Map<string, { total: number; tags: string[] }>();
  for (const c of input.concerns) {
    const tags = (c.tags ?? []).filter((t) => known.has(t));
    if (tags.length === 0) continue;
    const band = c.age_band || "알 수 없음";
    const cur = byAge.get(band) ?? { total: 0, tags: [] };
    cur.total += 1;
    cur.tags.push(...tags);
    byAge.set(band, cur);
  }

  const limit = input.textLimit ?? 50;
  const reviewRows = input.reviews ?? [];
  const visible = reviewRows.filter((r) => !r.hidden);
  const distribution = [1, 2, 3, 4, 5].map((n) => visible.filter((r) => r.rating === n).length);
  const reviewReasons = tally(visible.flatMap((r) => r.reasons ?? []));
  return {
    days: input.days,
    sinceDay,
    totals: input.totals,
    drawsByDay: range.map((day) => ({ day, count: dayCounts.get(day) ?? 0 })),
    drawsByTopic: [...topicCounts].map(([topic, count]) => ({ topic: TOPIC_LABEL[topic] ?? topic, count })).sort(sortDesc),
    signupsByDay: range.map((day) => ({ day, count: signupDays.get(day) ?? 0 })),
    concernsInPeriod: input.concerns.length,
    concernTags: [...allTags].map(([id, count]) => ({ id, label: tagLabel(id), count })).sort(sortDesc),
    concernByAge: [...byAge]
      .map(([ageBand, v]) => ({
        ageBand,
        total: v.total,
        tags: [...tally(v.tags)].map(([id, count]) => ({ id, label: tagLabel(id), count })).sort(sortDesc).slice(0, 5),
      }))
      .sort((a, b) => a.ageBand.localeCompare(b.ageBand)),
    genderSplit: [...tally(input.concerns.map((c) => c.gender || "알 수 없음"))].map(([g, count]) => ({ gender: g === "female" ? "여성" : g === "male" ? "남성" : g, count })).sort(sortDesc),
    reviews: {
      count: visible.length,
      average: visible.length ? Math.round((visible.reduce((a, r) => a + r.rating, 0) / visible.length) * 10) / 10 : null,
      distribution,
      reasons: [...reviewReasons].map(([id, count]) => ({ id, label: reasonLabel(id), count })).sort(sortDesc),
      list: reviewRows.slice(0, input.reviewLimit ?? 50).map((r) => ({
        id: r.id,
        day: kstDay(new Date(r.created_at)),
        rating: r.rating,
        text: r.review_text ?? "",
        reasons: (r.reasons ?? []).map(reasonLabel),
        topic: TOPIC_LABEL[r.topic] ?? r.topic,
        premium: r.premium === true,
        hidden: r.hidden === true,
      })),
    },
    recentTexts: input.concerns
      .filter((c) => c.concern_text)
      .slice(0, limit)
      .map((c) => ({ day: c.day, ageBand: c.age_band || "-", gender: c.gender === "female" ? "여성" : c.gender === "male" ? "남성" : "-", topic: TOPIC_LABEL[c.topic] ?? c.topic, tags: (c.tags ?? []).map(tagLabel), text: c.concern_text as string })),
  };
}

/** CSV 한 칸 만들기. 엑셀에서 수식으로 실행되지 않게 = + - @ 로 시작하면 앞에 ' 를 붙여요. */
export function csvCell(v: string | number | null | undefined): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function concernsToCsv(rows: ConcernLogRow[]): string {
  const head = ["날짜", "주제", "고른 고민", "직접 쓴 글", "성별", "나이대"];
  const lines = rows.map((r) =>
    [r.day, TOPIC_LABEL[r.topic] ?? r.topic, (r.tags ?? []).map((t) => (CONCERN_CHIPS.some((c) => c.id === t) ? concernLabel(t as ConcernId) : t)).join(" / "), r.concern_text, r.gender === "female" ? "여성" : r.gender === "male" ? "남성" : "", r.age_band]
      .map(csvCell)
      .join(","),
  );
  // 엑셀에서 한글이 깨지지 않게 BOM 을 붙여요.
  return "﻿" + [head.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}

export function reviewsToCsv(rows: ReviewRow[]): string {
  const head = ["날짜", "별점", "후기", "아쉬운 점", "주제", "프리미엄", "숨김"];
  const lines = rows.map((r) =>
    [kstDay(new Date(r.created_at)), r.rating, r.review_text, (r.reasons ?? []).map(reasonLabel).join(" / "), TOPIC_LABEL[r.topic] ?? r.topic, r.premium ? "예" : "", r.hidden ? "숨김" : ""].map(csvCell).join(","),
  );
  return "\uFEFF" + [head.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}
