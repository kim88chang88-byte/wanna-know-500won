"use client";

import { upsellFor } from "@/lib/upsell";

/** 500원 풀이 끝의 '다음 이야기' 안내. 누르면 프리미엄 소개로 데려가고, 압박하지 않아요. */
export function UpsellTeaser({ fortune, onGo }: { fortune: string; onGo: () => void }) {
  const u = upsellFor(fortune);
  if (!u) return null;
  return (
    <section data-testid="upsell-teaser" aria-label="이어지는 이야기" className="mt-6 rounded-2xl border border-brand-200 bg-gradient-to-b from-white to-brand-50/60 px-4 py-4">
      <p className="text-sm font-bold text-gray-900">🦦 이 이야기, 더 이어서 들려드릴 수 있어요</p>
      <p className="mt-1 text-xs text-gray-500">오늘 풀이는 여기까지로 충분해요. 더 궁금해지셨다면, {u.title}에는 이런 이야기가 있어요.</p>
      <ul className="mt-2.5 space-y-1.5 text-[13px] text-gray-800">
        {u.hooks.map((h) => (
          <li key={h} className="flex gap-2"><span aria-hidden="true">✦</span><span>{h}</span></li>
        ))}
      </ul>
      <button type="button" onClick={onGo} className="mt-3 rounded-full border border-brand-300 bg-white px-4 py-2 text-xs font-bold text-brand-700 hover:bg-brand-50">
        {u.title} 둘러보기
      </button>
    </section>
  );
}
