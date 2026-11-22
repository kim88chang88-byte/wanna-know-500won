import { DAYMASTER_BRIEF } from "@/lib/mbtiBrief";
import { STEMS } from "@/lib/saju/constants";
import type { LetterFacts } from "@/lib/ai/bookNotes";
import { ELEMENT_INFO } from "./topic";
import type { PremiumReportView } from "./types";

/** 나이 숫자를 "30대 초반"처럼 뭉뚱그려요. 정확한 나이는 편지에 쓰지 않아요. */
export function ageBand(age: number): string {
  if (!Number.isFinite(age) || age < 10 || age > 99) return "";
  const t = Math.floor(age / 10) * 10;
  const u = age % 10;
  return `${t}대 ${u <= 3 ? "초반" : u <= 6 ? "중반" : "후반"}`;
}

/** 마지막 쪽 편지에 넘길 사실. 일주를 알 수 없거나 마지막 당부 쪽이 없으면 null */
export function buildLetterFacts(report: PremiumReportView, birthYear: number, nowYear: number): LetterFacts | null {
  const day = report.pillars.find((p) => p.key === "day");
  if (!day?.full || !day.reading) return null;
  const card = report.book.find((p) => p.key === "lucky")?.sections.find((s) => s.heading === "개운 부적 카드");
  const focus = card ? Object.keys(ELEMENT_INFO).find((k) => card.body.includes(`방향: ${ELEMENT_INFO[k].direction}`)) : undefined;
  const stem = STEMS.find((s) => s.hanja === day.full?.[0]);
  const band = ageBand(nowYear - birthYear);
  if (!focus || !stem || !band) return null;
  const els = [...report.elements].sort((a, b) => b.count - a.count);
  const bits: string[] = [];
  if (els[0] && els[els.length - 1] && els[0].name !== els[els.length - 1].name) bits.push(`가장 많은 기운 ${els[0].name}(${els[0].count}개), 가장 적은 기운 ${els[els.length - 1].name}(${els[els.length - 1].count}개)`);
  if (report.strength?.grade) bits.push(report.strength.grade);
  if (report.geukguk) bits.push(report.geukguk);
  const dn = report.daeun?.list.find((d) => d.current)?.ganzhi;
  if (dn) bits.push(`지금 ${dn} 대운`);
  if (report.seyun?.ganzhi) bits.push(`올해 ${report.seyun.ganzhi}년`);
  return { 책속이야기: bits.join(" · ") || undefined, 일주: `${day.reading}일주`, 나이대: band, 겉모습: DAYMASTER_BRIEF[stem.element], 부족한오행: focus };
}
