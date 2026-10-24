"use client";

import { useEffect, useRef, useState } from "react";
import {
  COMPAT_STEPS,
  EMPTY_BIRTH,
  EMPTY_FORM,
  MAX_YEAR,
  MIN_YEAR,
  STEPS,
  buildBirthFields,
  buildBirthInput,
  buildConcern,
  validatePartnerStep,
  validateStep,
  type AnyStepId,
  type BirthFields,
  type IntakeForm,
  type PartnerStepId,
  type StepId,
} from "@/lib/intake";
import { isCompatFortune } from "@/lib/premium/compat";
import type { PublicReading } from "@/lib/ai/reading";
import { dayKey, getBrowserStorage } from "@/lib/drawCounter";
import { rememberConcern } from "@/lib/followup";
import { AskChips } from "./AskChips";
import { CompareCard } from "./CompareCard";
import { HoursCard } from "./HoursCard";
import { MbtiCard } from "./MbtiCard";
import { UpsellTeaser } from "./UpsellTeaser";
import { chipsForFortune, MAX_CONCERN_TAGS, MAX_CONCERN_TEXT, type Concern, type ConcernId } from "@/lib/concerns";
import { MACHINES } from "./data";
import { IMAGES } from "./images";
import LoadingBar from "./LoadingBar";
import { ReadingCard } from "./ReadingCard";
import StoryReport from "./StoryReport";
import { birthSummary, isStoryReport } from "@/lib/storyHelpers";
import { VaultSaveBar } from "./VaultSaveBar";
import { BIRTH_PLACES } from "@/lib/saju/birthPlace";
import { profileSummary, profileToForm, sameBirth, type SavedProfile } from "@/lib/profile";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import type { Pillar, SajuChart } from "@/lib/saju/types";
import { CloseButton, ModalShell } from "./Modals";
import PhotoCard, { ResultHero } from "./PhotoCard";
import ReviewBox from "./ReviewBox";
import ScrollHint from "./ScrollHint";
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
  /** 풀이를 성공적으로 받았을 때 한 번 호출돼요. 로그인 회원이면 서버가 센 횟수를 함께 줘요. (뽑기 횟수 기록용) */
  onComplete: (serverCounts?: { today: number; month: number } | null) => void;
  /** 로그인한 회원이면 true. 아니면 "로그인하면 생년월일시를 기억해요" 안내를 보여줘요. */
  loggedIn?: boolean;
  /** 로그인 닉네임. 결과 화면 제목("○○님의 사주 해설")에 써요. */
  nickname?: string | null;
  /** 로그인한 회원이 전에 저장해 둔 생년월일시. 있으면 질문지를 미리 채우고 고민 단계부터 시작해요. */
  savedProfile?: SavedProfile | null;
  /** 안내 문구의 "로그인하기" 버튼 */
  onRequestLogin?: () => void;
  /** 서버가 생년월일시를 저장했을 때 */
  onProfileSaved?: (p: SavedProfile) => void;
}

/** 로그인 안내 문구 (질문지 첫 화면·결과 화면에서 써요) */
export const LOGIN_NUDGE = "로그인하시면 도리가 생년월일시를 기억해서 또 다시 입력할 필요가 없어요!";

