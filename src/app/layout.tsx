import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const TITLE = "도리 운세 사주";
const DESCRIPTION = "수달 도사 도리의 신비한 운세 자판기. 매일 첫 1회 무료, 그다음부터는 500원!";

export const metadata: Metadata = {
  // 공유할 때 미리보기 주소를 만들 기준 주소 (배포 주소를 NEXT_PUBLIC_SITE_URL 로 넣어요)
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", locale: "ko_KR" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Serif+KR:wght@500;600;700;900&family=Jua&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F4F8FD] text-[#1E293B] font-sans antialiased selection:bg-brand-200">{children}</body>
    </html>
  );
}
