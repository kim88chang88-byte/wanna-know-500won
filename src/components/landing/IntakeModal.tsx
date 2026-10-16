"use client";

import { useEffect, useRef, useState } from "react";
import {
  EMPTY_FORM,
  MAX_YEAR,
  MIN_YEAR,
  STEPS,
  buildBirthInput,
  validateStep,
  type IntakeForm,
  type StepId,
} from "@/lib/intake";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import type { Pillar, SajuChart } from "@/lib/saju/types";
import { CloseButton, ModalShell } from "./Modals";

export interface IntakeTarget {
  /** 어떤 뽑기에서 열었는지 (예: "연애운") */
  fortune: string;
  price: string;
}

interface Props {
  target: IntakeTarget;
  onClose: () => void;
  /** 명식을 성공적으로 받아왔을 때 한 번 호출돼요. (뽑기 횟수 기록용) */
  onComplete: () => void;
}

const BUBBLE: Record<StepId, string> = {
  date: "먼저, 언제 태어났어? 🌸",
  time: "태어난 시간도 알면 더 또렷하게 볼 수 있어. 몰라도 괜찮아!",
  gender: "거의 다 왔어! 성별도 알려줄래?",
  consent: "캡슐 만들기 전에, 정보 처리만 확인할게.",
};

const INPUT =
  "w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-300";
const CHOICE_ON = "bg-brand-600 text-white border-brand-600";
const CHOICE_OFF = "bg-white text-gray-700 border-brand-200 hover:bg-brand-50";

function ChoiceButton({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`py-2.5 px-3 rounded-xl border text-sm font-bold transition-colors ${selected ? CHOICE_ON : CHOICE_OFF} ${className}`}
    >
      {children}
    </button>
  );
}

function PillarCell({ pillar }: { pillar: Pillar | null }) {
  if (!pillar) {
    return (
      <td className="p-2 border border-brand-100 text-gray-300 text-2xl">
        <div>?</div>
        <div>?</div>
      </td>
    );
  }
  const stem = STEMS.find((s) => s.hanja === pillar.stem);
  const branch = BRANCHES.find((b) => b.hanja === pillar.branch);
  return (
    <td className="p-2 border border-brand-100">
      <div className="text-2xl font-serifKr text-gray-900 leading-tight">
        {pillar.stem}
        <small className="block text-[11px] text-gray-500 font-sans">{stem?.hangul}</small>
      </div>
      <div className="text-2xl font-serifKr text-gray-900 leading-tight mt-1">
        {pillar.branch}
        <small className="block text-[11px] text-gray-500 font-sans">{branch?.hangul}</small>
      </div>
    </td>
  );
}

