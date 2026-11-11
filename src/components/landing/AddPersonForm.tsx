"use client";

import { useState } from "react";
import BirthTimeSelect from "@/components/BirthTimeSelect";
import { buildBirthFields, dateTextToFields, EMPTY_BIRTH, formatDateInput, type BirthFields } from "@/lib/intake";
import { MAX_LABEL, type SavedPerson } from "@/lib/people";

const INPUT = "w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-300";
const ON = "bg-brand-600 text-white border-brand-600";
const OFF = "bg-white text-gray-700 border-brand-200 hover:bg-brand-50";

function Pill({ on, onClick, children, testId }: { on: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button type="button" data-testid={testId} aria-pressed={on} onClick={onClick} className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${on ? ON : OFF}`}>
      {children}
    </button>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 내 정보 창에서 다른 사람(가족·친구·연인)을 직접 추가해 두는 작은 입력 폼이에요. */
export default function AddPersonForm({ onAdded, onCancel }: { onAdded: (p: SavedPerson) => void; onCancel: () => void }) {
  const [f, setF] = useState<BirthFields>(EMPTY_BIRTH);
  const [dateText, setDateText] = useState("");
  const [label, setLabel] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (p: Partial<BirthFields>) => {
    setF((x) => ({ ...x, ...p }));
    setError(null);
  };
  const setDate = (raw: string, calendar: "solar" | "lunar") => {
    const t = formatDateInput(raw);
    setDateText(t);
    patch(dateTextToFields(t, calendar));
  };

  async function save() {
    const birth = buildBirthFields(f);
    if (!birth) {
      setError("생년월일, 성별, 태어난 시간을 다시 확인해 줘.");
      return;
    }
    if (!agree) {
      setError("이름 아래 확인란을 체크해 줘. (이름과 정보를 저장해도 괜찮은 사람)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: label.trim() || `${birth.year}.${pad(birth.month)}.${pad(birth.day)}`, birth }),
      });
      const j = (await res.json().catch(() => null)) as { person?: SavedPerson | null; error?: string } | null;
      if (res.ok && j?.person) {
        onAdded(j.person);
        return;
      }
      setError(j?.error ?? "저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
    } catch {
      setError("저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
    }
    setBusy(false);
  }

  return (
    <div data-testid="add-person-form" className="mt-2 space-y-2.5 rounded-xl border border-brand-200 bg-white p-3 text-left">
      <input
        type="text"
        name="addLabel"
        data-testid="add-person-label"
        value={label}
        maxLength={MAX_LABEL}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="이름 또는 별명 (예: 엄마, 내 짝꿍)"
        className={INPUT}
      />
      <label className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-700">
        <input type="checkbox" name="addAgree" data-testid="add-person-agree" className="mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>실명이나 별명을 적어도 괜찮고, 이 정보를 저장해도 되는 사람이야.</span>
      </label>
      <div className="flex gap-2" role="group" aria-label="양력 또는 음력">
        <Pill on={f.calendar === "solar"} onClick={() => setDate(dateText, "solar")} testId="add-cal-solar">
          양력
        </Pill>
        <Pill on={f.calendar === "lunar"} onClick={() => setDate(dateText, "lunar")} testId="add-cal-lunar">
          음력
        </Pill>
      </div>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        name="addDate"
        data-testid="add-person-date"
        aria-label="생년월일"
        placeholder="생년월일 예: 1990-05-17 (숫자만 적어도 돼)"
        maxLength={10}
        value={dateText}
        onChange={(e) => setDate(e.target.value, f.calendar)}
        className={INPUT}
      />
      {f.calendar === "lunar" && (
        <label className="flex items-center gap-2 text-[11px] text-gray-600">
          <input type="checkbox" checked={f.isLeapMonth} onChange={(e) => patch({ isLeapMonth: e.target.checked })} />
          윤달이야
        </label>
      )}
      <div className="flex gap-2" role="group" aria-label="성별">
        <Pill on={f.gender === "female"} onClick={() => patch({ gender: "female" })} testId="add-gender-female">
          여자
        </Pill>
        <Pill on={f.gender === "male"} onClick={() => patch({ gender: "male" })} testId="add-gender-male">
          남자
        </Pill>
      </div>
      <BirthTimeSelect time={f.time} known={f.timeKnown} onChange={(n) => patch({ time: n.time, timeKnown: n.known })} selectClassName={INPUT} />
      <p className="text-[11px] leading-relaxed text-gray-500">이 목록에서 언제든 지울 수 있고, 탈퇴하면 함께 삭제돼요.</p>
      {error && (
        <p role="alert" className="text-[11px] font-bold text-brand-600">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-1.5 text-[11px] text-gray-500 underline underline-offset-2">
          취소
        </button>
        <button type="button" data-testid="add-person-save" disabled={busy} onClick={save} className="rounded-full bg-brand-600 px-4 py-1.5 text-[11px] font-bold text-white disabled:opacity-50 active:scale-95 transition-transform">
          {busy ? "저장 중…" : "저장하기"}
        </button>
      </div>
    </div>
  );
}
