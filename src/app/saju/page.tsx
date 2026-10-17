import { notFound } from "next/navigation";
import BirthForm from "@/components/BirthForm";

export const metadata = {
  title: "사주 계산 (개발용)",
};

/** 랜딩(/)과 별개로, 만세력 계산 결과를 확인하는 개발용 화면입니다. */
// 빌드할 때 미리 만들어 두면 이 검사가 빠질 수 있어서, 요청이 올 때마다 검사하도록 해요.
export const dynamic = "force-dynamic";

export default function SajuPage() {
  // 개발 서버(npm run dev)에서만 열어요. 배포(next start, Vercel)에서는 항상 404예요.
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <div className="legacy">
      <main className="legacy-container">
        <h1>500원 사주</h1>
        <p className="lead">생년월일시를 입력하면 사주를 풀어드려요.</p>
        <BirthForm />
      </main>
    </div>
  );
}
