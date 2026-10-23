"use client";

import { useState } from "react";
import { SERVICE_NAME } from "@/lib/siteInfo";

const TEXT = "궁금하면 500원! 퐁당, 오늘의 운을 뽑아봐 🦦";

async function copy(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(`${SERVICE_NAME} ${url}`);
    return true;
  } catch {
    return false;
  }
}

/** 랜딩 하단: 도리 운세 사주를 인스타그램·페이스북·카카오톡으로 알리는 버튼 */
export default function ShareSiteBar() {
  const [message, setMessage] = useState<string | null>(null);
  const siteUrl = () => window.location.origin;

  // 인스타그램·카카오톡은 웹 공유 주소가 없어서, 폰에서는 공유 창(앱 목록)을 열고 PC에서는 링크를 복사해 줘요.
  async function viaShareSheet(app: "인스타그램" | "카카오톡") {
    const url = siteUrl();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: SERVICE_NAME, text: TEXT, url });
        setMessage(null);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    const ok = await copy(url);
    setMessage(ok ? `링크를 복사했어요. ${app}에 붙여넣기 해 주세요 🫧` : `링크를 복사하지 못했어요. 주소창의 주소를 ${app}에 붙여넣어 주세요.`);
  }

  function facebook() {
    const u = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl())}`;
    const w = window.open(u, "_blank", "noopener,noreferrer,width=600,height=640");
    if (!w) window.location.href = u;
    setMessage(null);
  }

  const btn = "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-sm transition-transform active:scale-95 hover:opacity-95";

  return (
    <div data-testid="share-site" className="mt-3 w-full max-w-sm">
      <p className="font-cute text-sm font-normal text-brand-600">친구에게도 도리를 알려 줄래? 🫧</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button type="button" data-testid="share-instagram" onClick={() => void viaShareSheet("인스타그램")} className={`${btn} bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 text-white`}>
          인스타그램
        </button>
        <button type="button" data-testid="share-facebook" onClick={facebook} className={`${btn} bg-[#1877f2] text-white`}>
          페이스북
        </button>
        <button type="button" data-testid="share-kakao" onClick={() => void viaShareSheet("카카오톡")} className={`${btn} bg-[#fee500] text-[#3c1e1e]`}>
          카카오톡
        </button>
      </div>
      {message && (
        <p role="status" data-testid="share-site-message" className="mt-2 text-[11px] font-bold text-brand-600">
          {message}
        </p>
      )}
    </div>
  );
}
