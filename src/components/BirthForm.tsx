"use client";

import { useState } from "react";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import type { BirthInput, Pillar, SajuChart } from "@/lib/saju/types";

function PillarCell({ pillar }: { pillar: Pillar | null }) {
  if (!pillar) {
    return (
      <td colSpan={1} className="pillar unknown">
        <div>?</div>
        <div>?</div>
      </td>
    );
  }
  const stem = STEMS.find((s) => s.hanja === pillar.stem);
  const branch = BRANCHES.find((b) => b.hanja === pillar.branch);
  return (
    <td className="pillar">
      <div>
        {pillar.stem}
        <small>{stem?.hangul}</small>
      </div>
      <div>
        {pillar.branch}
        <small>{branch?.hangul}</small>
      </div>
    </td>
  );
}

function ChartView({ chart }: { chart: SajuChart }) {
  return (
    <div className="result">
      <table className="chart">
        <thead>
          <tr>
            <th>시주</th>
            <th>일주</th>
            <th>월주</th>
            <th>연주</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <PillarCell pillar={chart.hour} />
            <PillarCell pillar={chart.day} />
            <PillarCell pillar={chart.month} />
            <PillarCell pillar={chart.year} />
          </tr>
        </tbody>
      </table>

      <p className="meta">
        양력 {chart.solarDate.year}.{chart.solarDate.month}.{chart.solarDate.day}
      </p>
      {chart.uncertainPillars.length > 0 && (
        <p className="notice">
          이 날은 절기가 바뀌는 날이라, 태어난 시각을 알아야 연주/월주를 정확히 알 수 있어요.
        </p>
      )}
      {chart.warnings.map((w) => (
        <p key={w} className="notice">
          {w}
        </p>
      ))}
    </div>
  );
}

export default function BirthForm() {
  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<SajuChart | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setChart(null);
    setReading(null);
    setError(null);

    const form = new FormData(e.currentTarget);
    // 음력은 달력 입력창으로는 "2월 30일" 같은 날짜를 고를 수 없어서 숫자로 직접 받습니다.
    const [year, month, day] =
      calendar === "lunar"
        ? [Number(form.get("ly")), Number(form.get("lm")), Number(form.get("ld"))]
        : String(form.get("date")).split("-").map(Number);
    const time = String(form.get("time") ?? "");
    const [hour, minute] = time ? time.split(":").map(Number) : [undefined, undefined];

    const input: BirthInput = {
      year,
      month,
      day,
      hour,
      minute,
      calendar,
      isLeapMonth: calendar === "lunar" && form.get("leap") === "on",
      gender: form.get("gender") === "female" ? "female" : "male",
    };

    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청에 실패했어요.");
      setChart(data.chart);
      setReading(data.reading ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          양력/음력
          <select name="calendar" value={calendar} onChange={(e) => setCalendar(e.target.value as "solar" | "lunar")}>
            <option value="solar">양력</option>
            <option value="lunar">음력</option>
          </select>
        </label>
        {calendar === "solar" ? (
          <label>
            생년월일
            <input type="date" name="date" min="1900-01-01" max="2100-12-31" required />
          </label>
        ) : (
          <>
            <div className="row">
              <label>
                음력 연
                <input type="number" name="ly" min={1900} max={2100} placeholder="1990" required />
              </label>
              <label>
                월
                <input type="number" name="lm" min={1} max={12} required />
              </label>
              <label>
                일
                <input type="number" name="ld" min={1} max={30} required />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" name="leap" /> 윤달이에요
            </label>
          </>
        )}
        <label>
          태어난 시간 (모르면 비워두세요)
          <input type="time" name="time" />
        </label>
        <label>
          성별
          <select name="gender" defaultValue="male">
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" name="consent" required />
          <span>
            (필수) 사주 계산을 위해 생년월일·성별(선택: 태어난 시간)을 처리하는 것에 동의해요.{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              개인정보처리방침 보기
            </a>
          </span>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "계산 중..." : "사주 보기"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {chart && <ChartView chart={chart} />}
      {chart && !reading && <p className="meta">AI 풀이는 준비 중이에요.</p>}
      {reading && <div className="result">{reading}</div>}
    </>
  );
}
