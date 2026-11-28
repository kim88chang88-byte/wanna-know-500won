"use client";
import { useEffect, useState } from "react";
import AddPersonForm from "@/components/landing/AddPersonForm";
import { profileSummary } from "@/lib/profile";
import type { SavedPerson } from "@/lib/people";

/**
 * "누구 사주로 볼까?" 바텀시트: 저장해 둔 사람을 고르거나, 새 사람의 생년월일시를 입력해요.
 * 새 사람은 저장하지 않고 이번 대화에서만 쓸 수도 있어요(id "temp").
 */
export default function AboutSheet({ onPick, onSelf, onClose, who }: { onPick: (p: SavedPerson) => void; onSelf: () => void; onClose: () => void; who?: string }) {
  const [people, setPeople] = useState<SavedPerson[] | null>(null);
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/people", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { people: [] }))
      .then((j: { people?: SavedPerson[] }) => live && setPeople(Array.isArray(j.people) ? j.people : []))
      .catch(() => live && setPeople([]));
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45" onClick={onClose}>
      <div data-testid="about-sheet" role="dialog" aria-modal="true" aria-label="누구 사주로 볼까?" onClick={(e) => e.stopPropagation()} className="flex max-h-[86vh] w-full max-w-[480px] flex-col rounded-t-3xl bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between px-5">
          <b className="text-[17px] text-gray-900">누구 사주로 볼까?</b>
          <button type="button" aria-label="닫기" onClick={onClose} className="grid h-11 w-11 place-items-center text-gray-800">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <p className="shrink-0 px-5 pb-2 text-xs text-[#6f6385]">{who ? `'${who}' 이야기구나! 그 사람 사주로 풀어 줄게. ` : "다른 사람 얘기를 물을 땐 그 사람의 사주로 풀어 줄게. "}저장해 둔 사람을 고르거나 새로 입력해 줘.</p>
        <div className="flex-1 overflow-y-auto px-3 pb-[max(20px,env(safe-area-inset-bottom))]">
          {people === null && <p className="px-2 py-4 text-sm text-gray-500">불러오는 중…</p>}
          {people?.map((p) => (
            <button key={p.id} type="button" data-testid="about-person" onClick={() => onPick(p)} className="flex min-h-[58px] w-full flex-col justify-center gap-0.5 border-b border-[#f1ebf8] px-3 py-2 text-left active:bg-brand-50">
              <span className="text-[15px] font-bold text-gray-900">{p.label}</span>
              <span className="text-xs text-[#6f6385]">{profileSummary(p.birth)}</span>
            </button>
          ))}
          {people !== null && people.length === 0 && !adding && <p className="px-3 py-3 text-sm text-gray-500">저장해 둔 사람이 아직 없어.</p>}
          {adding ? (
            <AddPersonForm allowSessionOnly defaultLabel={who} onAdded={onPick} onCancel={() => setAdding(false)} />
          ) : (
            <button type="button" data-testid="about-new" onClick={() => setAdding(true)} className="mt-2 flex min-h-[52px] w-full items-center gap-2 rounded-xl border border-dashed border-brand-300 px-3 text-left text-[15px] font-bold text-brand-600 active:bg-brand-50">
              ＋ 새로운 사람 입력하기
            </button>
          )}
          <button type="button" onClick={onSelf} className="mt-3 w-full rounded-xl px-3 py-3 text-center text-sm text-gray-500 underline underline-offset-2">
            {who ? "내 얘기로 물어볼래" : "내 얘기로 계속할래"}
          </button>
        </div>
      </div>
    </div>
  );
}
