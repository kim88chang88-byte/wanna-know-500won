/** AI 풀이를 받지 못했을 때 보여 주는 안내. 기본 풀이는 그대로 보이고, 이 문구만 위에 얹어요. */
export default function AiNotice({ dark = false }: { dark?: boolean }) {
  return (
    <p
      role="status"
      data-testid="ai-notice"
      className={`mb-4 rounded-2xl border px-4 py-3 text-center text-[13px] leading-relaxed ${
        dark ? "border-[#e6c887]/40 bg-[#e6c887]/10 text-[#f3e7c9]" : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      풀이를 준비 중이에요, 잠시 뒤에 다시 시도해 주세요
    </p>
  );
}