export default function IntakeModal({ target, onClose, onComplete }: Props) {
  const [form, setForm] = useState<IntakeForm>(EMPTY_FORM);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "loading" | "result">("form");
  const [chart, setChart] = useState<SajuChart | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 창이 닫히면 진행 중인 요청도 멈춰요.
  useEffect(() => () => abortRef.current?.abort(), []);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  function update(patch: Partial<IntakeForm>) {
    setForm((f) => ({ ...f, ...patch }));
    setError(null);
  }

  async function submit() {
    const input = buildBirthInput(form);
    if (!input) return;
    setPhase("loading");
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: ctrl.signal,
      });
      const data = (await res.json().catch(() => null)) as { chart?: SajuChart; error?: string } | null;
      if (!res.ok || !data?.chart) throw new Error(data?.error ?? "캡슐을 만들지 못했어요. 잠시 뒤에 다시 해볼래요?");
      setChart(data.chart);
      setPhase("result");
      onComplete();
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 생겼어요.");
      setStepIndex(0); // 날짜가 잘못됐을 가능성이 가장 커서 처음 질문으로 돌아가요.
      setPhase("form");
    }
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateStep(step, form);
    if (problem) {
      setError(problem);
      return;
    }
    if (isLast) void submit();
    else setStepIndex((i) => i + 1);
  }

  function back() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  const header = (
    <div className="text-center mb-4">
      <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
        {target.fortune} 캡슐 · {target.price}
      </span>
    </div>
  );

  return (
    <ModalShell
      labelId="intake-title"
      panelClass="max-w-md p-5 sm:p-6 border-2 border-brand-300 max-h-[90vh] overflow-y-auto"
      onClose={onClose}
      closeOnOverlay={false}
    >
      <CloseButton onClose={onClose} />
      <h3 id="intake-title" className="sr-only">
        생년월일시 입력
      </h3>
      {header}

      {phase === "loading" && (
        <div role="status" className="py-10 text-center">
          <div className="text-4xl floating-anim" aria-hidden="true">
            🌸
          </div>
          <p className="mt-3 font-serifKr font-bold text-gray-900">캡슐이 만들어지고 있어요</p>
          <div className="mt-4 h-1.5 rounded-full bg-brand-100 overflow-hidden" aria-hidden="true">
            <div className="h-full w-1/2 rounded-full bg-brand-500 animate-pulse" />
          </div>
        </div>
      )}

      {phase === "result" && chart && (
        <div data-testid="intake-result">
          <p className="font-serifKr font-black text-lg text-gray-900 text-center">네 사주의 네 기둥을 뽑았어요!</p>
          <p className="text-xs text-gray-500 text-center mt-1">
            양력 {chart.solarDate.year}.{chart.solarDate.month}.{chart.solarDate.day}
          </p>

          <table className="w-full mt-4 text-center border-collapse">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="pb-1.5 font-semibold">시</th>
                <th className="pb-1.5 font-semibold">일</th>
                <th className="pb-1.5 font-semibold">월</th>
                <th className="pb-1.5 font-semibold">연</th>
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

          {chart.uncertainPillars.length > 0 && (
            <p className="mt-3 text-[11px] text-amber-700">
              이 날은 절기가 바뀌는 날이라, 태어난 시간을 알아야 연·월 기둥이 정확해져요.
            </p>
          )}
          {chart.warnings.map((w) => (
            <p key={w} className="mt-2 text-[11px] text-amber-700">
              {w}
            </p>
          ))}

          <div className="mt-4 p-4 rounded-2xl bg-brand-50/60 border border-brand-100 text-left">
            <div className="text-[11px] font-bold text-brand-700 mb-1">🌸 꽃거지의 한마디</div>
            <p className="font-serifKr text-xs text-gray-700 leading-relaxed">
              아직 준비 중이에요. 곧 이 자리에 네 캡슐 속 한마디가 담길 거예요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full py-2.5 rounded-full bg-brand-600 text-white font-serifKr font-bold text-sm shadow-md hover:bg-brand-700 transition-colors"
          >
            확인했어요 ✧
          </button>
        </div>
      )}

      {phase === "form" && (
        <form onSubmit={next} noValidate>
          <div
            role="progressbar"
            aria-label="입력 진행"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={stepIndex + 1}
            className="h-1.5 rounded-full bg-brand-100 overflow-hidden mb-1"
          >
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-400 text-right mb-3" data-testid="intake-step">
            {stepIndex + 1} / {STEPS.length}
          </div>

          <div className="flex items-start gap-2.5 mb-4">
            <span className="text-2xl" aria-hidden="true">
              🌸
            </span>
            <p className="flex-1 rounded-2xl rounded-tl-sm bg-brand-50 border border-brand-100 px-3.5 py-2.5 font-serifKr text-sm text-gray-800">
              {BUBBLE[step]}
            </p>
          </div>

          {step === "date" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="양력 또는 음력">
                <ChoiceButton selected={form.calendar === "solar"} onClick={() => update({ calendar: "solar" })}>
                  양력
                </ChoiceButton>
                <ChoiceButton selected={form.calendar === "lunar"} onClick={() => update({ calendar: "lunar" })}>
                  음력
                </ChoiceButton>
              </div>

              {form.calendar === "solar" ? (
                <label className="block text-xs font-semibold text-gray-600">
                  생년월일
                  <input
                    type="date"
                    name="date"
                    value={form.solarDate}
                    min={`${MIN_YEAR}-01-01`}
                    max={`${MAX_YEAR}-12-31`}
                    onChange={(e) => update({ solarDate: e.target.value })}
                    className={`${INPUT} mt-1`}
                  />
                </label>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block text-xs font-semibold text-gray-600">
                      음력 연
                      <input
                        inputMode="numeric"
                        name="ly"
                        placeholder="1990"
                        value={form.lunarYear}
                        onChange={(e) => update({ lunarYear: e.target.value })}
                        className={`${INPUT} mt-1`}
                      />
                    </label>
                    <label className="block text-xs font-semibold text-gray-600">
                      월
                      <input
                        inputMode="numeric"
                        name="lm"
                        placeholder="4"
                        value={form.lunarMonth}
                        onChange={(e) => update({ lunarMonth: e.target.value })}
                        className={`${INPUT} mt-1`}
                      />
                    </label>
                    <label className="block text-xs font-semibold text-gray-600">
                      일
                      <input
                        inputMode="numeric"
                        name="ld"
                        placeholder="23"
                        value={form.lunarDay}
                        onChange={(e) => update({ lunarDay: e.target.value })}
                        className={`${INPUT} mt-1`}
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.isLeapMonth}
                      onChange={(e) => update({ isLeapMonth: e.target.checked })}
                    />
                    윤달이에요
                  </label>
                </>
              )}
            </div>
          )}

          {step === "time" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-600">
                태어난 시간
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  disabled={!form.timeKnown}
                  onChange={(e) => update({ time: e.target.value })}
                  className={`${INPUT} mt-1 disabled:opacity-40`}
                />
              </label>
              <ChoiceButton
                selected={!form.timeKnown}
                onClick={() => update({ timeKnown: !form.timeKnown })}
                className="w-full"
              >
                태어난 시간은 모르겠어요
              </ChoiceButton>
            </div>
          )}

          {step === "gender" && (
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="성별">
              <ChoiceButton selected={form.gender === "female"} onClick={() => update({ gender: "female" })}>
                여성
              </ChoiceButton>
              <ChoiceButton selected={form.gender === "male"} onClick={() => update({ gender: "male" })}>
                남성
              </ChoiceButton>
            </div>
          )}

          {step === "consent" && (
            <div className="space-y-3">
              <label className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                <input
                  type="checkbox"
                  name="consent"
                  className="mt-0.5"
                  checked={form.consent}
                  onChange={(e) => update({ consent: e.target.checked })}
                />
                <span>
                  (필수) 사주 계산을 위해 생년월일·성별(선택: 태어난 시간)을 처리하는 것에 동의해요.{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    개인정보처리방침 보기
                  </a>
                </span>
              </label>
              <p className="text-[11px] text-gray-400">입력한 정보는 서버에 저장하지 않아요.</p>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 text-xs font-bold text-red-600">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={back}
                className="px-4 py-2.5 rounded-full border border-brand-200 text-sm font-bold text-gray-600 hover:bg-brand-50"
              >
                이전
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-full bg-brand-600 text-white font-serifKr font-bold text-sm shadow-md hover:bg-brand-700 transition-colors"
            >
              {isLast ? "캡슐 만들기 ✧" : "다음"}
            </button>
          </div>
          <p className="mt-3 text-center text-[10px] text-gray-400">* 베타 기간이라 결제는 발생하지 않아요.</p>
        </form>
      )}
    </ModalShell>
  );
}
