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
import { normalizeTopic, TOPIC_LABEL, type PublicReading } from "@/lib/ai/reading";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import type { Pillar, SajuChart } from "@/lib/saju/types";
import { CloseButton, ModalShell } from "./Modals";
import ResultCard from "./ResultCard";
import ManseReport from "@/components/premium/ManseReport";
import type { ManseReportView, SazuFormInput } from "@/lib/sazu/types";
import type { BirthInput } from "@/lib/saju/types";

export interface IntakeTarget {
  /** 어떤 뽑기에서 열었는지 (예: "연애운") */
  fortune: string;
  price: string;
  /** 프리미엄 자판기에서 열었으면 true. SAZU 만세력 리포트를 함께 보여줘요. */
  premium?: boolean;
}

interface Props {
  target: IntakeTarget;
  onClose: () => void;
  /** 풀이(캡슐)를 성공적으로 받았을 때 한 번 호출돼요. 로그인 회원이면 서버가 센 횟수를 함께 줘요. (뽑기 횟수 기록용) */
  onComplete: (serverCounts?: { today: number; month: number } | null) => void;
}

const BUBBLE: Record<StepId, string> = {
  date: "먼저, 언제 태어났어? 🫧",
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

type ReadingStatus = "ok" | "unavailable" | "failed";

const DEFAULT_BIRTH_CITY = "서울";

/** 입력창에서 받은 값을 SAZU 만세력 API 입력으로 바꿔요. (출생 도시는 묻지 않아 서울로 둬요) */
function toSazuInput(b: BirthInput): SazuFormInput {
  return {
    year: b.year,
    month: b.month,
    day: b.day,
    hour: b.hour ?? null,
    minute: b.hour == null ? null : (b.minute ?? 0),
    isFemale: b.gender === "female",
    isLunar: b.calendar === "lunar",
    city: DEFAULT_BIRTH_CITY,
  };
}

/** 프리미엄 리포트를 받아요. 실패해도 예외 대신 사용자에게 보여 줄 문장을 돌려줘요. */
async function fetchPremiumReport(input: BirthInput, signal: AbortSignal): Promise<{ report: ManseReportView | null; error: string | null }> {
  try {
    const res = await fetch("/api/sazu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSazuInput(input)),
      signal,
    });
    const data = (await res.json().catch(() => null)) as { report?: ManseReportView; error?: string } | null;
    if (res.ok && data?.report) return { report: data.report, error: null };
    return { report: null, error: data?.error ?? "프리미엄 리포트를 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요." };
  } catch {
    if (signal.aborted) return { report: null, error: null };
    return { report: null, error: "프리미엄 리포트를 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요." };
  }
}

/** "연애운 슬롯" 같은 화면 문구를 "연애운" 처럼 카드에 쓸 이름으로 줄여요. 주제를 못 찾으면 "오늘의 운". */
function topicLabel(fortune: string): string {
  return TOPIC_LABEL[normalizeTopic(fortune)];
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
  const [reading, setReading] = useState<PublicReading | null>(null);
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>("ok");
  const [unlockNotice, setUnlockNotice] = useState(false);
  const [premiumReport, setPremiumReport] = useState<ManseReportView | null>(null);
  const [premiumError, setPremiumError] = useState<string | null>(null);
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
      // 프리미엄이면 SAZU 리포트도 함께 받아요. (실패해도 기본 풀이는 그대로 보여줘요)
      const premiumPromise = target.premium ? fetchPremiumReport(input, ctrl.signal) : null;
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, topic: target.fortune }),
        signal: ctrl.signal,
      });
      const data = (await res.json().catch(() => null)) as {
        chart?: SajuChart;
        reading?: PublicReading | null;
        readingStatus?: ReadingStatus;
        counts?: { today: number; month: number } | null;
        error?: string;
      } | null;
      if (!res.ok || !data?.chart) throw new Error(data?.error ?? "캡슐을 만들지 못했어요. 잠시 뒤에 다시 해볼래요?");
      const status: ReadingStatus = data.readingStatus ?? "failed";
      if (premiumPromise) {
        const p = await premiumPromise;
        if (ctrl.signal.aborted) return;
        setPremiumReport(p.report);
        setPremiumError(p.error);
      }
      setChart(data.chart);
      setReading(data.reading ?? null);
      setReadingStatus(status);
      setPhase("result");
      // 풀이를 실제로 받았을 때만 뽑기 횟수로 세요.
      if (status === "ok" && data.reading) onComplete(data.counts ?? null);
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
            🫧
          </div>
          <p className="mt-3 font-serifKr font-bold text-gray-900">캡슐이 만들어지고 있어요</p>
          <div className="mt-4 h-1.5 rounded-full bg-brand-100 overflow-hidden" aria-hidden="true">
            <div className="h-full w-1/2 rounded-full bg-brand-500 animate-pulse" />
          </div>
        </div>
      )}

      {phase === "result" && chart && (
        <div data-testid="intake-result">
          {reading ? (
            <>
              <ResultCard reading={reading} topicLabel={topicLabel(target.fortune)} />

              <p className="mt-3 text-center text-[11px] text-gray-500">도리가 더 할 말이 있대요 👀</p>
              <button
                type="button"
                onClick={() => setUnlockNotice(true)}
                className="mt-1 w-full py-2.5 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-serifKr font-bold text-sm shadow-md"
              >
                500원으로 전부 듣기
              </button>
              {unlockNotice && (
                <p role="status" className="mt-2 text-center text-[11px] font-bold text-brand-600">
                  결제는 아직 준비 중이에요. 곧 열릴 예정이에요 🫧
                </p>
              )}
            </>
          ) : (
            !target.premium && (
            <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 text-center" data-testid="reading-missing">
              <p className="font-serifKr text-sm text-gray-800 leading-relaxed">
                {readingStatus === "unavailable"
                  ? "도리의 한마디는 아직 준비 중이에요."
                  : "도리가 잠깐 물놀이하러 갔어요. 잠시 뒤에 다시 뽑아볼래요?"}
              </p>
            </div>
            )
          )}

          {target.premium && (
            <div data-testid="premium-result" className="mt-4">
              {premiumReport ? (
                <ManseReport report={premiumReport} />
              ) : (
                <p role="status" data-testid="premium-error" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center text-sm text-amber-800">
                  {premiumError ?? "프리미엄 리포트를 불러오지 못했어요."}
                </p>
              )}
            </div>
          )}

          {!(target.premium && premiumReport) && (
          <details className="mt-4 rounded-2xl border border-gray-100 p-3">
            <summary className="cursor-pointer text-xs font-bold text-gray-600">내 사주 네 기둥 보기</summary>
            <p className="text-[11px] text-gray-500 text-center mt-2">
              양력 {chart.solarDate.year}.{chart.solarDate.month}.{chart.solarDate.day}
            </p>
            <table className="w-full mt-2 text-center border-collapse">
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
          </details>
          )}

          <p className="mt-3 text-center text-[10px] text-gray-400">
            * 재미와 위로를 위한 풀이예요. 실제 일을 보장하지 않아요.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full py-2.5 rounded-full border border-brand-200 text-brand-700 font-serifKr font-bold text-sm hover:bg-brand-50 transition-colors"
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
              🫧
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
