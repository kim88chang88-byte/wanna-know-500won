import type { BookPage, PremiumReportView } from "@/lib/premium/types";

/*
 * 풀이 글을 친구에게 보낼 한 덩어리 글로 만들어요. (이 기기에서만 만들고 서버에 저장하지 않아요)
 * 생년월일·시간·사주 글자표는 넣지 않고, 잠긴 풀이(가려진 글)는 아예 빼요.
 */

export interface ShareReading {
  keyword?: string;
  total?: { summary?: string };
  kkotgeoji?: string | null;
  reason?: string | null;
  story?: string | null;
  folds?: object | null;
  heads?: object | null;
}

export type ShareMode = "full" | "short";

export interface ShareTextOptions {
  mode: ShareMode;
  /** 풀이 속 이름. null 이면 "친구"로 바꿔요 */
  name: string | null;
  /** 이름을 넣을지 */
  withName: boolean;
  topic: string;
  url: string;
  partnerName?: string | null;
}

const clean = (s: string | null | undefined) => (s ?? "").replace(/\r/g, "").trim();

function pageLines(p: BookPage): string[] {
  const out: string[] = [`▪ ${p.title}`];
  if (p.lead) out.push(clean(p.lead));
  for (const s of p.sections) {
    if (s.locked) continue;
    out.push(`${s.heading}`, clean(s.body));
  }
  if (p.note) out.push(`🦦 ${clean(p.note)}`);
  if (p.advice) out.push(`💌 ${clean(p.advice)}`);
  return out;
}

export function buildShareText(report: PremiumReportView, reading: ShareReading | null, o: ShareTextOptions): string {
  const full = o.mode === "full";
  const who = o.withName && o.name ? `${o.name}님의 ` : "";
  const c = report.compat;
  const head = c ? `💞 ${who ? `${o.name}님과 ${o.partnerName && o.withName ? o.partnerName : "상대"}의` : "두 사람의"} 궁합 풀이` : `🌙 ${who}${o.topic} 풀이`;
  const out: string[] = [head];

  if (reading?.keyword) out.push(`“${clean(reading.keyword)}”`);
  if (c) {
    out.push(`\n📌 ${clean(c.headline)} (${c.score}점)`);
    if (c.summary || c.ai?.summary) out.push(clean(c.ai?.summary ?? c.summary));
  } else if (reading?.total?.summary) {
    out.push(`\n📌 한 줄 결론\n${clean(reading.total.summary)}`);
  }
  if (reading?.kkotgeoji) out.push(`\n🦦 도리 한마디\n${clean(reading.kkotgeoji)}`);

  if (full) {
    if (reading?.reason) out.push(`\n📖 이유\n${clean(reading.reason)}`);
    if (reading?.story) out.push(`\n📖 요약하자면\n${clean(reading.story)}`);
    const heads = (reading?.heads ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries((reading?.folds ?? {}) as Record<string, unknown>)) {
      if (typeof v !== "string" || !clean(v)) continue;
      out.push(`\n▪ ${typeof heads[k] === "string" ? heads[k] : k}\n${clean(v)}`);
    }
    if (report.concern) for (const a of report.concern.answers) out.push(`\n${a.emoji} ${a.title}\n${clean(a.body)}`);
    if (c) {
      for (const p of c.points) out.push(`\n${p.tone === "good" ? "💚" : "💛"} ${p.title}\n${clean(p.body)}`);
      for (const t of c.tips ?? []) out.push(`\n💡 ${t.title}\n${clean(t.body)}`);
      for (const t of c.timing ?? []) out.push(`\n🗓 ${t.title}\n${clean(t.body)}`);
      if (c.closing) out.push(`\n${clean(c.closing)}`);
    }
    for (const p of report.book) out.push("", ...pageLines(p));
  } else if (c?.points?.length) {
    for (const p of c.points.slice(0, 3)) out.push(`\n${p.tone === "good" ? "💚" : "💛"} ${p.title}\n${clean(p.body)}`);
  }

  out.push("\n━━━━━━━━━━", "✨ 나도 내 사주 보기 (매일 첫 1회 무료)", `👉 ${o.url}`);
  let text = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!o.withName && o.name) text = text.split(`${o.name}님`).join("친구").split(o.name).join("친구");
  if (!o.withName && o.partnerName) text = text.split(`${o.partnerName}님`).join("상대").split(o.partnerName).join("상대");
  return text;
}
