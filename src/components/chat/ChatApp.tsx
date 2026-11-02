"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import SafeImage from "@/components/landing/SafeImage";
import { CHAT_LOG_KEY, MSG_MAX, TURN_CAP, readChatCtx, type ChatCtx, type ChatKind, type ChatMsg } from "@/lib/chatContext";

const GREETING: Record<ChatKind, string> = {
  daily: "안녕! 오늘의 한마디 잘 받았어? 오늘 하루 더 궁금한 거 있으면 편하게 물어봐 ❄️",
  reading: "방금 본 풀이, 도리도 기억하고 있어! 읽다가 더 궁금했던 부분을 편하게 물어봐 ❄️",
  compat: "두 사람 궁합, 도리가 다 기억하고 있어! 둘 사이에서 더 궁금한 거 편하게 물어봐 ❄️",
};

const CTX_LABEL: Record<ChatKind, { name: string; icon: string }> = {
  daily: { name: "오늘의 한마디", icon: "🌙" },
  reading: { name: "방금 본 풀이", icon: "📜" },
  compat: { name: "두 사람의 궁합 결과", icon: "💞" },
};

/** 질문 추천 칩: 이미 물어본 건 빼고 4개씩 보여 줘요 */
const CHIP_POOL: Record<ChatKind, string[]> = {
  daily: [
    "오늘 조심하면 좋은 게 있을까?",
    "오늘 사람들 사이에서 마음가짐은?",
    "오늘 기분 좋게 보내는 작은 방법은?",
    "오늘 일이나 공부는 어떻게 풀어 가면 좋아?",
    "오늘 말 한마디 조언을 해 줘",
    "오늘 저녁엔 뭘 하면 좋을까?",
  ],
  reading: [
    "이 풀이에서 가장 중요한 한 가지는 뭐야?",
    "이번 주에 바로 해 볼 일을 알려 줘",
    "내 성향이 이 고민에 어떻게 작용해?",
    "올해 흐름에서 조심할 때는 언제야?",
    "마음이 불안할 때 어떻게 하면 좋아?",
    "내 장점을 더 살리는 방법이 궁금해",
  ],
  compat: [
    "싸웠을 때 누가 먼저 풀면 좋아?",
    "상대가 서운할 때 어떻게 알아챌 수 있어?",
    "올해 둘이 같이 해 보면 좋은 건?",
    "상대에게 잘 통하는 말투가 뭐야?",
    "우리 둘이 데이트하면 좋은 곳은?",
    "서로 맞춰 가려면 어떤 점을 조심해?",
  ],
};

interface Bubble extends ChatMsg {
  at: number;
  error?: boolean;
  liked?: boolean;
}

/** 도리은행 500원 동전 그림 (글 옆에 작게) */
function CoinIcon() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/coin-500.webp" alt="" width={16} height={16} aria-hidden="true" className="mr-0.5 inline-block h-4 w-4 -translate-y-px object-contain align-middle" />;
}

function readLog(): Bubble[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(CHAT_LOG_KEY) ?? "[]") as Bubble[];
    return Array.isArray(v)
      ? v.filter((m) => (m.role === "user" || m.role === "dori") && typeof m.text === "string").map((m) => ({ ...m, at: typeof m.at === "number" ? m.at : Date.now() }))
      : [];
  } catch {
    return [];
  }
}

const timeOf = (at: number) => new Date(at).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });

/** **굵게** 를 형광펜 글씨로 바꿔요 */
function rich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((t, i) =>
    t.startsWith("**") && t.endsWith("**") && t.length > 4 ? (
      <mark key={i} className="bg-[linear-gradient(transparent_62%,#f3dcff_62%)] font-extrabold text-brand-700">
        {t.slice(2, -2)}
      </mark>
    ) : (
      <span key={i}>{t}</span>
    ),
  );
}

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

