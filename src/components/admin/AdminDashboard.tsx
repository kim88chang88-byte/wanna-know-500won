"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminStats } from "@/lib/admin/stats";

type State =
  | { kind: "loading" }
  | { kind: "login" }
  | { kind: "forbidden"; yourId: string | null; configured: boolean }
  | { kind: "error"; message: string }
  | { kind: "ok"; stats: AdminStats };

const PERIODS = [7, 30, 90] as const;
const CARD = "rounded-2xl bg-white border border-brand-100 p-4 sm:p-5 shadow-[0_4px_20px_rgba(34,94,170,0.06)]";
const H2 = "font-serifKr font-bold text-base text-brand-700 mb-3";

function Bars({ rows, testId }: { rows: Array<{ label: string; count: number }>; testId: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (rows.length === 0) return <p className="text-xs text-gray-400">아직 데이터가 없어요.</p>;
  return (
    <ul data-testid={testId} className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-2 text-xs">
          <span className="w-32 sm:w-44 shrink-0 truncate text-gray-700" title={r.label}>
            {r.label}
          </span>
          <span className="flex-1 h-3 rounded-full bg-brand-50 overflow-hidden" aria-hidden="true">
            <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(r.count / max) * 100}%` }} />
          </span>
          <span className="w-8 text-right tabular-nums font-bold text-gray-800">{r.count}</span>
        </li>
      ))}
    </ul>
  );
}

/** 날짜별 막대 (세로) */
function DayChart({ rows, testId, label }: { rows: Array<{ day: string; count: number }>; testId: string; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((a, r) => a + r.count, 0);
  return (
    <div data-testid={testId}>
      <p className="text-[11px] text-gray-500 mb-1">
        {label} 합계 <b className="text-gray-800">{total}</b>
      </p>
      <div role="img" aria-label={`${label}: 날짜별 막대 그래프`} className="flex items-end gap-[2px] h-24">
        {rows.map((r) => (
          <div key={r.day} title={`${r.day}: ${r.count}`} className="flex-1 min-w-[2px] bg-brand-400 rounded-t-sm" style={{ height: `${Math.max(2, (r.count / max) * 100)}%`, opacity: r.count === 0 ? 0.25 : 1 }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>{rows[0]?.day.slice(5)}</span>
        <span>{rows[rows.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

function Kpi({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <div className={CARD} data-testid={testId}>
      <div className="text-[11px] font-bold text-gray-500">{label}</div>
      <div className="mt-1 font-serifKr text-2xl font-black text-brand-700 tabular-nums">{value.toLocaleString("ko-KR")}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [days, setDays] = useState<number>(30);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [hideError, setHideError] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/admin/stats?days=${d}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as { stats?: AdminStats; error?: string; yourId?: string; adminConfigured?: boolean } | null;
      if (res.status === 401) return setState({ kind: "login" });
      if (res.status === 403) return setState({ kind: "forbidden", yourId: data?.yourId ?? null, configured: data?.adminConfigured === true });
      if (!res.ok || !data?.stats) return setState({ kind: "error", message: data?.error ?? "통계를 불러오지 못했어요." });
      setState({ kind: "ok", stats: data.stats });
    } catch {
      setState({ kind: "error", message: "네트워크 오류가 났어요. 잠시 뒤에 다시 시도해 주세요." });
    }
  }, []);

  async function toggleHidden(id: number, hidden: boolean) {
    setHideError(null);
    try {
      const res = await fetch("/api/admin/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, hidden }) });
      if (!res.ok) throw new Error();
      setState((cur) => {
        if (cur.kind !== "ok") return cur;
        const list = cur.stats.reviews.list.map((r) => (r.id === id ? { ...r, hidden } : r));
        return { kind: "ok", stats: { ...cur.stats, reviews: { ...cur.stats.reviews, list } } };
      });
    } catch {
      setHideError("처리하지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
    }
  }

  useEffect(() => {
    void load(days);
  }, [days, load]);

  return (
    <main className="min-h-screen bg-[#F4F8FD] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="font-serifKr font-black text-xl text-gray-900">🫧 도리 관리자</h1>
            <p className="text-[11px] text-gray-500">개인 식별 정보(회원번호·생년월일)는 이 화면에 나오지 않아요.</p>
          </div>
          <a href="/" className="text-xs font-bold text-brand-600 underline underline-offset-2">
            사이트로 돌아가기
          </a>
        </header>

        {state.kind === "loading" && (
          <p role="status" data-testid="admin-loading" className={`${CARD} text-center text-sm text-gray-500`}>
            불러오는 중…
          </p>
        )}

        {state.kind === "login" && (
          <div data-testid="admin-login" className={`${CARD} text-center`}>
            <p className="font-bold text-gray-800">로그인이 필요해요</p>
            <p className="mt-1 text-xs text-gray-500">사이트에서 평소처럼 로그인한 뒤 이 주소로 다시 들어와 주세요.</p>
            <a href="/" className="mt-3 inline-block px-4 py-2 rounded-full bg-brand-600 text-white text-xs font-bold">
              사이트에서 로그인하기
            </a>
          </div>
        )}

        {state.kind === "forbidden" && (
          <div data-testid="admin-forbidden" className={`${CARD}`}>
            <p className="font-bold text-gray-800 text-center">관리자 권한이 없어요</p>
            {state.yourId ? (
              <div className="mt-3 text-xs text-gray-600 leading-relaxed">
                {state.configured ? "이 계정은 관리자 목록에 없어요." : "관리자 목록(ADMIN_USER_IDS)이 아직 설정되지 않았어요."} 내 계정으로 관리자가 되려면 Vercel 환경변수{" "}
                <code className="px-1 rounded bg-brand-50">ADMIN_USER_IDS</code> 에 아래 값을 넣고 다시 배포해 주세요. (여러 명이면 쉼표로 구분)
                <p data-testid="admin-your-id" className="mt-2 select-all rounded-lg bg-gray-100 px-3 py-2 font-mono text-[13px] text-gray-800 break-all">
                  {state.yourId}
                </p>
                <p className="mt-2 text-[11px] text-gray-400">이 값은 로그인한 본인의 고유번호예요. 남에게 공유하지 마세요.</p>
              </div>
            ) : null}
          </div>
        )}

        {state.kind === "error" && (
          <p role="alert" data-testid="admin-error" className={`${CARD} text-sm text-red-600`}>
            {state.message}
          </p>
        )}

        {state.kind === "ok" && (
          <div data-testid="admin-stats" className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div role="group" aria-label="기간" className="flex gap-1.5">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    data-testid={`period-${p}`}
                    aria-pressed={days === p}
                    onClick={() => setDays(p)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-bold ${days === p ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-700 border-brand-200"}`}
                  >
                    최근 {p}일
                  </button>
                ))}
              </div>
              <a data-testid="csv-link" href={`/api/admin/concerns?days=${days}`} className="text-xs font-bold text-brand-600 underline underline-offset-2">
                고민 통계 CSV 내려받기
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Kpi label="전체 회원" value={state.stats.totals.users} testId="kpi-users" />
              <Kpi label="생년월일시 기억한 회원" value={state.stats.totals.profiles} testId="kpi-profiles" />
              <Kpi label="전체 뽑기" value={state.stats.totals.draws} testId="kpi-draws" />
              <Kpi label="고민 통계 동의 건수(전체)" value={state.stats.totals.concernLogs} testId="kpi-concerns" />
              <Kpi label="전체 후기" value={state.stats.totals.reviews} testId="kpi-reviews" />
            </div>

            <section className={CARD} data-testid="reviews-section">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                <h2 className="font-serifKr font-bold text-base text-brand-700">사용후기 (최근 {state.stats.days}일)</h2>
                <a data-testid="reviews-csv-link" href={`/api/admin/reviews?days=${days}`} className="text-xs font-bold text-brand-600 underline underline-offset-2">
                  후기 CSV 내려받기
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-brand-50 px-3 py-2" data-testid="review-average">
                  <div className="text-[11px] font-bold text-gray-500">평균 별점</div>
                  <div className="font-serifKr text-2xl font-black text-amber-500 tabular-nums">{state.stats.reviews.average === null ? "-" : `★ ${state.stats.reviews.average.toFixed(1)}`}</div>
                </div>
                <div className="rounded-xl bg-brand-50 px-3 py-2" data-testid="review-count">
                  <div className="text-[11px] font-bold text-gray-500">후기 수 (숨김 제외)</div>
                  <div className="font-serifKr text-2xl font-black text-brand-700 tabular-nums">{state.stats.reviews.count}</div>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-bold text-gray-500 mb-1">별점 분포</p>
                <Bars testId="bars-rating" rows={[5, 4, 3, 2, 1].map((n) => ({ label: `${"★".repeat(n)}`, count: state.stats.reviews.distribution[n - 1] ?? 0 }))} />
              </div>
              {state.stats.reviews.reasons.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-gray-500 mb-1">아쉬웠던 점</p>
                  <Bars testId="bars-reasons" rows={state.stats.reviews.reasons.map((r) => ({ label: r.label, count: r.count }))} />
                </div>
              )}
              {hideError && (
                <p role="alert" className="mt-2 text-[11px] font-bold text-red-600">
                  {hideError}
                </p>
              )}
              {state.stats.reviews.list.length === 0 ? (
                <p className="mt-3 text-xs text-gray-400">아직 후기가 없어요.</p>
              ) : (
                <ul data-testid="review-list" className="mt-3 divide-y divide-brand-100">
                  {state.stats.reviews.list.map((r) => (
                    <li key={r.id} data-testid="review-item" data-hidden={r.hidden ? "true" : "false"} className={`py-2 text-xs ${r.hidden ? "opacity-50" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] text-gray-400">
                            <span className="text-amber-500 text-[13px]" aria-label={`${r.rating}점`}>
                              {"★".repeat(r.rating)}
                              <span className="text-gray-300">{"★".repeat(5 - r.rating)}</span>
                            </span>{" "}
                            {r.day} · {r.topic}
                            {r.premium ? " · 프리미엄" : ""}
                            {r.reasons.length > 0 ? ` · ${r.reasons.join(", ")}` : ""}
                            {r.hidden ? " · 숨김" : ""}
                          </div>
                          {r.text ? <p className="mt-0.5 text-gray-800 whitespace-pre-wrap break-words">{r.text}</p> : <p className="mt-0.5 text-gray-300">(글 없음)</p>}
                        </div>
                        <button
                          type="button"
                          data-testid="review-hide"
                          onClick={() => toggleHidden(r.id, !r.hidden)}
                          className="shrink-0 text-[11px] font-bold text-gray-500 underline underline-offset-2 hover:text-gray-700"
                        >
                          {r.hidden ? "다시 보이기" : "숨기기"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[10px] text-gray-400">숨긴 후기는 평균과 분포에서 빠져요. 글에 개인정보가 있으면 외부에 공유하지 마세요.</p>
            </section>

            <section className={CARD}>
              <h2 className={H2}>로그인 회원의 뽑기 (최근 {state.stats.days}일)</h2>
              <DayChart rows={state.stats.drawsByDay} testId="chart-draws" label="뽑기" />
              <p className="mt-2 text-[10px] text-gray-400">로그인하지 않은 사람의 뽑기는 서버에 기록되지 않아서 포함되지 않아요.</p>
            </section>

            <div className="grid sm:grid-cols-2 gap-4">
              <section className={CARD}>
                <h2 className={H2}>신규 가입</h2>
                <DayChart rows={state.stats.signupsByDay} testId="chart-signups" label="가입" />
              </section>
              <section className={CARD}>
                <h2 className={H2}>주제별 뽑기</h2>
                <Bars testId="bars-topics" rows={state.stats.drawsByTopic.map((t) => ({ label: t.topic, count: t.count }))} />
              </section>
            </div>

            <section className={CARD}>
              <h2 className={H2}>
                많이 고른 고민 <span className="text-[11px] font-normal text-gray-400">(동의한 {state.stats.concernsInPeriod}건 기준)</span>
              </h2>
              <Bars testId="bars-tags" rows={state.stats.concernTags.map((t) => ({ label: t.label, count: t.count }))} />
            </section>

            <div className="grid sm:grid-cols-2 gap-4">
              <section className={CARD}>
                <h2 className={H2}>나이대별 상위 고민</h2>
                {state.stats.concernByAge.length === 0 ? (
                  <p className="text-xs text-gray-400">아직 데이터가 없어요.</p>
                ) : (
                  <ul data-testid="age-list" className="space-y-3">
                    {state.stats.concernByAge.map((a) => (
                      <li key={a.ageBand}>
                        <div className="text-xs font-bold text-gray-800">
                          {a.ageBand} <span className="font-normal text-gray-400">({a.total}건)</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {a.tags.map((t) => (
                            <span key={t.id} className="px-2 py-0.5 rounded-full bg-brand-50 text-[11px] text-brand-700">
                              {t.label} · {t.count}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className={CARD}>
                <h2 className={H2}>성별</h2>
                <Bars testId="bars-gender" rows={state.stats.genderSplit.map((g) => ({ label: g.gender, count: g.count }))} />
              </section>
            </div>

            <section className={CARD}>
              <h2 className={H2}>
                직접 쓴 고민 <span className="text-[11px] font-normal text-gray-400">(최신 {state.stats.recentTexts.length}건)</span>
              </h2>
              {state.stats.recentTexts.length === 0 ? (
                <p className="text-xs text-gray-400">아직 직접 쓴 글이 없어요.</p>
              ) : (
                <ul data-testid="text-list" className="divide-y divide-brand-100">
                  {state.stats.recentTexts.map((t, i) => (
                    <li key={`${t.day}-${i}`} className="py-2 text-xs">
                      <div className="text-[10px] text-gray-400">
                        {t.day} · {t.ageBand} · {t.gender} · {t.topic}
                        {t.tags.length > 0 ? ` · ${t.tags.join(", ")}` : ""}
                      </div>
                      {/* 글은 항상 문자열로만 그려요 (HTML 로 해석하지 않아요) */}
                      <p className="mt-0.5 text-gray-800 whitespace-pre-wrap break-words">{t.text}</p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[10px] text-gray-400">이름·연락처 같은 개인정보가 적혀 있으면 이 글을 외부에 공유하지 마세요.</p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
