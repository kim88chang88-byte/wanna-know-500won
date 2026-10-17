import { notFound } from "next/navigation";
import BirthForm from "@/components/BirthForm";

export const metadata = {
  title: "사주 계산 (개발용)",
};

/** 랜딩(/)과 별개로, 만세력 계산 결과를 확인하는 개발용 화면입니다. */
export default function SajuPage() {
  // 배포 환경에서는 개발용 화면을 열지 않아요.
  if (process.env.NODE_ENV === "production") notFound();
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
