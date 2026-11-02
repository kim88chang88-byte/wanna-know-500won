"use client";

import { useEffect, useMemo, useState } from "react";
import { FUNNEL_STEPS } from "@/lib/visitTrack";

interface Row { src: string; event: string; n: number }
interface Daily { day: string; visitors: number; fresh: number }

const CARD = "rounded-2xl bg-white border border-brand-100 p-4 sm:p-5 shadow-[0_4px_20px_rgba(128,87,224,0.06)]";
const pct = (n: number, base: number) => (base > 0 ? `${Math.round((n / base) * 100)}%` : "-");

/** 관리자 화면: 방문→행동 퍼널과 유입 경로별 숫자 (사람 수, 익명 ID 기준) */
export default function FunnelSection({ days }: { days: number }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [daily, setDaily] = useState<Daily[]>([]);
  const [utm, setUtm] = useState("insta");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setRows(null);
    setErr(null);
    fetch(`/api/admin/funnel?days=${days}`, { cache: "no-store" })
      .then(async (res) => {
        const j = await res.json().catch(() => null);
        if (!alive) return;
        if (res.ok && j && Array.isArray(j.rows)) {
          setRows(j.rows as Row[]);
          setDaily(Array.isArray(j.daily) ? (j.daily as Daily[]) : []);
        }
        else setErr(typeof j?.error === "string" ? j.error : "불러오지 못했어요.");
      })
      .catch(() => alive && setErr("불러오지 못했어요."));
    return () => {
      alive = false;
    };
  }, [days]);

  const { total, bySrc, srcList } = useMemo(() => {
    const total = new Map<string, number>();
    const bySrc = new Map<string, Map<string, number>>();
    for (const r of rows ?? []) {
      total.set(r.event, (total.get(r.event) ?? 0) + r.n); // 같은 사람이 출처 하나에만 속해서 더해도 중복이 없어요
      const m = bySrc.get(r.src) ?? new Map<string, number>();
      m.set(r.event, r.n);
      bySrc.set(r.src, m);
    }
    const srcList = [...bySrc.entries()].sort((a, b) => (b[1].get("visit") ?? 0) - (a[1].get("visit") ?? 0)).slice(0, 10);
    return { total, bySrc, srcList };
  }, [rows]);

  const visits = total.get("visit") ?? 0;
  return (
    <section className={CARD} data-testid="funnel-section">
      <h2 className="font-serifKr font-bold text-base text-brand-700 mb-1">방문 → 행동 퍼널 (최근 {days}일)</h2>
      <p className="text-[11px] text-gray-400 mb-3">익명 ID 기준 사람 수예요. 같은 사람이 같은 날 여러 번 해도 한 번으로 세고, 회원 번호와는 연결하지 않아요.</p>
      {err && <p className="text-xs text-gray-500">{err}</p>}
      {!err && rows === null && <p className="text-xs text-gray-400">불러오는 중…</p>}
      {rows && (
        <>
          <ul className="space-y-1.5 mb-4" data-testid="funnel-steps">
            {FUNNEL_STEPS.map((s) => {
              const n = total.get(s.key) ?? 0;
              return (
                <li key={s.key} className="flex items-center gap-2 text-xs">
                  <span className="w-24 shrink-0 text-gray-600">{s.label}</span>
                  <span className="relative h-4 flex-1 overflow-hidden rounded-full bg-brand-50">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-brand-400/70" style={{ width: `${visits > 0 ? Math.min(100, (n / visits) * 100) : 0}%` }} />
                  </span>
                  <span className="w-20 shrink-0 text-right tabular-nums text-gray-800">
                    {n.toLocaleString("ko-KR")} <span className="text-gray-400">({pct(n, visits)})</span>
                  </span>
                </li>
              );
            })}
          </ul>
          {daily.length > 0 && (
            <div className="mb-4" data-testid="funnel-daily">
              <h3 className="mb-1 text-xs font-bold text-gray-600">
                일별 방문자 <span className="font-normal text-gray-400">(진한 부분 = 처음 온 사람, 연한 부분 = 다시 온 사람)</span>
              </h3>
              <ul className="space-y-0.5">
                {daily.slice(-14).map((d) => {
                  const max = Math.max(1, ...daily.slice(-14).map((x) => x.visitors));
                  return (
                    <li key={d.day} className="flex items-center gap-2 text-[11px]">
                      <span className="w-12 shrink-0 text-gray-400 tabular-nums">{d.day.slice(5)}</span>
                      <span className="flex h-3 flex-1 overflow-hidden rounded-full bg-brand-50">
                        <span className="h-full bg-brand-500" style={{ width: `${(d.fresh / max) * 100}%` }} />
                        <span className="h-full bg-brand-300/70" style={{ width: `${((d.visitors - d.fresh) / max) * 100}%` }} />
                      </span>
                      <span className="w-14 shrink-0 text-right tabular-nums text-gray-700">
                        {d.visitors} <span className="text-gray-400">(+{d.fresh})</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <h3 className="mb-1 text-xs font-bold text-gray-600">처음 온 경로별</h3>
          {srcList.length === 0 ? (
            <p className="text-xs text-gray-400">아직 기록이 없어요.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs tabular-nums" data-testid="funnel-src-table">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="py-1 pr-2 font-normal">경로</th>
                    <th className="py-1 pr-2 text-right font-normal">방문</th>
                    <th className="py-1 pr-2 text-right font-normal">한마디</th>
                    <th className="py-1 pr-2 text-right font-normal">뽑기완료</th>
                    <th className="py-1 pr-2 text-right font-normal">로그인</th>
                    <th className="py-1 text-right font-normal">신규가입</th>
                  </tr>
                </thead>
                <tbody>
                  {srcList.map(([src, m]) => {
                    const v = m.get("visit") ?? 0;
                    const cell = (k: string) => `${m.get(k) ?? 0} (${pct(m.get(k) ?? 0, v)})`;
                    return (
                      <tr key={src} className="border-t border-brand-100">
                        <td className="py-1 pr-2 text-gray-700 break-all">{src}</td>
                        <td className="py-1 pr-2 text-right">{v}</td>
                        <td className="py-1 pr-2 text-right">{cell("bday_read")}</td>
                        <td className="py-1 pr-2 text-right">{cell("draw_done")}</td>
                        <td className="py-1 pr-2 text-right">{cell("login_done")}</td>
                        <td className="py-1 text-right">{cell("signup")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 rounded-xl bg-brand-50/60 p-3" data-testid="utm-maker">
            <h3 className="mb-1 text-xs font-bold text-gray-600">홍보 링크 만들기</h3>
            <p className="mb-2 text-[10px] text-gray-400">인스타·블로그·카톡 등에 올릴 링크에 이름표를 붙여요. 영문·숫자만 쓰세요. (예: insta, blog1, kakao)</p>
            <div className="flex gap-2">
              <input
                value={utm}
                onChange={(e) => {
                  setUtm(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 30));
                  setCopied(false);
                }}
                className="min-w-0 flex-1 rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-xs"
                aria-label="링크 이름표"
              />
              <button
                type="button"
                disabled={!utm}
                onClick={() => {
                  const link = `${window.location.origin}/?utm_source=${utm}`;
                  void navigator.clipboard?.writeText(link).then(() => setCopied(true)).catch(() => undefined);
                }}
                className="shrink-0 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
              >
                {copied ? "복사됨!" : "링크 복사"}
              </button>
            </div>
            <p className="mt-1.5 break-all text-[10px] text-gray-500">{typeof window !== "undefined" ? `${window.location.origin}/?utm_source=${utm || "이름표"}` : ""}</p>
          </div>
          <p className="mt-2 text-[10px] text-gray-400">경로: direct=직접 접속, friend=친구 초대 링크, utm:이름=주소의 utm_source, web:도메인=다른 사이트에서 이동. 이 기능을 켠 이후 처음 온 사람부터 기록돼요.</p>
        </>
      )}
    </section>
  );
}
