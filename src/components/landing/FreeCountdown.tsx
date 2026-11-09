"use client";

import { useEffect, useState } from "react";
import { formatClock, kstDayOf, msUntilKstMidnight } from "@/lib/freeRefill";

/** 무료 뽑기를 다 썼을 때 칩 아래에 보이는 "다음 충전까지 07:42:10" 시계 */
export default function FreeCountdown({ onElapsed }: { onElapsed?: () => void }) {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const startDay = kstDayOf(Date.now());
    const tick = () => {
      const now = Date.now();
      setMs(msUntilKstMidnight(now));
      // 00시가 지나 날짜가 바뀌면 오늘 쓴 횟수가 0 이 되었으니 화면이 새로 센 횟수를 받도록 알려요
      if (kstDayOf(now) !== startDay) onElapsed?.();
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [onElapsed]);

  // 서버가 만든 HTML 과 맞추기 위해 첫 그리기는 비워 둬요
  const clock = ms === null ? "--:--:--" : formatClock(ms);
  return (
    <p data-testid="free-countdown" className="mt-1 text-right text-[11px] leading-tight text-slate-500">
      ⏳ 무료 뽑기 충전까지 <b className="font-extrabold tabular-nums text-brand-600" aria-label={ms === null ? undefined : `${clock.slice(0, 2)}시간 ${clock.slice(3, 5)}분 ${clock.slice(6)}초`}>{clock}</b>
    </p>
  );
}
