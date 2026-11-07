"use client";

import type { ChatVisual } from "@/lib/ai/chat";
import { PALETTE, SPOTS } from "@/lib/visualPalette";

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
  // 시간이 지날수록 초가 짧아져요 (저녁 → 밤)
  const n = v.items.length;
  const heightOf = (i: number) => Math.round(104 - (n > 1 ? (i / (n - 1)) * 50 : 0));
  return (
    <div className="my-1 rounded-[20px] bg-[radial-gradient(120%_90%_at_50%_0%,#4a3a1f,#1e1710_70%)] px-3.5 pb-3.5 pt-3.5 text-[#fbe9c4] shadow-[0_10px_24px_rgba(0,0,0,0.4)]">
      <p className="mb-1 font-[family-name:var(--font-serif,inherit)] text-[16px] font-extrabold">{v.title || "저녁 시간표"}</p>
      <ol className="mt-1.5 grid h-[168px] items-end gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {v.items.map((it, i) => (
          <li key={i} className="flex h-full flex-col justify-end text-center">
            <span
              aria-hidden="true"
              className={`candle-flame mx-auto mb-px block rounded-[50%_50%_50%_50%/62%_62%_38%_38%] bg-[radial-gradient(circle_at_50%_70%,#fff6c2,#ffb52e_60%,#ff7a1a)] ${it.best ? "h-[30px] w-4 drop-shadow-[0_0_16px_#ffc84a]" : "h-[22px] w-3 scale-90 opacity-45 drop-shadow-[0_0_8px_#ffb52e]"}`}
            />
            <span
              aria-hidden="true"
              className="candle-stick mx-auto block w-[34px] rounded-[6px_6px_3px_3px] bg-[linear-gradient(90deg,#f4e7cc,#fff6e0_40%,#e6d3ac)] shadow-[inset_0_-4px_6px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.4)]"
              style={{ ["--h" as string]: `${heightOf(i)}px`, animationDelay: `${i * 0.2}s` }}
            />
            <p className={`mt-1.5 text-[11.5px] leading-snug ${it.best ? "font-extrabold text-[#fff3cf]" : ""}`}>
              <b className="block text-[11px] font-bold tracking-wide text-[#ffcf7a]">{it.label}</b>
              {it.sub}
              {it.best && <span className="mt-0.5 block text-[10.5px] text-[#ffd86b]">⭐ 추천</span>}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Paper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative my-2 ml-1 mr-2 rounded-[6px_6px_14px_14px] bg-[#fffdf6] px-3.5 pb-3.5 pt-4 text-[#4a3f2a] shadow-[0_6px_16px_rgba(58,42,10,0.18)]">
      <span aria-hidden="true" className="absolute -top-2 left-1/2 ml-[-38px] h-5 w-[76px] -rotate-2 rounded-sm bg-[#ffd8e8]/70" />
      <p className="mb-2.5 mt-0.5 text-center font-hand text-[22px] font-bold leading-none">{title}</p>
      {children}
    </div>
  );
}

