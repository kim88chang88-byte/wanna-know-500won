"use client";

import { useEffect, useRef, useState } from "react";
import {
  EMPTY_FORM,
  MAX_YEAR,
  MIN_YEAR,
  STEPS,
  buildBirthInput,
  buildConcern,
  validateStep,
  type IntakeForm,
  type StepId,
} from "@/lib/intake";
import type { PublicReading } from "@/lib/ai/reading";
import { CONCERN_CHIPS, MAX_CONCERN_TAGS, MAX_CONCERN_TEXT, type Concern, type ConcernId } from "@/lib/concerns";
import { profileSummary, profileToForm, sameBirth, type SavedProfile } from "@/lib/profile";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import type { Pillar, SajuChart } from "@/lib/saju/types";
import { CloseButton, ModalShell } from "./Modals";
import PhotoCard from "./PhotoCard";
import ManseReport from "@/components/premium/ManseReport";
import type { PremiumReportView } from "@/lib/premium/types";
import type { BirthInput } from "@/lib/saju/types";

export interface IntakeTarget {
  /** 어떤 뽑기에서 열었는지 (예: "연애운") */
  fortune: string;
  price: string;
  /** 프리미엄 자판기에서 열었으면 true. 사주 리포트(원국·오행·신강신약·대운)를 함께 보여줘요. */
  premium?: boolean;
}

interface Props {
  target: IntakeTarget;
  onClose: () => void;
  /** 풀이(캡슐)를 성공적으로 받았을 때 한 번 호출돼요. 로그인 회원이면 서버가 센 횟수를 함께 줘요. (뽑기 횟수 기록용) */
  onComplete: (serverCounts?: { today: number; month: number } | null) => void;
  /** 로그인한 회원이면 true. 아니면 "로그인하면 생년월일시를 기억해요" 안내를 보여줘요. */
  loggedIn?: boolean;
  /** 로그인한 회원이 전에 저장해 둔 생년월일시. 있으면 질문지를 미리 채우고 고민 단계부터 시작해요. */
  savedProfile?: SavedProfile | null;
  /** 안내 문구의 "로그인하기" 버튼 */
  onRequestLogin?: () => void;
  /** 서버가 생년월일시를 저장했을 때 */
  onProfileSaved?: (p: SavedProfile) => void;
}

/** 로그인 안내 문구 (질문지 첫 화면·결과 화면에서 써요) */
export const LOGIN_NUDGE = "로그인하시면 도리가 생년월일시를 기억해서 또 다시 입력할 필요가 없어요!";

