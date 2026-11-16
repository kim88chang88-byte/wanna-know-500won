"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CombinedBirthFields } from "@/components/landing/IntakeModal";
import { EMPTY_FORM, validateStep, type BirthFields, type IntakeForm } from "@/lib/intake";
import { getBrowserStorage } from "@/lib/drawCounter";
import { INVITE_NAME_MAX, RELATION_LABEL, isInviteRelation } from "@/lib/invite";
import { refFromSearch, saveRef } from "@/lib/referral";
import { SERVICE_NAME } from "@/lib/siteInfo";
import { track } from "@/lib/track";

type View = "loading" | "form" | "sent" | "gone" | "used" | "error";

const BIRTH_KEYS: Array<keyof BirthFields> = ["calendar", "solarDate", "lunarYear", "lunarMonth", "lunarDay", "isLeapMonth", "timeKnown", "time", "gender", "birthPlace", "lateZi"];

/**
 * 궁합 초대 링크를 받은 사람이 보는 화면이에요. 로그인 없이 생년월일·성별(선택: 태어난 시간)만 넣어요.
 * 초대한 사람의 생년월일 같은 정보는 이 화면에 오지 않아요.
 */
export default function InviteFill({ token }: { token: string }) {
  const [view, setView] = useState<View>("loading");
  const [nick, setNick] = useState<string | null>(null);
  const [relation, setRelation] = useState<string | null>(null);
  const [form, setForm] = useState<IntakeForm>(EMPTY_FORM);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [age14, setAge14] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // 친구 초대 코드(?ref=)가 붙어 있으면 기억해 두고 주소창은 정리해요. (나중에 가입하면 두 사람 모두 보상을 받아요)
    const c = refFromSearch(window.location.search);
    if (c) {
      saveRef(getBrowserStorage(), c);
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete("ref");
        window.history.replaceState(null, "", u.toString());
      } catch {
        // 주소 정리는 못 해도 괜찮아요
      }
    }
    track("invite_open");
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(`/api/invite/${token}`, { cache: "no-store" });
        const d = (await res.json().catch(() => null)) as { status?: unknown; nick?: unknown; relation?: unknown } | null;
        if (!alive) return;
        const st = typeof d?.status === "string" ? d.status : "";
        if (typeof d?.nick === "string") setNick(d.nick);
        if (typeof d?.relation === "string") setRelation(d.relation);
        if (st === "pending") setView("form");
        else if (st === "filled" || st === "done") setView("used");
        else if (st === "expired" || st === "not_found") setView("gone");
        else setView("error");
      } catch {
        if (alive) setView("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  function patch(p: Partial<IntakeForm>) {
    setForm((f) => ({ ...f, ...p }));
    setError(null);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const problem = validateStep("birth", form);
    if (problem) return setError(problem);
    if (!age14) return setError("만 14세 이상인지 확인해 줘.");
    if (!consent) return setError("정보 전달에 동의해야 보낼 수 있어.");
    const birth = Object.fromEntries(BIRTH_KEYS.map((k) => [k, form[k]]));
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ birth, name: name.trim(), consent: true }) });
      const d = (await res.json().catch(() => null)) as { result?: unknown } | null;
      const r = typeof d?.result === "string" ? d.result : "failed";
      if (r === "ok") {
        track("invite_fill");
        setView("sent");
      } else if (r === "already") setView("used");
      else if (r === "expired" || r === "not_found") setView("gone");
      else if (r === "bad") setError("입력한 정보를 다시 확인해 줘.");
      else setError("보내지 못했어. 잠시 뒤에 다시 시도해 줘.");
    } catch {
      setError("보내지 못했어. 인터넷 연결을 확인하고 다시 시도해 줘.");
    } finally {
      setBusy(false);
    }
  }

  const who = nick ? `${nick}님` : "친구";
  const rel = relation && isInviteRelation(relation) ? RELATION_LABEL[relation] : null;

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8" data-testid="invite-fill">
      <Link href="/" className="font-black text-lg text-brand-700">
        ❄️ {SERVICE_NAME}
      </Link>

      {view === "loading" && <p className="mt-10 text-center text-sm text-gray-500">불러오는 중…</p>}

      {view === "gone" && (
        <section className="mt-10 rounded-2xl border border-brand-200 bg-white p-5 text-center" data-testid="invite-gone">
          <p className="text-base font-bold text-gray-800">이 링크는 더 쓸 수 없어</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">기간(7일)이 지났거나 없는 링크야. 보낸 사람에게 새 링크를 부탁해 줘.</p>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white">
            내 사주 보러 가기
          </Link>
        </section>
      )}

      {view === "used" && (
        <section className="mt-10 rounded-2xl border border-brand-200 bg-white p-5 text-center" data-testid="invite-used">
          <p className="text-base font-bold text-gray-800">이미 답을 보낸 링크야</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">한 링크로는 한 번만 보낼 수 있어. 다시 보내려면 {who}에게 새 링크를 부탁해 줘.</p>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white">
            내 사주 보러 가기
          </Link>
        </section>
      )}

      {view === "error" && (
        <section className="mt-10 rounded-2xl border border-brand-200 bg-white p-5 text-center">
          <p className="text-sm text-gray-700">지금은 열 수 없어. 잠시 뒤에 다시 시도해 줘.</p>
        </section>
      )}

      {view === "sent" && (
        <section className="mt-10 rounded-2xl border border-brand-200 bg-white p-5 text-center" data-testid="invite-sent">
          <p className="text-lg font-bold text-gray-800">보냈어! 💌</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {who}이 확인하면 둘의 궁합 풀이를 볼 수 있어. 보낸 정보는 {who}이 확인한 뒤 24시간 안에, 확인하지 않으면 7일 뒤에 지워져.
          </p>
          <div className="mt-4 rounded-xl bg-brand-50 px-3 py-3 text-left text-[13px] leading-relaxed text-brand-800">
            나도 내 사주가 궁금하다면? 도리가 하루 한 번 무료로 한마디 풀이해 줘. 가입하고 첫 풀이를 마치면 친구 초대 혜택으로 조약돌을 받을 수 있어.
          </div>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white" data-testid="invite-home">
            내 운세 보러 가기
          </Link>
        </section>
      )}

      {view === "form" && (
        <form onSubmit={send} className="mt-6 space-y-5" data-testid="invite-form">
          <section className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-amber-50 p-4 text-center">
            <p className="text-base font-bold leading-snug text-gray-800">
              {who}이 {rel ? `${rel} 사이로 ` : ""}둘의 궁합을 보고 싶대 💞
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">생년월일과 성별만 넣어 줘. 태어난 시간은 몰라도 괜찮아. 가입은 안 해도 돼.</p>
          </section>

          <CombinedBirthFields f={form} patch={patch} />

          <div>
            <label htmlFor="invite-name" className="mb-1 block text-xs font-bold text-gray-600">
              {who}이 부를 이름 (선택)
            </label>
            <input
              id="invite-name"
              name="inviteName"
              type="text"
              autoComplete="off"
              maxLength={INVITE_NAME_MAX}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 별명, 이름 (실명은 안 적어도 돼)"
              className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-3">
            <label className="flex items-start gap-2 text-xs leading-relaxed text-gray-700">
              <input type="checkbox" name="age14" className="mt-0.5" checked={age14} onChange={(e) => { setAge14(e.target.checked); setError(null); }} />
              <span>(필수) 나는 만 14세 이상이야.</span>
            </label>
            <label className="flex items-start gap-2 text-xs leading-relaxed text-gray-700">
              <input type="checkbox" name="consent" className="mt-0.5" checked={consent} onChange={(e) => { setConsent(e.target.checked); setError(null); }} />
              <span>
                (필수) {who}이 둘의 궁합을 볼 수 있게, 내가 적은 생년월일·성별(선택: 태어난 시간)과 이름을 {who}에게 전달하는 것에 동의해. 이 정보는 궁합 풀이에만 쓰이고, {who}이 확인한 뒤 24시간 안에, 확인하지 않으면 7일 뒤에 지워져. 가입하지 않아도 되고, 지금 보내기 전에는 아무것도 저장되지 않아.{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                  개인정보처리방침 보기
                </a>
              </span>
            </label>
          </div>

          {error && (
            <p role="alert" data-testid="invite-error" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} data-testid="invite-submit" className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white disabled:opacity-60">
            {busy ? "보내는 중…" : `${who}에게 보내기`}
          </button>
        </form>
      )}
    </main>
  );
}
