"use client";

import { useRouter } from "next/navigation";

/** 미리보기 화면 오른쪽 위 X. 풀이를 보고 있는 중이면 홈으로 가기 전에 한 번 물어봐요. (풀이는 저장되지 않아요) */
export default function CloseLink() {
  const router = useRouter();
  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    const reading = typeof document !== "undefined" && document.querySelector('[data-testid="book-page"]') !== null;
    if (reading && !window.confirm("미리보기를 닫고 홈으로 갈까요? 지금 보던 풀이는 저장되지 않아요.")) return;
    router.push("/");
  }
  return (
    <a
      href="/"
      onClick={onClick}
      aria-label="닫고 홈으로 돌아가기"
      data-testid="premium-close"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6c887]/40 text-[#e6c887] hover:bg-[#e6c887]/10 active:scale-95 transition-transform"
    >
      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">close</span>
    </a>
  );
}
