"use client";

import type { ChatVisual } from "@/lib/ai/chat";

/*
 * 도리 답 아래에 크게 보여 주는 그림 카드. 이미지를 만들지 않고 화면이 직접 그려요.
 * 글자는 모두 일반 글로 넣어서(HTML 해석 없음) 안전해요.
 */

function Wrap({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-2 animate-[fadeUp_.35s_ease_both]" data-testid="chat-visual" role="img" aria-label={label}>
      <span className="w-9 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 pr-1">{children}</div>
    </div>
  );
}

function Note({ v }: { v: ChatVisual }) {
  return (
    <div className="relative my-2 ml-1 mr-2 -rotate-[1.4deg] rounded-[6px_14px_10px_8px] bg-[#fffdf5] py-[30px] pl-11 pr-4 pb-5 text-[#2b3a67] shadow-[0_8px_20px_rgba(0,0,0,0.2)] [background-image:repeating-linear-gradient(transparent_0_33px,#bcd2ee_33px_34px)] [background-position:0_22px]">
      <span aria-hidden="true" className="absolute -top-3 left-1/2 ml-[-45px] h-6 w-[90px] rotate-3 border border-white/60 bg-[#ffd86b]/60" />
      <span aria-hidden="true" className="absolute inset-y-0 left-[30px] w-0.5 bg-[#f2a1a1]" />
      <span aria-hidden="true" className="absolute left-2 top-5 grid gap-[34px]">
        {[0, 1, 2, 3].map((n) => (
          <i key={n} className="block h-[11px] w-[11px] rounded-full bg-[#f1ecfb] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
        ))}
      </span>
      {v.title && <p className="font-hand text-[21px] font-bold leading-[34px] text-[#d2493f]">{v.title} ✏️</p>}
      <ol className="font-hand text-[20px] leading-[34px]">
        {v.items.map((it, i) => (
          <li key={i}>
            {i + 1}. {it.label}
          </li>
        ))}
      </ol>
      <span aria-hidden="true" className="absolute -bottom-3.5 -right-1.5 rotate-[18deg] text-[34px]">🖊️</span>
    </div>
  );
}

function Checklist({ v }: { v: ChatVisual }) {
  return (
    <div className="my-2 ml-2 mr-3 rotate-[1.2deg] rounded-[4px_4px_16px_4px] bg-[#fff1a8] px-[18px] pb-3.5 pt-[18px] text-[#4f3f00] shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
      <p className="font-hand text-[21px] font-bold">{v.title || "작은 약속"} 📌</p>
      <ul className="mt-1">
        {v.items.map((it, i) => (
          <li key={i} className="flex items-center gap-2.5 font-hand text-[20px] leading-[1.9]">
            <i aria-hidden="true" className="block h-[18px] w-[18px] shrink-0 rounded border-2 border-[#4f3f00]" />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Timeline({ v }: { v: ChatVisual }) {
  return (
    <div className="my-1 rounded-[18px] bg-gradient-to-b from-[#2c2a5e] to-[#4b3a7e] px-4 pb-3 pt-4 text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
      <p className="mb-2.5 text-[14px] font-bold">{v.title || "하루 시간표"}</p>
      {v.items.map((it, i) => (
        <div key={i} className={`grid grid-cols-[48px_1fr] items-center gap-2.5 py-[7px] ${it.best ? "" : "opacity-70"}`}>
          <div className="text-center">
            <span className="block text-[22px] leading-none">{it.icon}</span>
            <span className="mt-0.5 block text-[10.5px] opacity-90">{it.label}</span>
          </div>
          <p className={`rounded-xl px-2.5 py-2 text-[13px] ${it.best ? "bg-gradient-to-br from-[#ffd86b] to-[#ffb347] font-extrabold text-[#4a2f00] shadow-[0_0_0_2px_rgba(255,255,255,0.4)]" : "bg-white/10"}`}>
            {it.sub}
            {it.best && <span className="ml-1 text-[11px]">⭐ 추천</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

function Lucky({ v }: { v: ChatVisual }) {
  const tints = ["#e8f1ff", "#f1f1f5", "#e3f6ea"];
  return (
    <div className="my-1 rounded-[18px] border border-brand-100 bg-white p-3.5 shadow-[0_8px_20px_rgba(90,54,168,0.12)]">
      <p className="mb-2.5 text-[14px] font-bold text-gray-900">{v.title || "행운 세트"} 🍀</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {v.items.map((it, i) => (
          <div key={i} className="rounded-[14px] border border-brand-100 bg-[#faf7ff] px-1 pb-2 pt-3">
            <span className="mx-auto mb-1.5 grid h-[54px] w-[54px] place-items-center rounded-2xl text-[30px] shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)]" style={{ background: tints[i % 3] }}>
              {it.icon}
            </span>
            <b className="block text-[12.5px] text-gray-900">{it.label}</b>
            <small className="text-[10.5px] text-gray-500">{it.sub}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VisualCard({ v }: { v: ChatVisual }) {
  const label = `${v.title || "도리의 카드"}: ${v.items.map((i) => i.label).join(", ")}`;
  return (
    <Wrap label={label}>
      {v.kind === "note" && <Note v={v} />}
      {v.kind === "checklist" && <Checklist v={v} />}
      {v.kind === "timeline" && <Timeline v={v} />}
      {v.kind === "lucky" && <Lucky v={v} />}
    </Wrap>
  );
}
