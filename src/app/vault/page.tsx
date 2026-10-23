import Link from "next/link";
import VaultApp from "@/components/vault/VaultApp";
import { SERVICE_NAME } from "@/lib/siteInfo";

export const metadata = {
  title: `내 보관함 · ${SERVICE_NAME}`,
  description: "봤던 사주 풀이를 다시 볼 수 있는 나만의 보관함",
  robots: { index: false, follow: false },
};

export default function VaultPage() {
  return (
    <div className="min-h-screen bg-[#FBF7FF]">
      <header className="border-b border-brand-100 bg-white/90">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="font-serifKr font-black text-lg text-brand-600">
            🌙 {SERVICE_NAME}
          </Link>
          <Link href="/" className="text-xs font-bold text-gray-500 hover:text-gray-700">
            처음으로
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div>
          <h1 className="font-serifKr font-black text-2xl sm:text-3xl text-brand-700">내 보관함 📚</h1>
          <p className="mt-2 text-sm text-slate-600">봤던 풀이가 여기에 모여요. 다시 열어 볼 때는 추가 비용이 없어요.</p>
        </div>
        <VaultApp />
      </main>
    </div>
  );
}
