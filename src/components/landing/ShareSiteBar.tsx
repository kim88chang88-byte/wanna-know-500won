"use client";

import { useEffect, useRef, useState } from "react";

/** 주소를 클립보드에 넣어요. 최신 방식이 막혀 있으면(http 주소·일부 앱 안 브라우저) 예전 방식으로 한 번 더 해 봐요. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

/** 랜딩 하단: 도리 운세 사주 주소를 복사해서 친구에게 붙여넣어 보내게 하는 버튼 */
export default function ShareSiteBar() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function onCopy() {
    const ok = await copyText(window.location.origin);
    setState(ok ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    if (ok) timer.current = setTimeout(() => setState("idle"), 3000);
  }

  return (
    <div data-testid="share-site" className="mt-3 w-full max-w-sm">
      <p className="font-cute text-sm font-normal text-brand-600">친구에게도 도리를 알려 주세요 🫧</p>
      <button
        type="button"
        data-testid="share-copy"
        onClick={() => void onCopy()}
        className={`mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-bold shadow-sm transition-colors active:scale-95 ${
          state === "copied" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-brand-200 bg-white text-brand-600 hover:bg-brand-50"
        }`}
      >
        <span aria-hidden="true">{state === "copied" ? "✓" : "🔗"}</span>
        {state === "copied" ? "링크를 복사했어요" : "도리 운세 사주 링크 복사"}
      </button>
      <p role="status" data-testid="share-site-message" className="mt-2 min-h-[1rem] text-[11px] font-bold text-brand-600">
        {state === "copied" && "친구에게 붙여넣어 보내 주세요 🫧"}
        {state === "failed" && `복사하지 못했어요. 주소창의 주소를 직접 복사해 주세요.`}
      </p>
    </div>
  );
}