const BUBBLE: Record<AnyStepId, string> = {
  date: "먼저, 언제 태어났어? 🫧",
  time: "태어난 시간도 알면 더 또렷하게 볼 수 있어. 몰라도 괜찮아!",
  gender: "성별도 알려줄래?",
  concern: "요즘 마음에 걸리는 게 있어? 골라주면 그 얘기를 더 살려서 풀어줄게 🫧",
  consent: "풀이를 만들기 전에, 정보 처리만 확인할게.",
  pdate: "이번엔 궁합을 볼 상대방이야! 상대방은 언제 태어났어? 💞",
  ptime: "상대방이 태어난 시간도 알면 더 또렷해. 몰라도 괜찮아!",
  pgender: "상대방의 성별도 알려줄래?",
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
async function fetchPremiumReport(input: BirthInput, level: "basic" | "full", topic: string, concern: Concern | null, partner: BirthInput | null, signal: AbortSignal): Promise<{ report: PremiumReportView | null; error: string | null }> {
  try {
    const res = await fetch("/api/premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, level, topic, concern, ...(partner ? { partner } : {}) }),
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
      <div className="text-2xl font-cute text-gray-900 leading-tight">
        {pillar.stem}
        <small className="block text-[11px] text-gray-500 font-sans">{stem?.hangul}</small>
      </div>
      <div className="text-2xl font-cute text-gray-900 leading-tight mt-1">
        {pillar.branch}
        <small className="block text-[11px] text-gray-500 font-sans">{branch?.hangul}</small>
      </div>
    </td>
  );
}

/** 날짜·시간·성별 질문 화면. 내 것과 상대방 것이 같은 화면을 써요. */
function BirthStepFields({ kind, f, patch, withPlace = false }: { kind: "date" | "time" | "gender"; f: BirthFields; patch: (p: Partial<BirthFields>) => void; withPlace?: boolean }) {
  return (
    <>
    {kind === "date" && (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="양력 또는 음력">
          <ChoiceButton selected={f.calendar === "solar"} onClick={() => patch({ calendar: "solar" })}>
            양력
          </ChoiceButton>
          <ChoiceButton selected={f.calendar === "lunar"} onClick={() => patch({ calendar: "lunar" })}>
            음력
          </ChoiceButton>
        </div>

        {f.calendar === "solar" ? (
          <label className="block text-xs font-semibold text-gray-600">
            생년월일
            <input
              type="date"
              name="date"
              value={f.solarDate}
              min={`${MIN_YEAR}-01-01`}
              max={`${MAX_YEAR}-12-31`}
              onChange={(e) => patch({ solarDate: e.target.value })}
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
                  value={f.lunarYear}
                  onChange={(e) => patch({ lunarYear: e.target.value })}
                  className={`${INPUT} mt-1`}
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                월
                <input
                  inputMode="numeric"
                  name="lm"
                  placeholder="4"
                  value={f.lunarMonth}
                  onChange={(e) => patch({ lunarMonth: e.target.value })}
                  className={`${INPUT} mt-1`}
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                일
                <input
                  inputMode="numeric"
                  name="ld"
                  placeholder="23"
                  value={f.lunarDay}
                  onChange={(e) => patch({ lunarDay: e.target.value })}
                  className={`${INPUT} mt-1`}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={f.isLeapMonth}
                onChange={(e) => patch({ isLeapMonth: e.target.checked })}
              />
              윤달이에요
            </label>
          </>
        )}
      </div>
    )}

    {kind === "time" && (
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-gray-600">
          태어난 시간
          <input
            type="time"
            name="time"
            value={f.time}
            disabled={!f.timeKnown}
            onChange={(e) => patch({ time: e.target.value })}
            className={`${INPUT} mt-1 disabled:opacity-40`}
          />
        </label>
        <ChoiceButton
          selected={!f.timeKnown}
          onClick={() => patch({ timeKnown: !f.timeKnown })}
          className="w-full"
        >
          태어난 시간은 모르겠어요
        </ChoiceButton>
        {withPlace && f.timeKnown && (f.time.startsWith("23:") || (f.birthPlace !== "" && f.time.startsWith("00:"))) && (
          <div className="space-y-1" role="group" aria-label="23시대 출생 날짜 기준">
            <p className="text-xs font-semibold text-gray-600">밤 11시대는 두 가지 보는 법이 있어요</p>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton selected={f.lateZi !== "nextDay"} onClick={() => patch({ lateZi: "sameDay" })}>
                그날로 봐요 (야자시)
              </ChoiceButton>
              <ChoiceButton selected={f.lateZi === "nextDay"} onClick={() => patch({ lateZi: "nextDay" })}>
                다음 날로 봐요 (조자시)
              </ChoiceButton>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">모르겠으면 그대로 두세요. 날짜 기둥(일주)이 달라질 수 있어요.</p>
          </div>
        )}
        {withPlace && f.timeKnown && (
          <label className="block text-xs font-semibold text-gray-600">
            태어난 곳 (선택)
            <select
              name="birthPlace"
              value={f.birthPlace}
              onChange={(e) => patch({ birthPlace: e.target.value })}
              className={`${INPUT} mt-1`}
            >
              <option value="">고르지 않아요 (시계 시각 그대로)</option>
              {BIRTH_PLACES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="block mt-1 font-normal text-gray-500 leading-relaxed">
              우리나라 표준시는 동경 135도 기준이라, 태어난 곳에 따라 실제 해 시각이 달라요. 고르면 그만큼 시간을 보정해서 보고, 이 정보는 저장하지 않아요.
            </span>
          </label>
        )}
      </div>
    )}

    {kind === "gender" && (
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="성별">
        <ChoiceButton selected={f.gender === "female"} onClick={() => patch({ gender: "female" })}>
          여성
        </ChoiceButton>
        <ChoiceButton selected={f.gender === "male"} onClick={() => patch({ gender: "male" })}>
          남성
        </ChoiceButton>
      </div>
    )}
    </>
  );
}

export default function IntakeModal({ target, onClose, onComplete, loggedIn = false, nickname = null, savedProfile = null, onRequestLogin, onProfileSaved }: Props) {
  // 저장된 생년월일시가 있으면 미리 채우고, 이미 입력한 질문(생년월일·시간·성별)은 건너뛰어 고민 단계에서 시작해요.
  const [form, setForm] = useState<IntakeForm>(() => (savedProfile ? { ...EMPTY_FORM, ...profileToForm(savedProfile) } : EMPTY_FORM));
  // 궁합 리포트면 상대방의 생년월일시·성별을 더 받아요. (상대방 정보는 계산에만 쓰고 저장하지 않아요)
  const compat = target.premium === true && isCompatFortune(target.fortune);
  const steps: readonly AnyStepId[] = compat ? COMPAT_STEPS : STEPS;
  const firstAfterMe = steps.indexOf(compat ? "pdate" : "concern");
  const [partner, setPartner] = useState<BirthFields>(EMPTY_BIRTH);
  const [stepIndex, setStepIndex] = useState(() => (savedProfile ? firstAfterMe : 0));
  // 선택 동의: 둘 다 기본은 꺼짐. (이미 저장해 둔 회원이 정보를 고치는 경우만, 전에 동의한 "기억하기"를 켜 둬요)
  const [saveProfile, setSaveProfile] = useState(savedProfile !== null);
  const [shareConcern, setShareConcern] = useState(false);
  // 보던 풀이를 내 보관함에 저장 (로그인한 회원이 선택. 기본은 켜 두고, 끌 수 있어요)
  const [saveVault, setSaveVault] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "loading" | "result">("form");
  const [chart, setChart] = useState<SajuChart | null>(null);
  const [reading, setReading] = useState<PublicReading | null>(null);
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>("ok");
  const [premiumReport, setPremiumReport] = useState<PremiumReportView | null>(null);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const loadingAnimal = IMAGES[MACHINES.find((m) => m.fortune === target.fortune)?.image ?? ""] ?? "/images/animal-otter.webp";
  const [loadDone, setLoadDone] = useState(false);
  const [birthNote, setBirthNote] = useState<string | null>(null);
  const [askInput, setAskInput] = useState<BirthInput | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 창이 닫히면 진행 중인 요청도 멈춰요.
  useEffect(() => () => abortRef.current?.abort(), []);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function update(patch: Partial<IntakeForm>) {
    setForm((f) => ({ ...f, ...patch }));
    setError(null);
  }

  function updatePartner(patch: Partial<BirthFields>) {
    setPartner((p) => ({ ...p, ...patch }));
    setError(null);
  }

  async function submit() {
    const input = buildBirthInput(form);
    if (!input) return;
    const partnerInput = compat ? buildBirthFields(partner) : null;
    if (compat && !partnerInput) return;
    setLoadDone(false);
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
      const premiumPromise = fetchPremiumReport(input, target.premium ? "full" : "basic", target.fortune, concern, partnerInput, ctrl.signal);
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
        birthAdjustNote?: string | null;
        boundaryNote?: string | null;
        error?: string;
      } | null;
      if (!res.ok || !data?.chart) throw new Error(data?.error ?? "풀이를 만들지 못했어요. 잠시 뒤에 다시 해볼래요?");
      const status: ReadingStatus = data.readingStatus ?? "failed";
      const p = await premiumPromise;
      if (ctrl.signal.aborted) return;
      setPremiumReport(p.report);
      setPremiumError(p.error);
      setChart(data.chart);
      setAskInput(input);
      setBirthNote([data.birthAdjustNote, data.boundaryNote].filter(Boolean).join("\n") || null);
      setReading(data.reading ?? null);
      setReadingStatus(status);
      if (data.profileSaved) onProfileSaved?.(input);
      // 막대를 끝까지 채우는 모습을 잠깐 보여주고 결과로 넘어가요.
      setLoadDone(true);
      await new Promise((r) => setTimeout(r, 650));
      if (ctrl.signal.aborted) return;
      setPhase("result");
      // 지난 고민을 도리가 다시 물어볼 수 있게, 고른 항목 이름만 이 기기에 기억해요. (직접 쓴 글은 저장하지 않아요)
      if (concern) rememberConcern(getBrowserStorage(), concern.tags, dayKey(new Date()));
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
    const problem = step === "pdate" || step === "ptime" || step === "pgender" ? validatePartnerStep(step as PartnerStepId, partner) : validateStep(step as StepId, form);
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

  // 프리미엄 결과 화면만 미드나잇+골드 톤으로 보여줘요. (입력·로딩 화면은 기존 그대로)
  const luxe = target.premium === true && phase === "result";
  const storyMode = !luxe && premiumReport ? isStoryReport(premiumReport) : false;
  const resultTitle = phase === "result" && chart && premiumReport && (
    <div
      data-testid="result-title"
      className={`mb-4 rounded-2xl px-4 py-4 text-center ${luxe ? "border border-[#e6c887]/50 bg-gradient-to-b from-[#e6c887]/15 to-transparent" : "border-2 border-brand-300 bg-gradient-to-br from-brand-50 via-white to-amber-50 shadow-[0_6px_20px_rgba(128,87,224,0.12)]"}`}
    >
      <h3 id="intake-title" className={`font-cute text-[25px] sm:text-[28px] font-normal leading-tight break-keep ${luxe ? "text-[#fbf3de]" : "text-brand-700"}`}>
        {nickname?.trim() ? `${nickname.trim()}님의 사주 해설` : "나의 사주 해설"}
      </h3>
      {askInput && (
        <p
          data-testid="result-title-birth"
          className={`mx-auto mt-2.5 inline-block rounded-full px-3.5 py-1 text-[14px] font-bold tracking-tight ${luxe ? "border border-[#e6c887]/50 text-[#f6dfa8]" : "bg-white text-brand-700 ring-1 ring-brand-200"}`}
        >
          {birthSummary(askInput)}
        </p>
      )}
    </div>
  );
  const header = (
    <div className="text-center mb-4">
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${luxe ? "border border-[#e6c887]/50 text-[#e6c887]" : "bg-brand-100 text-brand-700"}`}>
        {target.fortune} · {target.price}
      </span>
    </div>
  );

  return (
    <ModalShell
      labelId="intake-title"
      panelClass={`max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto ${luxe ? "border border-[#e6c887]/40" : "border-2 border-brand-300"}`}
      onClose={onClose}
      closeOnOverlay={false}
      luxe={luxe}
    >
      <CloseButton onClose={onClose} luxe={luxe} />
      {resultTitle || (
        <h3 id="intake-title" className="sr-only">
          생년월일시 입력
        </h3>
      )}
      {header}

      {phase === "loading" && (
        <div role="status" className="py-10 text-center">
          <LoadingBar done={loadDone} animal={loadingAnimal} />
        </div>
      )}

      {phase === "result" && chart && (
        <div data-testid="intake-result">
          {premiumReport ? (
            <>
              {/* 1) 한 줄 결론(카드 틀 없이 글자로) */}
              {!storyMode && <ResultHero report={premiumReport} aiQuote={reading?.kkotgeoji ?? null} luxe={luxe} />}

              {loggedIn && (
                <VaultSaveBar
                  luxe={luxe}
                  autoSave={saveVault}
                  snapshot={{ topic: target.fortune, premium: target.premium === true, report: premiumReport, reading, kkotgeoji: reading?.kkotgeoji ?? null, reason: reading?.reason ?? null, story: reading?.story ?? null, folds: reading?.folds ?? null, heads: reading?.heads ?? null, note: birthNote }}
                />
              )}

              {birthNote && (
                <p data-testid="birth-adjust-note" className={`mt-4 p-3 rounded-2xl border text-xs leading-relaxed ${luxe ? "bg-white/[0.04] border-[#e6c887]/25 text-[#e8dfca]/80" : "bg-brand-50 border-brand-100 text-gray-700"}`}>
                  {birthNote.split("\n").map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </p>
              )}

              {storyMode ? (
                <>
                  {/* 2) 이야기 순서: 내 정보·고민 → 네 기둥 → 한마디로 → 접어 둔 풀이 → 도리의 쪽지 */}
                  <div data-testid="premium-result">
                    <StoryReport
                      report={premiumReport}
                      reading={reading}
                      intro={null}
                      lastWord={<ResultHero report={premiumReport} aiQuote={reading?.kkotgeoji ?? null} luxe={false} hideLucky />}
                      closing={askInput ? <AskChips input={askInput} luxe={false} /> : undefined}
                    />
                  </div>
                  {/* 3) 간직하고 나누기 */}
                  <PhotoCard report={premiumReport} aiQuote={reading?.kkotgeoji ?? null} luxe={false} />
                </>
              ) : (
                <>
                  {/* 2) 오늘 도리의 풀이 → 주제별 맞춤 분석 + 사주 리포트 */}
                  {reading && <ReadingCard reading={reading} luxe={luxe} />}

                  <div data-testid="premium-result" className="mt-6">
                    <ManseReport report={premiumReport} hideHeadline flush={luxe} />
                  </div>

                  {/* 3) 간직하고 나누기 → 더 물어보기 */}
                  <PhotoCard report={premiumReport} aiQuote={reading?.kkotgeoji ?? null} luxe={luxe} />

                  {askInput && <AskChips input={askInput} luxe={luxe} />}
                </>
              )}

              {askInput && (
                <details data-testid="more-tools" className={`mt-6 rounded-2xl border group ${luxe ? "border-[#e6c887]/30 bg-[#fbf6ea]" : "border-brand-100 bg-brand-50/40"}`}>
                  <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-sm font-bold text-gray-900">
                    <span>✨ 더 해보기 <span className="font-normal text-xs text-gray-500">고민 비교 · MBTI · 시간 후보</span></span>
                    <span aria-hidden="true" className="text-gray-400 transition-transform group-open:rotate-180">⌄</span>
                  </summary>
                  <div className="px-3 pb-3">
                    <CompareCard input={askInput} />
                    <MbtiCard input={askInput} />
                    <HoursCard input={askInput} />
                  </div>
                </details>
              )}
              {!target.premium && (
                <UpsellTeaser
                  fortune={target.fortune}
                  onGo={() => {
                    onClose();
                    window.setTimeout(() => document.getElementById("premium")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
                  }}
                />
              )}
            </>
          ) : (
            <>
              <p role="status" data-testid="premium-error" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center text-sm text-amber-800">
                {premiumError ?? "사주 리포트를 불러오지 못했어요."}
              </p>
              {reading?.kkotgeoji && (
                <p data-testid="reading-quote" className="mt-3 p-4 rounded-2xl bg-brand-50/60 border border-brand-100 text-center text-sm text-gray-800 leading-relaxed">
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

          {luxe ? (
            <div className="mt-6 rounded-2xl border border-[#e6c887]/30 bg-[#fbf6ea] p-1">
              <ReviewBox topic={target.fortune} premium={target.premium === true} />
            </div>
          ) : (
            <ReviewBox topic={target.fortune} premium={target.premium === true} />
          )}

          {!loggedIn && (
            <div data-testid="login-nudge-result" className={`mt-4 rounded-2xl border px-4 py-3 text-center ${luxe ? "bg-white/[0.04] border-[#e6c887]/30" : "bg-amber-50 border-amber-200"}`}>
              <p className={`text-xs font-bold ${luxe ? "text-[#f3e7c9]" : "text-amber-900"}`}>🫧 {LOGIN_NUDGE}</p>
              {onRequestLogin && (
                <button type="button" onClick={onRequestLogin} className={`mt-1.5 text-[11px] font-bold underline underline-offset-2 ${luxe ? "text-[#e6c887]" : "text-brand-600"}`}>
                  로그인하러 가기
                </button>
              )}
            </div>
          )}

          <p className={`mt-3 text-center text-[10px] ${luxe ? "text-[#e8dfca]/50" : "text-gray-400"}`}>
            * 재미와 위로를 위한 풀이예요. 실제 일을 보장하지 않아요.
          </p>

          <button
            type="button"
            onClick={onClose}
            data-testid="close-result"
            className={`mt-3 w-full py-2 text-xs font-bold transition-colors ${luxe ? "text-[#e6c887]/70 hover:text-[#e6c887]" : "text-gray-400 hover:text-gray-600"}`}
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
            aria-valuemax={steps.length}
            aria-valuenow={stepIndex + 1}
            className="h-1.5 rounded-full bg-brand-100 overflow-hidden mb-1"
          >
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-400 text-right mb-3" data-testid="intake-step">
            {stepIndex + 1} / {steps.length}
          </div>

          <div className="flex items-start gap-2.5 mb-4">
            <span className="text-2xl" aria-hidden="true">
              🫧
            </span>
            <p className="flex-1 rounded-2xl rounded-tl-sm bg-brand-50 border border-brand-100 px-3.5 py-2.5 text-sm text-gray-800">
              {BUBBLE[step]}
            </p>
          </div>

          {savedProfile && stepIndex >= firstAfterMe && (
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

          {(step === "date" || step === "time" || step === "gender") && <BirthStepFields kind={step} f={form} patch={update} withPlace />}
          {(step === "pdate" || step === "ptime" || step === "pgender") && (
            <BirthStepFields kind={step === "pdate" ? "date" : step === "ptime" ? "time" : "gender"} f={partner} patch={updatePartner} />
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
                {chipsForFortune(target.fortune).map((c) => {
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
                  (필수) 사주 계산을 위해 생년월일·성별(선택: 태어난 시간·고민 내용){compat ? "과 상대방의 생년월일·성별(선택: 태어난 시간)" : ""}을 처리하는 것에 동의해요.{compat ? " 상대방 정보는 궁합 계산에만 쓰고 서버에 저장하지 않아요." : ""}{" "}
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

              {loggedIn && (
                <label className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                  <input type="checkbox" name="saveVault" className="mt-0.5" checked={saveVault} onChange={(e) => setSaveVault(e.target.checked)} />
                  <span>(선택) 본 풀이를 내 보관함에 저장해요. 언제든 다시 볼 수 있고, 다시 볼 때는 추가 비용이 없어요. 보관함에서 지울 수 있고 탈퇴하면 함께 삭제돼요.</span>
                </label>
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
              className="flex-1 py-2.5 rounded-full bg-brand-600 text-white font-cute font-normal text-sm shadow-md hover:bg-brand-700 transition-colors"
            >
              {isLast ? "풀이 보기 ✧" : step === "concern" && form.concernTags.length === 0 && !form.concernText.trim() ? "건너뛰기" : "다음"}
            </button>
          </div>
          <p className="mt-3 text-center text-[10px] text-gray-400">* 베타 기간이라 결제는 발생하지 않아요.</p>
        </form>
      )}
      {/* 창이 길어서 아래에 더 볼 내용이 있을 때만 보이는 안내 */}
      {phase !== "loading" && <ScrollHint luxe={luxe} label={phase === "result" ? "아래로 스크롤하면 사주 리포트가 더 있어요" : "아래로 스크롤해 주세요"} />}
    </ModalShell>
  );
}
