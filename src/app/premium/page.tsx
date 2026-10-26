import Link from "next/link";
import PremiumReportApp from "@/components/premium/PremiumReportApp";
import { SERVICE_NAME } from "@/lib/siteInfo";

export const metadata = {
  title: `프리미엄 리포트 · ${SERVICE_NAME}`,
  description: "생년월일시로 사주 원국, 오행, 신강·신약, 대운을 한눈에 보는 리포트",
};

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1d1a28] via-[#171520] to-[#0f0d16] text-[#f5efe0]">
      <header className="sticky top-0 z-40 border-b border-[#e6c887]/20 bg-[#14121c]/90 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="font-serifKr font-black text-lg text-[#e6c887]">
            🌙 {SERVICE_NAME}
          </Link>
          <Link
            href="/"
            aria-label="닫고 홈으로 돌아가기"
            data-testid="premium-close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6c887]/40 text-[#e6c887] hover:bg-[#e6c887]/10 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">close</span>
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.32em] text-[#e6c887]">DORI PREMIUM REPORT</p>
          <div aria-hidden="true" className="mx-auto mt-3 flex items-center justify-center gap-2 text-[#e6c887]">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#e6c887]/70" />
            <span className="text-[10px]">◆</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#e6c887]/70" />
          </div>
          <h1 className="mt-4 font-serifKr font-bold text-2xl sm:text-3xl text-[#fbf3de]">프리미엄 사주 리포트</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#e8dfca]/80">생년월일시를 입력하면 사주 원국, 오행 분포, 신강·신약, 격국·용신, 대운 흐름을 보여드려요.</p>
        </div>
        <PremiumReportApp />
        <p className="text-xs text-[#e8dfca]/50 text-center">참고용 풀이이며, 중요한 결정은 스스로 판단해 주세요.</p>
      </main>
    </div>
  );
}
