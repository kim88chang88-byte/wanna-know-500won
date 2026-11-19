"use client";

import { useEffect, useState } from "react";
import { getBrowserStorage } from "@/lib/drawCounter";
import { cleanRefCode, isFinalRedeem, redeemMessage, REF_BONUS_GOAL, REF_REWARD, saveMyCode, withRef } from "@/lib/referral";
import { siteOrigin } from "@/lib/siteOrigin";
import { track } from "@/lib/track";

interface Me {
  code: string;
  done: number;
  pending: number;
}

/** 마이페이지의 친구 초대 칸: 내 코드·링크 공유, 친구 코드 입력, 초대 현황 */
export default function ReferralBox() {
  const [me, setMe] = useState<Me | null>(null);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { code?: unknown; done?: unknown; pending?: unknown } | null) => {
        if (!alive || !j || typeof j.code !== "string") return;
        saveMyCode(getBrowserStorage(), j.code);
        setMe({ code: j.code, done: Number(j.done) || 0, pending: Number(j.pending) || 0 });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!me) return null;
  const link = withRef(siteOrigin(), me.code);

  async function share() {
    const text = `도유사주에서 내 사주를 무료로 봐! 내 초대 코드로 가입하고 첫 풀이를 마치면 우리 둘 다 조약돌 2개를 받아 🎁 (코드 ${me?.code})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "도유사주", text, url: link });
        track("ref_share");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${link}`);
      track("ref_share");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // 공유 창을 닫았거나 막힌 경우예요
    }
  }

  async function redeem() {
    const code = cleanRefCode(input);
    if (!code) {
      setMsg({ ok: false, text: "코드는 영문 대문자와 숫자 8자리야." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const d = (await res.json().catch(() => null)) as { result?: unknown } | null;
      const r = typeof d?.result === "string" ? d.result : "failed";
      setMsg(redeemMessage(r));
      if (isFinalRedeem(r) && r === "ok") setInput("");
    } catch {
      setMsg(redeemMessage("failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="referral-box" className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-left">
      <p className="text-xs font-bold text-amber-900">🎁 친구 초대</p>
      <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
        친구가 내 코드로 가입하고 첫 풀이를 마치면 <b>두 사람 모두 조약돌 {REF_REWARD}개</b>! 궁합을 한 번 볼 수 있어. (초대 보상은 한 달에 3번까지)
      </p>
      <div className="mt-2 flex gap-1.5 text-center text-[11px] text-gray-800">
        <span className="flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1.5"><b className="block text-[12px] text-amber-900">나 +{REF_REWARD}</b>조약돌 {REF_REWARD}개</span>
        <span className="flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1.5"><b className="block text-[12px] text-amber-900">친구 +{REF_REWARD}</b>조약돌 {REF_REWARD}개</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span data-testid="my-ref-code" className="rounded-lg bg-white border border-amber-200 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-gray-900">
          {me.code}
        </span>
        <button type="button" onClick={share} className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-amber-950 hover:brightness-105">
          {copied ? "복사했어" : "초대 링크 보내기"}
        </button>
      </div>
      <div data-testid="ref-bonus" className="mt-2 rounded-xl border border-amber-200 bg-white px-2.5 py-2 text-gray-800">
        <p className="text-[11.5px] font-bold">
          {me.done >= REF_BONUS_GOAL ? "친구 3명 보너스, 진주 1개를 받았어 🎉" : me.done === REF_BONUS_GOAL - 1 ? "한 명만 더 부르면 진주 1개 🎉" : "친구 3명이 모이면 진주 1개 보너스"}
        </p>
        <div className="my-1 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: REF_BONUS_GOAL }, (_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < me.done ? "bg-amber-400" : "bg-amber-100"}`} />
          ))}
        </div>
        <p className="text-[11px] text-amber-800">
          초대 성공 {Math.min(me.done, REF_BONUS_GOAL)} / {REF_BONUS_GOAL}명{me.pending > 0 ? ` · 첫 풀이를 기다리는 친구 ${me.pending}명` : ""} · 보너스는 한 번만 받아요
        </p>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value.toUpperCase());
            setMsg(null);
          }}
          maxLength={12}
          placeholder="친구에게 받은 코드"
          aria-label="친구에게 받은 초대 코드"
          className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 py-1.5 font-mono text-sm uppercase tracking-widest"
        />
        <button type="button" onClick={redeem} disabled={busy || input.trim().length === 0} className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
          {busy ? "확인 중…" : "적용"}
        </button>
      </div>
      {msg && (
        <p role="status" data-testid="referral-msg" className={`mt-1.5 text-[11px] leading-relaxed ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
