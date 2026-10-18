import type { ConcernView } from "@/lib/premium/types";

/** 손님이 적은 "요즘 고민"과 도리의 답. 일반(밝은) 화면과 프리미엄(어두운 금빛) 화면에서 같이 써요. */
export default function ConcernCard({ concern, dark = false }: { concern: ConcernView; dark?: boolean }) {
  if (concern.answers.length === 0 && !concern.text) return null;
  const wrap = dark
    ? "rounded-2xl border border-[#e6c887]/30 bg-white/[0.04] p-4 text-[#f5efe0]"
    : "rounded-3xl bg-gradient-to-br from-rose-50 via-white to-amber-50 border border-rose-100 p-5 sm:p-6 shadow-[0_8px_30px_rgba(244,114,182,0.10)]";
  const h = dark ? "font-serifKr font-bold text-base text-[#f6dfa8]" : "font-serifKr font-bold text-lg text-brand-700";
  const item = dark ? "rounded-xl bg-white/[0.05] border border-[#e6c887]/15 px-4 py-3" : "rounded-2xl bg-white/80 border border-rose-100 px-4 py-3";
  const t = dark ? "text-[13px] font-bold text-[#fbf3de]" : "text-sm font-bold text-gray-800";
  const b = dark ? "mt-1 text-[13px] leading-relaxed text-[#e8dfca]" : "mt-1 text-[13px] leading-relaxed text-gray-600";
  return (
    <section data-testid="concern-card" aria-labelledby={dark ? "concern-h-dark" : "concern-h"} className={wrap}>
      <h2 id={dark ? "concern-h-dark" : "concern-h"} className={h}>
        <span aria-hidden="true">🫧</span> 요즘 고민에 대한 도리의 답
      </h2>
      {concern.text && (
        <p data-testid="concern-quote" className={`mt-2 text-xs leading-relaxed ${dark ? "text-[#e8dfca]/80" : "text-gray-500"}`}>
          “{concern.text}”
        </p>
      )}
      {concern.answers.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {concern.answers.map((a) => (
            <li key={a.id} data-testid="concern-answer" className={item}>
              <div className={t}>
                <span aria-hidden="true">{a.emoji}</span> {a.title}
              </div>
              <p className={b}>{a.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`mt-3 text-xs leading-relaxed ${dark ? "text-[#e8dfca]/70" : "text-gray-500"}`}>
          직접 적어 준 마음은 도리가 잘 들었어요. 위의 풀이를 읽으며 가볍게 참고해 봐요. 고민 버튼을 고르면 더 맞춤으로 풀어 줄 수 있어요.
        </p>
      )}
    </section>
  );
}
