"use client";

import { useState } from "react";
import { LOW_RATING, MAX_REVIEW_REASONS, MAX_REVIEW_TEXT, REVIEW_REASONS, type ReviewReasonId } from "@/lib/reviews";

type Phase = "idle" | "sending" | "done";

const LABELS = ["", "별로예요", "조금 아쉬워요", "괜찮아요", "좋았어요", "아주 좋았어요"];

/** 결과 화면 맨 아래의 사용후기 상자. 별점만 눌러도 제출돼요. (결과 하나당 한 번만 낼 수 있어요) */
export default function ReviewBox({ topic, premium }: { topic: string; premium: boolean }) {
  const [rating, setRating] = useState(0);
  const [reasons, setReasons] = useState<ReviewReasonId[]>([]);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  function toggleReason(id: ReviewReasonId) {
    setReasons((cur) => (cur.includes(id) ? cur.filter((r) => r !== id) : cur.length >= MAX_REVIEW_REASONS ? cur : [...cur, id]));
  }

  async function submit() {
    if (rating < 1 || phase !== "idle") return;
    setPhase("sending");
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text, reasons: rating <= LOW_RATING ? reasons : [], topic, premium }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "후기를 저장하지 못했어요. 잠시 뒤에 다시 해줘요.");
      }
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "후기를 저장하지 못했어요.");
      setPhase("idle");
    }
  }

  if (phase === "done") {
    return (
      <div data-testid="review-done" role="status" className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-4 text-center">
        <p className="font-serifKr font-bold text-emerald-800 text-sm">후기 고마워요 🫧</p>
        <p className="mt-1 text-[11px] text-emerald-700">도리가 더 잘 풀어줄 수 있게 소중하게 읽어볼게요.</p>
      </div>
    );
  }

  return (
    <section data-testid="review-box" aria-labelledby="review-h" className="mt-5 rounded-2xl bg-white border border-brand-100 px-4 py-4 shadow-sm">
      <h4 id="review-h" className="font-serifKr font-bold text-sm text-gray-900 text-center">
        오늘 도리의 풀이는 어땠어요?
      </h4>
      <div role="radiogroup" aria-label="별점" className="mt-2 flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n}점 ${LABELS[n]}`}
            data-testid={`star-${n}`}
            tabIndex={rating === n || (rating === 0 && n === 1) ? 0 : -1}
            onClick={() => setRating(n)}
            onKeyDown={(e) => {
              // 라디오 그룹처럼 화살표 키로 별점을 바꿀 수 있어요.
              const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? Math.min(5, (rating || n) + 1) : e.key === "ArrowLeft" || e.key === "ArrowDown" ? Math.max(1, (rating || n) - 1) : 0;
              if (!next) return;
              e.preventDefault();
              setRating(next);
              (e.currentTarget.parentElement?.querySelector(`[data-testid="star-${next}"]`) as HTMLElement | null)?.focus();
            }}
            className={`text-3xl leading-none px-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded ${n <= rating ? "text-amber-400" : "text-gray-300"}`}
          >
            <span aria-hidden="true">★</span>
          </button>
        ))}
      </div>
      <p data-testid="star-label" className="mt-1 h-4 text-center text-[11px] font-bold text-brand-600">
        {rating > 0 ? LABELS[rating] : "별을 눌러 알려줘요"}
      </p>

      {rating > 0 && (
        <div className="mt-3 space-y-3">
          {rating <= LOW_RATING && (
            <div data-testid="review-reasons">
              <p className="text-[11px] font-bold text-gray-600 mb-1.5">어떤 점이 아쉬웠나요? (선택, 최대 {MAX_REVIEW_REASONS}개)</p>
              <div className="flex flex-wrap gap-1.5">
                {REVIEW_REASONS.map((r) => {
                  const on = reasons.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={on}
                      data-testid={`reason-${r.id}`}
                      onClick={() => toggleReason(r.id)}
                      className={`px-2.5 py-1.5 rounded-full border text-[11px] font-bold ${on ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-700 border-brand-200 hover:bg-brand-50"}`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <label htmlFor="review-text" className="block text-[11px] font-bold text-gray-600 mb-1">
              한 줄 후기 (선택)
            </label>
            <textarea
              id="review-text"
              name="reviewText"
              rows={2}
              maxLength={MAX_REVIEW_TEXT}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="예) 내 얘기 같아서 놀랐어요"
              className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <p className="mt-1 text-[10px] text-gray-400">
              {text.length}/{MAX_REVIEW_TEXT} · 이름·연락처 같은 개인정보는 적지 말아줘요. 후기는 서비스 개선에만 써요.
            </p>
          </div>
          {error && (
            <p role="alert" className="text-[11px] font-bold text-red-600">
              {error}
            </p>
          )}
          <button
            type="button"
            data-testid="review-submit"
            disabled={phase === "sending"}
            onClick={submit}
            className="w-full py-2.5 rounded-full bg-brand-600 text-white font-serifKr font-bold text-sm shadow-md hover:bg-brand-700 disabled:opacity-60"
          >
            {phase === "sending" ? "보내는 중…" : "후기 남기기"}
          </button>
        </div>
      )}
    </section>
  );
}