export default function ChatApp() {
  const [ctx, setCtx] = useState<ChatCtx>({ kind: "daily", summary: "" });
  const [msgs, setMsgs] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [typing, setTyping] = useState<{ idx: number; shown: number } | null>(null);
  const [jump, setJump] = useState(false);
  const [vh, setVh] = useState<number | null>(null);
  /** 서버가 알려 주는 남은 질문 수 (아직 모르면 null) 와 내 뽑기 코인 수 */
  const [left, setLeft] = useState<number | null>(null);
  const [coins, setCoins] = useState(0);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  const inflight = useRef(false);

  useEffect(() => {
    const c = readChatCtx();
    if (c) setCtx(c);
    setMsgs(readLog());
    setReady(true);
  }, []);

  // 들어오자마자 남은 질문 수와 코인 수를 받아 와요
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    fetch("/api/chat/quota", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ctx }) })
      .then((r) => (r.ok ? (r.json() as Promise<{ left?: number; coins?: number }>) : null))
      .then((d) => {
        if (!alive || !d) return;
        if (typeof d.left === "number") setLeft(d.left);
        if (typeof d.coins === "number") setCoins(d.coins);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [ready, ctx]);

  // 키보드가 올라와도 입력창이 가려지지 않게, 보이는 화면 높이에 맞춰요
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => setVh(Math.round(vv.height));
    on();
    vv.addEventListener("resize", on);
    return () => vv.removeEventListener("resize", on);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(CHAT_LOG_KEY, JSON.stringify(msgs.slice(-40)));
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [msgs, ready]);

  const toBottom = useCallback((smooth = true) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto" });
    nearBottom.current = true;
    setJump(false);
  }, []);

  // 새 내용이 생기면: 아래를 보고 있을 때만 따라가고, 위를 읽는 중이면 "새 답변" 버튼만 보여 줘요
  useLayoutEffect(() => {
    if (!ready) return;
    if (nearBottom.current) toBottom(false);
    else setJump(true);
  }, [msgs, busy, typing?.shown, ready, toBottom]);

  // 한 글자씩 쓰이는 효과
  useEffect(() => {
    if (!typing) return;
    const len = msgs[typing.idx]?.text.length ?? 0;
    if (typing.shown >= len) {
      setTyping(null);
      return;
    }
    const id = setTimeout(() => setTyping((t) => (t ? { ...t, shown: Math.min(len, t.shown + 3) } : t)), 28);
    return () => clearTimeout(id);
  }, [typing, msgs]);

  // 입력창 높이 자동 조절 (최대 5줄)
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const asked = msgs.filter((m) => m.role === "user" && !m.error).length;
  // 서버 값을 아직 못 받았으면 이 화면에서 센 값으로 보여 줘요
  const leftNow = left ?? Math.max(0, TURN_CAP - asked);
  const chips = useMemo(() => {
    const done = new Set(msgs.filter((m) => m.role === "user").map((m) => m.text));
    return CHIP_POOL[ctx.kind].filter((c) => !done.has(c)).slice(0, 4);
  }, [msgs, ctx.kind]);
  const typingNow = typing !== null;

  async function send(raw: string) {
    const text = raw.trim().slice(0, MSG_MAX);
    if (!text || inflight.current || leftNow === 0) return;
    inflight.current = true;
    setInput("");
    setTyping(null);
    const next: Bubble[] = [...msgs.filter((m) => !m.error), { role: "user", text, at: Date.now() }];
    setMsgs(next);
    nearBottom.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ctx, messages: next.map(({ role, text: t }) => ({ role, text: t })) }),
      });
      const data = (await res.json().catch(() => null)) as { answer?: string; error?: string; code?: string; left?: number } | null;
      if (res.status === 402 && data?.code === "quota") {
        // 질문을 다 쓴 경우: 방금 보낸 말은 입력창으로 돌려놓고 "동전으로 더하기" 카드를 보여 줘요
        setLeft(0);
        setMsgs(next.slice(0, -1));
        setInput(text);
        return;
      }
      if (!res.ok || !data?.answer) throw new Error(data?.error ?? "도리가 잠깐 물놀이하러 갔어요. 다시 보내 볼래요?");
      if (typeof data.left === "number") setLeft(data.left);
      else setLeft((l) => (l === null ? null : Math.max(0, l - 1)));
      const all: Bubble[] = [...next, { role: "dori", text: data.answer, at: Date.now() }];
      setMsgs(all);
      if (!prefersReducedMotion()) setTyping({ idx: all.length - 1, shown: 0 });
    } catch (e) {
      setMsgs([...next, { role: "dori", text: e instanceof Error ? e.message : "답을 받지 못했어요.", at: Date.now(), error: true }]);
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }

  function retry() {
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // 마지막 질문과 실패 안내를 지우고 같은 질문을 다시 보내요
    const idx = msgs.lastIndexOf(lastUser);
    setMsgs(msgs.slice(0, idx));
    void send(lastUser.text);
  }

  function flash(t: string) {
    setNote(t);
    setTimeout(() => setNote(null), 2600);
  }

  async function buy() {
    if (buying) return;
    setBuying(true);
    try {
      const res = await fetch("/api/chat/buy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ctx }) });
      const data = (await res.json().catch(() => null)) as { left?: number; coins?: number; added?: number; error?: string; code?: string } | null;
      if (res.ok && typeof data?.left === "number") {
        setLeft(data.left);
        setCoins(data.coins ?? 0);
        flash(`질문 ${data.added ?? 5}개가 더해졌어요 ❄️`);
      } else if (data?.code === "no_coin") {
        setCoins(0);
        flash("뽑기 코인이 없어요. 친구를 초대하면 코인을 받을 수 있어요 🎁");
      } else {
        flash(data?.error ?? "코인을 쓰지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
      }
    } catch {
      flash("인터넷 연결을 확인해 주세요.");
    } finally {
      setBuying(false);
      setBuyOpen(false);
    }
  }

  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1600);
    } catch {
      flash("복사하지 못했어요. 글을 길게 눌러 복사해 주세요.");
    }
  }

  function newChat() {
    setMenu(false);
    setMsgs([]);
    setTyping(null);
    try {
      sessionStorage.removeItem(CHAT_LOG_KEY);
    } catch {
      /* 무시 */
    }
  }

  async function copyAll() {
    setMenu(false);
    const t = msgs.filter((m) => !m.error).map((m) => `${m.role === "user" ? "나" : "도리"}: ${m.text}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(t);
      flash("대화를 복사했어요 📋");
    } catch {
      flash("복사하지 못했어요.");
    }
  }

  const label = CTX_LABEL[ctx.kind];
  const summaryLines = ctx.summary.split("\n").map((l) => l.trim()).filter(Boolean);
  const showEnd = leftNow === 0 && !busy && !typingNow;

  return (
    <div
      className="relative mx-auto flex w-full max-w-[34rem] flex-col overflow-hidden bg-gradient-to-b from-[#fff1f8] via-[#f5eeff] to-[#eaf2ff]"
      style={{ height: vh ? `${vh}px` : "100dvh" }}
    >
      {/* 둥둥 떠다니는 물방울(장식) */}
      <span aria-hidden="true" className="pointer-events-none absolute -left-6 top-[38%] h-24 w-24 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffffffaa,#c9b6ff22)]" />
      <span aria-hidden="true" className="pointer-events-none absolute right-4 top-[26%] h-12 w-12 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffffffaa,#c9b6ff22)]" />

      <header className="z-20 flex items-center gap-2.5 border-b border-brand-100 bg-white/80 px-3 py-2.5 backdrop-blur">
        <Link href="/" aria-label="처음으로" className="grid h-9 w-9 place-items-center rounded-full text-xl text-gray-600 hover:bg-gray-100">
          ‹
        </Link>
        <div className="relative h-[42px] w-[42px] shrink-0">
          <SafeImage src="/images/dori-icon.webp" alt="" className="h-[42px] w-[42px] rounded-full border-2 border-brand-200 bg-white object-contain" fallback="🦦" fallbackClass="text-2xl" />
          <i aria-hidden="true" className="absolute -bottom-px -right-px h-[11px] w-[11px] rounded-full border-2 border-white bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight text-gray-900">도리 상담실</p>
          <p className="text-[11px] text-[#8a7fa8]">초승달 아래 고민 상담 중</p>
        </div>
        <div className="relative">
          <button type="button" aria-label="메뉴" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="grid h-9 w-9 place-items-center rounded-full text-xl text-gray-500 hover:bg-gray-100">
            ⋯
          </button>
          {menu && (
            <>
              <button type="button" aria-label="메뉴 닫기" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(false)} />
              <div role="menu" className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-2xl border border-brand-100 bg-white py-1 shadow-lg">
                <button role="menuitem" type="button" onClick={newChat} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50">
                  ❄️ 새 대화 시작
                </button>
                <button role="menuitem" type="button" onClick={() => void copyAll()} disabled={msgs.length === 0} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50 disabled:opacity-40">
                  📋 대화 내용 복사
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 도리가 기억하고 있는 풀이 */}
      <div className="z-10 mx-3.5 mt-2.5 overflow-hidden rounded-2xl border border-brand-200 bg-white/70 text-xs text-brand-700">
        <button
          type="button"
          onClick={() => summaryLines.length > 0 && setCtxOpen((o) => !o)}
          aria-expanded={ctxOpen}
          className="flex w-full items-center gap-2 px-3 py-2 text-left"
        >
          <span aria-hidden="true">{label.icon}</span>
          <span className="flex-1">
            <b className="font-extrabold">{label.name}</b>를 기억하고 있어요
          </span>
          {summaryLines.length > 0 && <span aria-hidden="true" className={`text-[#a99bd0] transition-transform ${ctxOpen ? "rotate-180" : ""}`}>⌄</span>}
        </button>
        {ctxOpen && (
          <ul className="space-y-1 border-t border-brand-100 px-3 py-2 text-[11.5px] leading-relaxed text-gray-600">
            {summaryLines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          if (nearBottom.current) setJump(false);
        }}
        className="relative z-[1] flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3"
        role="log"
        aria-live="polite"
        aria-label="도리와의 대화"
      >
        <p className="mx-auto w-fit rounded-full border border-brand-100 bg-white/60 px-3 py-1 text-[11px] text-[#8a7fa8]">오늘 · 도리의 달빛 서재에서 🌙</p>
        <DoriRow text={GREETING[ctx.kind]} />
        {msgs.map((m, i) => {
          if (m.role === "user") return <UserRow key={i} text={m.text} at={m.at} />;
          const live = typing?.idx === i;
          const shown = live ? m.text.slice(0, typing!.shown) : m.text;
          return (
            <DoriRow
              key={i}
              text={shown}
              error={m.error}
              onSkip={live ? () => setTyping(null) : undefined}
              actions={
                m.error ? (
                  <button type="button" onClick={retry} className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800 active:scale-95">
                    ↻ 다시 보내기
                  </button>
                ) : live ? null : (
                  <>
                    <button type="button" onClick={() => void copy(m.text, i)} className="rounded-full border border-brand-100 bg-white/70 px-2.5 py-1 text-[11px] text-[#8a7fa8] active:scale-95">
                      {copied === i ? "✓ 복사했어요" : "📋 복사"}
                    </button>
                    <button
                      type="button"
                      aria-pressed={m.liked === true}
                      onClick={() => setMsgs((all) => all.map((x, k) => (k === i ? { ...x, liked: !x.liked } : x)))}
                      className={`rounded-full border px-2.5 py-1 text-[11px] active:scale-95 ${m.liked ? "border-brand-300 bg-brand-100 font-bold text-brand-700" : "border-brand-100 bg-white/70 text-[#8a7fa8]"}`}
                    >
                      👍 도움 됐어요
                    </button>
                  </>
                )
              }
              at={m.error ? undefined : m.at}
            />
          );
        })}
        {busy && (
          <div className="flex items-start gap-2" role="status" aria-label="도리가 답을 쓰는 중">
            <span className="w-9 shrink-0" />
            <div className="inline-flex gap-1 rounded-[4px_18px_18px_18px] bg-white px-4 py-3.5 shadow-[0_2px_10px_#5a36a814]">
              {[0, 150, 300].map((d) => (
                <i key={d} className="block h-[7px] w-[7px] rounded-full bg-brand-300 motion-safe:animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        {showEnd && (
          <section className="rounded-[20px] border-[1.5px] border-sky-200 bg-gradient-to-br from-[#fff7e0] to-[#ffeaf5] p-4 text-center" aria-label="질문을 모두 사용했어요">
            <p className="text-[15px] font-bold text-gray-900">오늘의 무료 질문은 여기까지예요 🌙</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#6a5a7a]">
              도리가 더 들여다보고 싶은 얘기가 남았다면,
              <br />
              500원 동전으로 질문을 더 할 수 있어요.
            </p>
            <button type="button" onClick={() => setBuyOpen(true)} className="mt-3 block w-full rounded-full bg-gradient-to-br from-brand-500 to-[#c24fe0] py-3 text-sm font-extrabold text-white shadow active:scale-[0.98]">
              <CoinIcon /> 500원 동전으로 질문 5개 더하기
            </button>
            <button type="button" onClick={newChat} className="mt-2 text-xs font-bold text-brand-600">
              새 대화 시작하기
            </button>
          </section>
        )}
      </div>

      {jump && (
        <button type="button" onClick={() => toBottom()} className="absolute bottom-[8.5rem] left-1/2 z-20 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-lg active:scale-95">
          새 답변 ↓
        </button>
      )}
      {note && (
        <p role="status" className="absolute bottom-[8.5rem] left-1/2 z-30 w-max max-w-[88%] -translate-x-1/2 rounded-full bg-gray-900/90 px-4 py-2 text-center text-xs text-white shadow-lg">
          {note}
        </p>
      )}

      {leftNow > 0 && !busy && !typingNow && chips.length > 0 && (
        <div className="z-10 flex gap-[7px] overflow-x-auto px-3.5 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="추천 질문">
          {chips.map((c) => (
            <button key={c} type="button" onClick={() => void send(c)} className="shrink-0 whitespace-nowrap rounded-full border border-brand-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-brand-700 shadow-sm active:scale-95">
              {c}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        data-no-click-fx=""
        className="z-20 border-t border-brand-100 bg-white/85 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur"
      >
        <div className="mx-1 mb-2 flex items-center justify-between text-[11px] text-[#8a7fa8]">
          <span>
            ❄️ 질문 <b className="text-gray-800">{leftNow}번</b> 남았어요
            <span className="ml-2 text-[#b08722]"><CoinIcon /> 코인 {coins}개</span>
          </span>
          <button type="button" onClick={() => setBuyOpen(true)} className="rounded-full bg-[#fff3c9] px-2.5 py-1 font-extrabold text-[#8a5b00] active:scale-95">
            <CoinIcon /> 동전으로 더 묻기
          </button>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MSG_MAX))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            disabled={leftNow === 0}
            placeholder={leftNow === 0 ? "오늘 대화는 여기까지예요" : "도리에게 고민을 적어봐요…"}
            aria-label="도리에게 보낼 질문"
            className="max-h-[120px] min-h-[42px] flex-1 resize-none rounded-[22px] border-[1.5px] border-brand-200 bg-white px-4 py-[10px] text-[14px] leading-snug outline-none focus:border-brand-400 disabled:bg-[#f3f0fa]"
          />
          <button
            type="submit"
            aria-label="보내기"
            disabled={busy || typingNow || !input.trim() || leftNow === 0}
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_4px_12px_#8057e055] transition active:scale-95 disabled:bg-none disabled:bg-[#e5defa] disabled:shadow-none"
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
              <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.1 15 12 3.4 13.9z" />
            </svg>
          </button>
        </div>
        {input.length > MSG_MAX - 60 && <p className="mr-2 mt-1 text-right text-[10px] text-[#a99bd0]">{input.length}/{MSG_MAX}</p>}
      </form>
      {buyOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6" onClick={() => !buying && setBuyOpen(false)}>
          <div role="alertdialog" aria-modal="true" aria-label="코인으로 질문 더하기" onClick={(e) => e.stopPropagation()} className="w-full max-w-[320px] rounded-2xl bg-white px-5 py-5 text-center shadow-xl">
            <p className="text-[15px] font-bold leading-relaxed text-gray-900">뽑기 코인 1개로 질문 5개를 더할까요?</p>
            <p className="mt-1 text-xs text-slate-500">내 코인: {coins}개 {coins === 0 && "· 코인이 없어요"}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setBuyOpen(false)} disabled={buying} className="flex-1 rounded-full border border-slate-300 bg-white py-2.5 text-sm font-bold text-slate-600">
                아니요
              </button>
              <button type="button" onClick={() => void buy()} disabled={buying || coins === 0} className="flex-1 rounded-full bg-brand-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {buying ? "쓰는 중…" : "네, 더할게요"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DoriRow({ text, at, error, actions, onSkip }: { text: string; at?: number; error?: boolean; actions?: ReactNode; onSkip?: () => void }) {
  const paras = text.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="flex items-start gap-2">
      <SafeImage src="/images/dori-icon.webp" alt="" className="h-9 w-9 shrink-0 rounded-full border-[1.5px] border-brand-200 bg-white object-contain" fallback="🦦" fallbackClass="text-2xl" />
      <div className="min-w-0 max-w-[82%]">
        <p className="mb-[3px] ml-0.5 text-[11px] font-extrabold text-[#7a6e99]">수달 도사 도리</p>
        <div className="flex items-end gap-1.5">
          <div
            onClick={onSkip}
            className={`rounded-[4px_18px_18px_18px] bg-white px-3.5 py-[11px] text-[14px] leading-[1.62] shadow-[0_2px_10px_#5a36a814] ${error ? "text-amber-800" : "text-gray-900"} ${onSkip ? "cursor-pointer" : ""}`}
          >
            {paras.map((p, i) => (
              <p key={i} className={`whitespace-pre-wrap ${i > 0 ? "mt-[9px]" : ""}`}>
                {rich(p)}
              </p>
            ))}
          </div>
          {at !== undefined && <span className="shrink-0 whitespace-nowrap text-[10px] text-[#a99bd0]">{timeOf(at)}</span>}
        </div>
        {actions && <div className="ml-0.5 mt-1.5 flex flex-wrap gap-1.5">{actions}</div>}
      </div>
    </div>
  );
}

function UserRow({ text, at }: { text: string; at: number }) {
  return (
    <div className="flex items-end justify-end gap-1.5">
      <span className="whitespace-nowrap text-[10px] text-[#a99bd0]">{timeOf(at)}</span>
      <p className="max-w-[78%] whitespace-pre-wrap rounded-[18px_4px_18px_18px] bg-gradient-to-br from-brand-500 to-brand-600 px-3.5 py-2.5 text-[14px] leading-[1.55] text-white shadow-sm">{text}</p>
    </div>
  );
}
