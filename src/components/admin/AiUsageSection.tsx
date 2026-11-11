"use client";

import { useEffect, useState } from "react";

interface Row { day: string; model: string; calls: number; cacheHits: number; input: number; output: number; krw: number | null }
interface Sum { calls: number; cacheHits: number; krw: number; unknownPrice: boolean }
interface Usage { today: Sum; total: Sum; rows: Row[] }

const CARD = "rounded-2xl bg-white border border-brand-100 p-4 sm:p-5 shadow-[0_4px_20px_rgba(128,87,224,0.06)]";
const won = (n: number) => `약 ${Math.round(n).toLocaleString("ko-KR")}원`;

/** 관리자 화면: 오늘/최근 14일 AI 호출 횟수와 대략의 비용, 캐시로 아낀 횟수 */
export default function AiUsageSection() {
  const [u, setU] = useState<Usage | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/ai-usage", { cache: "no-store" })
      .then(async (res) => {
        const j = await res.json().catch(() => null);
        if (!alive) return;
        if (res.ok && j && j.today && j.total && Array.isArray(j.rows)) setU(j as Usage);
        else setErr(typeof j?.error === "string" ? j.error : "불러오지 못했어.");
      })
      .catch(() => alive && setErr("불러오지 못했어."));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className={CARD} data-testid="ai-usage-section">
      <h2 className="font-serifKr font-bold text-base text-brand-700 mb-1">AI 호출·추정 비용</h2>
      <p className="text-[11px] text-gray-400 mb-3">금액은 모델별 단가로 계산한 대략치야. 정확한 청구액은 Google AI Studio / Anthropic 콘솔의 Billing 을 확인해.</p>
      {err && <p className="text-xs text-gray-500" data-testid="ai-usage-error">{err} (supabase/schema.sql 을 다시 Run 해야 기록이 쌓여)</p>}
      {u && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div><div className="text-[11px] font-bold text-gray-500">오늘 호출</div><div className="font-serifKr text-xl font-black text-brand-700 tabular-nums" data-testid="ai-today-calls">{u.today.calls.toLocaleString("ko-KR")}회</div></div>
            <div><div className="text-[11px] font-bold text-gray-500">오늘 추정 비용</div><div className="font-serifKr text-xl font-black text-brand-700 tabular-nums" data-testid="ai-today-krw">{won(u.today.krw)}</div></div>
            <div><div className="text-[11px] font-bold text-gray-500">최근 14일 호출 / 비용</div><div className="font-serifKr text-base font-black text-brand-700 tabular-nums">{u.total.calls.toLocaleString("ko-KR")}회 · {won(u.total.krw)}</div></div>
            <div><div className="text-[11px] font-bold text-gray-500">캐시로 아낀 호출(14일)</div><div className="font-serifKr text-xl font-black text-emerald-600 tabular-nums" data-testid="ai-cache-hits">{u.total.cacheHits.toLocaleString("ko-KR")}회</div></div>
          </div>
          {u.total.unknownPrice && <p className="text-[11px] text-amber-600 mb-2">단가를 모르는 모델이 있어 그 비용은 합계에서 빠졌어.</p>}
          {u.rows.length === 0 ? (
            <p className="text-xs text-gray-400">아직 기록이 없어. 이 기능을 배포한 뒤부터 쌓여.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs tabular-nums" data-testid="ai-usage-table">
                <thead><tr className="text-left text-gray-400"><th className="py-1 pr-2 font-bold">날짜</th><th className="pr-2 font-bold">모델</th><th className="pr-2 text-right font-bold">호출</th><th className="pr-2 text-right font-bold">캐시</th><th className="pr-2 text-right font-bold">토큰(입/출)</th><th className="text-right font-bold">추정</th></tr></thead>
                <tbody>
                  {u.rows.map((r) => (
                    <tr key={`${r.day}-${r.model}`} className="border-t border-brand-50 text-gray-700">
                      <td className="py-1 pr-2">{r.day}</td><td className="pr-2">{r.model}</td>
                      <td className="pr-2 text-right">{r.calls}</td><td className="pr-2 text-right">{r.cacheHits}</td>
                      <td className="pr-2 text-right">{r.input.toLocaleString("ko-KR")} / {r.output.toLocaleString("ko-KR")}</td>
                      <td className="text-right">{r.krw === null ? "-" : won(r.krw)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