const BUBBLE: Record<StepId, string> = {
  date: "먼저, 언제 태어났어? 🫧",
  time: "태어난 시간도 알면 더 또렷하게 볼 수 있어. 몰라도 괜찮아!",
  gender: "성별도 알려줄래?",
  concern: "요즘 마음에 걸리는 게 있어? 골라주면 그 얘기를 더 살려서 풀어줄게 🫧",
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

/** 프리미엄 리포트를 받아요. 실패해도 예외 대신 사용자에게 보여 줄 문장을 돌려줘요. */
async function fetchPremiumReport(input: BirthInput, level: "basic" | "full", topic: string, concern: Concern | null, signal: AbortSignal): Promise<{ report: PremiumReportView | null; error: string | null }> {
  try {
    const res = await fetch("/api/premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, level, topic, concern }),
      signal,
    });
    const data = (await res.json().catch(() => null)) as { report?: PremiumReportView; error?: string } | null;
    if (res.ok && data?.report) return { report: data.report, error: null };
    return { report: null, error: data?.error ?? "사주 리포트를 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요." };
  } catch {
    if (signal.aborted) return { report: null, error: null };
    return { report: null, error: "사주 리포트를 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요." };
  }
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

export default function IntakeModal({ target, onClose, onComplete, loggedIn = false, savedProfile = null, onRequestLogin, onProfileSaved }: Props) {
  // 저장된 생년월일시가 있으면 미리 채우고, 이미 입력한 질문(생년월일·시간·성별)은 건너뛰어 고민 단계에서 시작해요.
  const [form, setForm] = useState<IntakeForm>(() => (savedProfile ? { ...EMPTY_FORM, ...profileToForm(savedProfile) } : EMPTY_FORM));
  const [stepIndex, setStepIndex] = useState(() => (savedProfile ? STEPS.indexOf("concern") : 0));
  // 선택 동의: 둘 다 기본은 꺼짐. (이미 저장해 둔 회원이 정보를 고치는 경우만, 전에 동의한 "기억하기"를 켜 둬요)
  const [saveProfile, setSaveProfile] = useState(savedProfile !== null);
  const [shareConcern, setShareConcern] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "loading" | "result">("form");
  const [chart, setChart] = useState<SajuChart | null>(null);
  const [reading, setReading] = useState<PublicReading | null>(null);
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>("ok");
  const [premiumReport, setPremiumReport] = useState<PremiumReportView | null>(null);
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
    const concern = buildConcern(form);
    // 저장된 정보를 그대로 쓰는 경우엔 다시 저장하지 않아요.
    const wantSave = loggedIn && saveProfile && !sameBirth(savedProfile, input);
    const wantShare = shareConcern && concern !== null;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      // 사주 리포트도 함께 받아요. 프리미엄은 전체, 일반 자판기는 기본(원국·오행·신강신약). 실패해도 기본 풀이는 그대로 보여줘요.
      const premiumPromise = fetchPremiumReport(input, target.premium ? "full" : "basic", target.fortune, concern, ctrl.signal);
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, topic: target.fortune, concern, saveProfile: wantSave, shareConcern: wantShare }),
        signal: ctrl.signal,
      });
      const data = (await res.json().catch(() => null)) as {
        chart?: SajuChart;
        reading?: PublicReading | null;
        readingStatus?: ReadingStatus;
        counts?: { today: number; month: number } | null;
        profileSaved?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !data?.chart) throw new Error(data?.error ?? "캡슐을 만들지 못했어요. 잠시 뒤에 다시 해볼래요?");
      const status: ReadingStatus = data.readingStatus ?? "failed";
      const p = await premiumPromise;
      if (ctrl.signal.aborted) return;
      setPremiumReport(p.report);
      setPremiumError(p.error);
      setChart(data.chart);
      setReading(data.reading ?? null);
      setReadingStatus(status);
      if (data.profileSaved) onProfileSaved?.(input);
      setPhase("result");
      // 풀이(AI 한마디 또는 사주 리포트)를 실제로 받았을 때만 뽑기 횟수로 세요.
      // AI 키가 없는 상태(unavailable)에서도 사주 리포트가 나갔으면 센 것으로 봐요. (서버도 같은 기준으로 기록해요)
      if ((status === "ok" && data.reading) || status === "unavailable") onComplete(data.counts ?? null);
      else if (p.report) onComplete(null);
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

  function toggleConcern(id: ConcernId) {
    setForm((f) => {
      if (f.concernTags.includes(id)) return { ...f, concernTags: f.concernTags.filter((t) => t !== id) };
      if (f.concernTags.length >= MAX_CONCERN_TAGS) return f;
      return { ...f, concernTags: [...f.concernTags, id] };
    });
    setError(null);
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
          {premiumReport ? (
            <>
              {/* 1) 인스타 감성 포토카드 + 공유 */}
              <PhotoCard report={premiumReport} aiQuote={reading?.kkotgeoji ?? null} />

              {/* 2) 주제별 맞춤 분석 + 사주 리포트 */}
              <div data-testid="premium-result" className="mt-6">
                <ManseReport report={premiumReport} />
              </div>
            </>
          ) : (
            <>
              <p role="status" data-testid="premium-error" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center text-sm text-amber-800">
                {premiumError ?? "사주 리포트를 불러오지 못했어요."}
              </p>
              {reading?.kkotgeoji && (
                <p data-testid="reading-quote" className="mt-3 p-4 rounded-2xl bg-brand-50/60 border border-brand-100 text-center font-serifKr text-sm text-gray-800 leading-relaxed">
                  {reading.kkotgeoji}
                </p>
              )}
              {!reading && readingStatus !== "unavailable" && (
                <p data-testid="reading-missing" className="mt-3 text-center text-xs text-gray-500">
                  도리가 잠깐 물놀이하러 갔어요. 잠시 뒤에 다시 뽑아볼래요?
                </p>
              )}
            </>
          )}

          {!premiumReport && (
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

          {!loggedIn && (
            <div data-testid="login-nudge-result" className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
              <p className="text-xs font-bold text-amber-900">🫧 {LOGIN_NUDGE}</p>
              {onRequestLogin && (
                <button type="button" onClick={onRequestLogin} className="mt-1.5 text-[11px] font-bold text-brand-600 underline underline-offset-2">
                  로그인하러 가기
                </button>
              )}
            </div>
          )}

          <p className="mt-3 text-center text-[10px] text-gray-400">
            * 재미와 위로를 위한 풀이예요. 실제 일을 보장하지 않아요.
          </p>

          <button
            type="button"
            onClick={onClose}
            data-testid="close-result"
            className="mt-3 w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            닫기
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

          {savedProfile && stepIndex >= STEPS.indexOf("concern") && (
            <div data-testid="saved-profile" className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-brand-50 border border-brand-100 px-3 py-2">
              <span className="text-[11px] text-gray-600 leading-snug">
                <b className="text-brand-700">기억해 둔 정보</b>
                <br />
                {profileSummary(savedProfile)}
              </span>
              <button type="button" data-testid="edit-profile" onClick={() => setStepIndex(0)} className="shrink-0 text-[11px] font-bold text-brand-600 underline underline-offset-2">
                수정하기
              </button>
            </div>
          )}

          {step === "date" && !loggedIn && (
            <div data-testid="login-nudge" className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-center">
              <p className="text-[12px] font-bold text-amber-900 leading-snug">🫧 {LOGIN_NUDGE}</p>
              {onRequestLogin && (
                <button type="button" data-testid="nudge-login" onClick={onRequestLogin} className="mt-1.5 text-[11px] font-bold text-brand-600 underline underline-offset-2">
                  로그인하러 가기
                </button>
              )}
            </div>
          )}

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

          {step === "concern" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>최대 {MAX_CONCERN_TAGS}개까지 고를 수 있어요 (건너뛰어도 돼요)</span>
                <span data-testid="concern-count" className="font-bold text-brand-600">
                  {form.concernTags.length}/{MAX_CONCERN_TAGS}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="요즘 고민 추천">
                {CONCERN_CHIPS.map((c) => {
                  const on = form.concernTags.includes(c.id);
                  const full = !on && form.concernTags.length >= MAX_CONCERN_TAGS;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      data-testid={`concern-chip-${c.id}`}
                      aria-pressed={on}
                      aria-disabled={full}
                      onClick={() => toggleConcern(c.id)}
                      className={`px-3 py-2 rounded-full border text-xs font-bold transition-colors ${on ? CHOICE_ON : CHOICE_OFF} ${full ? "opacity-40" : ""}`}
                    >
                      <span aria-hidden="true">{c.emoji}</span> {c.label}
                    </button>
                  );
                })}
              </div>
              <div>
                <label htmlFor="concern-text" className="block text-xs font-bold text-gray-600 mb-1">
                  직접 적고 싶다면 (선택)
                </label>
                <textarea
                  id="concern-text"
                  name="concernText"
                  rows={3}
                  maxLength={MAX_CONCERN_TEXT}
                  value={form.concernText}
                  onChange={(e) => update({ concernText: e.target.value })}
                  placeholder="예) 3년 다닌 회사를 옮길지 고민이에요"
                  className={`${INPUT} resize-none`}
                />
                <div className="mt-1 text-right text-[10px] text-gray-400" data-testid="concern-text-count">
                  {form.concernText.length}/{MAX_CONCERN_TEXT}
                </div>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                병원·약·투자 종목 같은 건 풀이에 쓰지 않아요. 개인정보(이름·연락처 등)는 적지 말아줘요.
              </p>
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
                  (필수) 사주 계산을 위해 생년월일·성별(선택: 태어난 시간·고민 내용)을 처리하는 것에 동의해요.{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    개인정보처리방침 보기
                  </a>
                </span>
              </label>
              <p className="text-[11px] text-gray-400">
                {loggedIn || buildConcern(form) ? "아래 선택 항목에 동의하지 않으면, 입력한 정보는 서버에 저장하지 않아요." : "입력한 정보는 서버에 저장하지 않아요."}
              </p>

              {loggedIn ? (
                savedProfile && sameBirth(savedProfile, buildBirthInput({ ...form, consent: true })) ? (
                  <p data-testid="profile-kept" className="text-[11px] text-gray-500 leading-relaxed">
                    기억해 둔 생년월일시로 풀어요. 지우고 싶으면 로그인 창의 &lsquo;기억한 정보 지우기&rsquo;를 눌러줘요.
                  </p>
                ) : (
                  <label className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                    <input type="checkbox" name="saveProfile" className="mt-0.5" checked={saveProfile} onChange={(e) => setSaveProfile(e.target.checked)} />
                    <span>
                      (선택) 도리가 생년월일시·성별을 기억하게 저장해요. 다음부터 다시 입력하지 않아도 돼요. 로그인 창에서 언제든 지울 수 있고, 탈퇴하면 함께 삭제돼요.
                    </span>
                  </label>
                )
              ) : (
                <p data-testid="login-nudge-consent" className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 leading-relaxed">
                  🫧 {LOGIN_NUDGE}
                </p>
              )}

              {buildConcern(form) && (
                <label className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                  <input type="checkbox" name="shareConcern" className="mt-0.5" checked={shareConcern} onChange={(e) => setShareConcern(e.target.checked)} />
                  <span>
                    (선택) 적어 준 고민을 서비스 개선을 위한 통계에 써도 좋아요. 생년월일은 남기지 않고 나이대·성별만 함께 저장해요.
                    {loggedIn ? " 로그인 상태에서 동의하면 탈퇴할 때 함께 삭제돼요." : " 로그인하지 않으면 누구의 것인지 알 수 없는 형태로 저장돼서 나중에 지우기 어려워요."}
                  </span>
                </label>
              )}
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
              {isLast ? "캡슐 만들기 ✧" : step === "concern" && form.concernTags.length === 0 && !form.concernText.trim() ? "건너뛰기" : "다음"}
            </button>
          </div>
          <p className="mt-3 text-center text-[10px] text-gray-400">* 베타 기간이라 결제는 발생하지 않아요.</p>
        </form>
      )}
    </ModalShell>
  );
}