function Lucky({ v }: { v: ChatVisual }) {
  const tints = ["#e8f1ff", "#f1f1f5", "#e3f6ea"];
  return (
    <Paper title={v.title || "행운 세트"}>
      <ul className="grid gap-2">
        {v.items.map((it, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl bg-[#f7f2e4] px-2.5 py-2">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[26px] shadow-[inset_0_-3px_0_rgba(0,0,0,0.1)]" style={{ background: tints[i % 3] }}>
              {it.icon}
            </span>
            <span className="min-w-0">
              <b className="block text-[13.5px] text-[#2a2540]">{it.label}</b>
              <span className="block font-hand text-[17px] leading-tight text-[#8a5a2b]">{it.sub}</span>
            </span>
          </li>
        ))}
      </ul>
    </Paper>
  );
}

function Palette({ v }: { v: ChatVisual }) {
  const tilt = ["-rotate-3", "rotate-[1.5deg]", "-rotate-1"];
  return (
    <Paper title={v.title || "추천 색상"}>
      <div className="flex justify-center gap-2.5 pt-1">
        {v.items.map((it, i) => {
          const c = PALETTE[it.label];
          if (!c) return null;
          return (
            <div key={i} className={`min-w-0 max-w-[112px] flex-1 rounded-[3px] bg-white px-[5px] pb-2 pt-[5px] shadow-[0_4px_9px_rgba(0,0,0,0.25)] ${tilt[i % 3]}`}>
              <i className="block h-[88px] rounded-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" style={{ background: c.hex }} />
              <b className="mt-1.5 block text-center text-[13px] text-[#2a2540]">{it.label}</b>
              <small className="block text-center text-[10px] tracking-wide text-[#7a7590]">{c.en}</small>
              {it.sub && <span className="mt-0.5 block text-center font-hand text-[15.5px] leading-tight text-[#8a5a2b]">{it.sub}</span>}
            </div>
          );
        })}
      </div>
    </Paper>
  );
}

function Spots({ v }: { v: ChatVisual }) {
  const pins = v.items.map((it, i) => ({ n: i + 1, ...(SPOTS[it.label] ?? { x: 0, y: 0 }) })).filter((p) => p.x > 0);
  return (
    <Paper title={v.title || "소품 놓을 자리"}>
      <svg className="block w-full rounded-[10px]" viewBox="0 0 320 190" aria-hidden="true">
        <rect width="320" height="190" fill="#f6efe3" />
        <rect y="140" width="320" height="50" fill="#d9bf9a" />
        <rect y="138" width="320" height="4" fill="#8d6540" opacity=".4" />
        <rect x="22" y="22" width="62" height="64" rx="4" fill="#bfe3f5" stroke="#8d6540" strokeWidth="4" />
        <path d="M53 22v64M22 54h62" stroke="#8d6540" strokeWidth="3" />
        <circle cx="40" cy="38" r="9" fill="#fff" opacity=".55" />
        <rect x="20" y="92" width="68" height="6" rx="2" fill="#b88a5a" />
        <rect x="28" y="98" width="4" height="9" fill="#8d6540" />
        <rect x="76" y="98" width="4" height="9" fill="#8d6540" />
        <g transform="translate(36 78)"><rect y="6" width="12" height="8" rx="2" fill="#d9825b" /><path d="M6 6c-6-8-2-12 0-14 2 2 6 6 0 14z" fill="#4e9a5b" /></g>
        <rect x="104" y="106" width="108" height="64" rx="8" fill="#9db4e6" />
        <rect x="104" y="118" width="108" height="52" rx="6" fill="#7f9bd6" />
        <rect x="108" y="100" width="34" height="20" rx="8" fill="#f6f3ec" />
        <rect x="104" y="170" width="6" height="8" fill="#8d6540" />
        <rect x="206" y="170" width="6" height="8" fill="#8d6540" />
        <rect x="216" y="116" width="26" height="46" rx="3" fill="#b88a5a" />
        <rect x="220" y="122" width="18" height="12" rx="2" fill="#8d6540" opacity=".5" />
        <rect x="224" y="108" width="10" height="8" rx="2" fill="#f4f1ea" stroke="rgba(0,0,0,.15)" />
        <rect x="252" y="96" width="62" height="6" rx="2" fill="#b88a5a" />
        <rect x="258" y="102" width="5" height="68" fill="#8d6540" />
        <rect x="304" y="102" width="5" height="68" fill="#8d6540" />
        <rect x="262" y="84" width="22" height="12" rx="2" fill="#fff" stroke="rgba(0,0,0,.15)" />
        <path d="M290 96l8-26" stroke="#555" strokeWidth="3" />
        <path d="M290 70l14 4-6 8z" fill="#ffd978" />
        {pins.map((p, i) => (
          <g key={p.n} className="animate-[pinPop_.5s_cubic-bezier(.3,1.6,.5,1)_both]" style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${0.2 + i * 0.3}s` }}>
            <circle cx={p.x} cy={p.y + 14} r="3" fill="rgba(0,0,0,.2)" />
            <path d={`M${p.x} ${p.y + 13} L${p.x - 7} ${p.y - 3} A9 9 0 1 1 ${p.x + 7} ${p.y - 3} Z`} fill="#e8564a" />
            <text x={p.x} y={p.y + 1} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{p.n}</text>
          </g>
        ))}
      </svg>
      <ul className="mt-2.5 grid gap-1.5">
        {v.items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 text-[13px]">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e8564a] text-[12px] font-bold text-white shadow">{i + 1}</span>
            <b className="font-hand text-[17px]">{it.label}</b>
            <span className="min-w-0">{it.sub}</span>
          </li>
        ))}
      </ul>
    </Paper>
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
      {v.kind === "palette" && <Palette v={v} />}
      {v.kind === "spots" && <Spots v={v} />}
    </Wrap>
  );
}
