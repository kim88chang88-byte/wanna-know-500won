"use client";

import { useState } from "react";
import { getBrowserStorage } from "@/lib/drawCounter";
import type { BirthFields } from "@/lib/intake";
import { INVITE_RELATIONS, RELATION_LABEL, createMessage, inviteUrl, isInviteRelation, parseInviteBirth, type InviteRelation } from "@/lib/invite";
import { readMyCode } from "@/lib/referral";
import { siteOrigin } from "@/lib/siteOrigin";
import { track } from "@/lib/track";

interface Item {
  token: string;
  relation: string;
  status: string;
  name: string | null;
  expiresAt: string;
}

const STATUS_TEXT: Record<string, string> = { pending: "답을 기다리는 중", filled: "답이 왔어!", done: "확인했어 (24시간 안에 지워져)" };

function daysLeft(iso: string): number | null {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.max(0, Math.ceil((t - Date.now()) / 86_400_000)) : null;
}

/**
 * 궁합 질문 화면의 "링크로 물어보기". 상대 생년월일을 모를 때 링크를 보내 상대가 직접 넣게 해요.
 * 링크 만들기는 무료예요. 상대가 답하면 아래 현황에서 "궁합 보기"로 가져와 기존 궁합 흐름(조약돌 사용)으로 이어져요.
 */
export default function InvitePanel({ loggedIn, onRequestLogin, onTaken }: { loggedIn: boolean; onRequestLogin?: () => void; onTaken: (birth: BirthFields, name: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [relation, setRelation] = useState<InviteRelation | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function post(body: unknown): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch("/api/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 401) {
        setMsg("로그인이 필요해.");
        return null;
      }
      return (await res.json().catch(() => null)) as Record<string, unknown> | null;
    } catch {
      return null;
    }
  }

  async function refresh() {
    const d = await post({ action: "list" });
    setItems(Array.isArray(d?.items) ? (d.items as Item[]) : []);
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    setMsg(null);
    if (next && loggedIn && items === null) await refresh();
  }

  async function share(url: string) {
    const text = "우리 궁합 보고 싶어! 링크에서 생년월일만 넣어 줘. 가입은 안 해도 돼 ❄️";
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: "궁합 물어보기", text, url });
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // 사용자가 공유 창을 닫은 경우
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMsg("링크를 복사했어. 카톡이나 DM에 붙여 넣어 보내 줘!");
    } catch {
      setMsg(`아래 링크를 복사해서 보내 줘: ${url}`);
    }
  }

  async function create() {
    if (!relation || busy) return;
    setBusy(true);
    setMsg(null);
    const d = await post({ action: "create", relation });
    setBusy(false);
    if (d?.result === "ok" && typeof d.token === "string") {
      track("invite_create");
      await share(inviteUrl(siteOrigin(), d.token, readMyCode(getBrowserStorage())));
      await refresh();
    } else if (typeof d?.result === "string") setMsg(createMessage(d.result));
    else if (d === null && !loggedIn) setMsg("로그인이 필요해.");
    else setMsg(createMessage("failed"));
  }

  async function take(token: string) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const d = await post({ action: "take", token });
    setBusy(false);
    if (d?.result === "ok") {
      const birth = parseInviteBirth(d.birth);
      if (birth) {
        track("invite_view");
        onTaken(birth, typeof d.name === "string" ? d.name : null);
        return;
      }
    }
    if (d?.result === "not_ready") setMsg("아직 상대가 답하지 않았어.");
    else if (d?.result === "expired" || d?.result === "not_found") setMsg("이 초대는 기간이 지나 정보가 지워졌어. 새 링크를 만들어 줘.");
    else setMsg("가져오지 못했어. 잠시 뒤에 다시 시도해 줘.");
  }

  return (
    <div data-testid="invite-panel" className="mb-3 rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2.5">
      <button type="button" data-testid="invite-toggle" onClick={() => void toggle()} aria-expanded={open} className="flex w-full items-center justify-between text-left">
        <span className="text-[12px] font-bold text-brand-800">💌 상대 생년월일을 몰라? 링크로 물어봐</span>
        <span aria-hidden="true" className="text-[11px] text-brand-600">{open ? "접기" : "열기"}</span>
      </button>

      {open && !loggedIn && (
        <div className="mt-2 text-center">
          <p className="text-[11px] leading-relaxed text-gray-600">링크 만들기는 로그인하면 쓸 수 있어. (만들기는 무료야)</p>
          {onRequestLogin && (
            <button type="button" onClick={onRequestLogin} className="mt-1.5 text-[11px] font-bold text-brand-600 underline underline-offset-2">
              로그인하러 가기
            </button>
          )}
        </div>
      )}

      {open && loggedIn && (
        <div className="mt-2.5 space-y-2.5">
          <p className="text-[11px] leading-relaxed text-gray-600">
            링크를 보내면 상대가 직접 생년월일을 넣어. 링크 만들기는 무료고, 상대가 답한 뒤 궁합을 볼 때만 조약돌이 들어가. 상대 정보는 확인한 뒤 24시간 안에, 확인하지 않으면 7일 뒤에 지워져.
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="상대와의 관계">
            {INVITE_RELATIONS.map((r) => (
              <button
                key={r}
                type="button"
                data-testid={`invite-rel-${r}`}
                aria-pressed={relation === r}
                onClick={() => setRelation(r)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${relation === r ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200 bg-white text-gray-700"}`}
              >
                {RELATION_LABEL[r]}
              </button>
            ))}
          </div>
          <button type="button" data-testid="invite-create" disabled={!relation || busy} onClick={() => void create()} className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">
            {busy ? "만드는 중…" : relation ? "링크 만들어서 보내기" : "먼저 관계를 골라 줘"}
          </button>

          {items && items.length > 0 && (
            <ul className="space-y-1.5" data-testid="invite-list">
              {items.map((it) => {
                const rel = isInviteRelation(it.relation) ? RELATION_LABEL[it.relation] : it.relation;
                const left = daysLeft(it.expiresAt);
                return (
                  <li key={it.token} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 text-[11px] text-gray-700">
                    <span className="min-w-0">
                      <b>{it.name ? `${it.name} (${rel})` : rel}</b> · {STATUS_TEXT[it.status] ?? it.status}
                      {it.status === "pending" && left !== null ? ` · ${left}일 남음` : ""}
                    </span>
                    <span className="flex shrink-0 gap-1">
                      {it.status === "pending" && (
                        <button type="button" onClick={() => void share(inviteUrl(siteOrigin(), it.token, readMyCode(getBrowserStorage())))} className="rounded-md border border-brand-200 px-2 py-1 font-bold text-brand-700">
                          다시 보내기
                        </button>
                      )}
                      {(it.status === "filled" || it.status === "done") && (
                        <button type="button" data-testid="invite-take" disabled={busy} onClick={() => void take(it.token)} className="rounded-md bg-brand-600 px-2 py-1 font-bold text-white disabled:opacity-60">
                          궁합 보기
                        </button>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {msg && (
            <p role="status" data-testid="invite-msg" className="rounded-lg bg-white px-2.5 py-2 text-[11px] font-bold text-brand-800">
              {msg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
