import Link from "next/link";
import BrandLink from "@/components/landing/BrandLink";
import WalletApp from "@/components/wallet/WalletApp";
import { SERVICE_NAME } from "@/lib/siteInfo";

export const metadata = {
  title: `내 지갑 · ${SERVICE_NAME}`,
  description: "조약돌·진주 잔액과 최근 내역",
  robots: { index: false, follow: false },
};

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-[#FBF7FF]">
      <header className="border-b border-brand-100 bg-white/90">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <BrandLink heading={false} />
          <Link href="/" className="text-xs font-bold text-gray-500 hover:text-gray-700">
            처음으로
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <h1 className="font-serifKr font-black text-2xl sm:text-3xl text-brand-700">내 지갑 👛</h1>
        <WalletApp />
      </main>
    </div>
  );
}
