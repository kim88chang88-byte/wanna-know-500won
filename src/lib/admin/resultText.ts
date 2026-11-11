import type { BookPage, PremiumReportView } from "@/lib/premium/types";

/** 관리자가 AI 가 쓴 결과 글을 통째로 복사해서 품질을 점검할 때 쓰는 글자 모음 (화면에는 안 나와요) */
export interface ResultTextMeta {
  topic?: string;
  name?: string | null;
  partnerName?: string | null;
  at?: Date;
}

/** 읽는 사람이 붙여 넣어도 알아보기 쉽게, 쪽·소제목 순서대로 이어 붙여요. */
function pageText(p: BookPage): string {
  const out: string[] = [`## ${p.no}쪽 · ${p.title}`, ...(p.lead ? [`(한 줄) ${p.lead}`] : [])];
  if (p.explainer) out.push(`[쉬운 설명: ${p.explainer.title}] ${p.explainer.body}`);
  for (const s of p.sections) {
    if (s.locked) continue;
    out.push(`### ${s.heading}`, s.body);
    if (s.checks?.length) out.push(...s.checks.map((c) => `- (나와 비슷해) ${c}`));
  }
  for (const t of p.tables) {
    const rows = t.rows.filter((r) => !r.locked).map((r) => `- ${r.label}: ${r.value}${r.note ? ` (${r.note})` : ""}`);
    if (rows.length) out.push(`[표: ${t.title}]`, ...rows);
  }
  if (p.chart) out.push(`[그래프: ${p.chart.title}] ${p.chart.caption}`, ...p.chart.callouts.map((c) => `- ${c.label}: ${c.text}`));
  if (p.note) out.push(`(도리의 한 줄) ${p.note}`);
  if (p.advice) out.push(`(맞춤 조언) ${p.advice}`);
  return out.join("\n");
}

export function resultToText(report: PremiumReportView, reading: unknown, meta: ResultTextMeta = {}): string {
  const out: string[] = [
    `# 결과 복사 — ${meta.topic ?? report.topic?.label ?? ""}`.trim(),
    `시각: ${(meta.at ?? new Date()).toISOString()} · 등급: ${report.level}${report.compat ? " · 궁합" : ""}${report.hourUnknown ? " · 태어난 시간 모름" : ""}`,
    `이름: ${meta.name ?? "-"}${report.compat ? ` / 상대: ${meta.partnerName ?? "-"}` : ""}`,
    `핵심: ${report.summary}`,
    `격국: ${report.geukguk} · 용신: ${report.yongsin.join(", ")}`,
  ];
  if (report.concern) out.push(`\n## 고민 답변\n(고민 글) ${report.concern.text}`, ...report.concern.answers.map((a) => `### ${a.title}\n${a.body}`));
  if (report.compat) {
    const c = report.compat;
    out.push(`\n## 궁합 (${c.score}점) ${c.headline}`, ...(c.summary ? [c.summary] : []));
    for (const p of c.points) out.push(`### [${p.tone}] ${p.title}\n${p.body}`);
    for (const t of c.tips ?? []) out.push(`### (도리의 팁) ${t.title}\n${t.body}`);
    for (const t of c.timing ?? []) out.push(`### (흐름) ${t.title}\n${t.body}`);
    if (c.ai) out.push(`### (AI 부분)`, ...Object.entries(c.ai).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(" / ") : v}`));
    out.push(`(마무리) ${c.closing}`);
  }
  const r = reading as { keyword?: string; total?: { summary?: string }; kkotgeoji?: string; reason?: string; story?: string; folds?: Record<string, string>; heads?: Record<string, string> } | null;
  if (r) {
    out.push(`\n## 일반 풀이`, `키워드: ${r.keyword ?? ""}`, `총운: ${r.total?.summary ?? ""}`, `도리 한마디: ${r.kkotgeoji ?? ""}`);
    if (r.reason) out.push(`이유: ${r.reason}`);
    if (r.story) out.push(`### 요약하자면\n${r.story}`);
    for (const [k, v] of Object.entries(r.folds ?? {})) out.push(`### ${r.heads?.[k] ?? k}\n${v}`);
  }
  if (report.book.length) out.push("", ...report.book.map(pageText).flatMap((t) => [t, ""]));
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
