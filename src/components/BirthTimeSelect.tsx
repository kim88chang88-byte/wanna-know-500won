"use client";

import { TIME_BLOCKS, blockOfTime } from "@/lib/intake";

/**
 * 태어난 시간을 시진(자시·축시·인시…) 콤보박스로 고르고, 모르면 체크박스로 표시해요.
 * 모든 생년월일시 입력 화면이 이 컴포넌트를 같이 써요.
 * - time: "HH:MM" (시진 대표 시각) 또는 ""
 * - known: false 면 태어난 시간을 모르는 것
 */
export default function BirthTimeSelect({
  time,
  known,
  onChange,
  selectClassName,
  labelClassName = "text-xs font-semibold text-gray-600",
  noteClassName = "text-[11px] text-gray-500",
  checkClassName = "text-xs text-gray-600",
}: {
  time: string;
  known: boolean;
  onChange: (next: { time: string; known: boolean }) => void;
  selectClassName: string;
  labelClassName?: string;
  noteClassName?: string;
  checkClassName?: string;
}) {
  const value = known ? blockOfTime(time) : "";
  return (
    <div className="space-y-2" data-testid="birth-time">
      <label className={`block ${labelClassName}`}>
        태어난 시간
        <select
          name="birthTime"
          data-testid="time-select"
          value={value}
          disabled={!known}
          onChange={(e) => onChange({ time: e.target.value, known: true })}
          className={`${selectClassName} mt-1 disabled:opacity-40`}
        >
          <option value="">시간대를 골라 주세요</option>
          {TIME_BLOCKS.map((b) => (
            <option key={b.time} value={b.time}>
              {b.label} ({b.range})
            </option>
          ))}
        </select>
      </label>
      <label className={`flex items-center gap-2 ${checkClassName}`}>
        <input
          type="checkbox"
          data-testid="time-unknown"
          checked={!known}
          onChange={(e) => onChange({ time: "", known: !e.target.checked })}
        />
        태어난 시간 모름
      </label>
      <p className={noteClassName}>시간을 몰라도 괜찮아요. 시주(시간 기둥)만 빼고 풀이해 드려요.</p>
    </div>
  );
}
