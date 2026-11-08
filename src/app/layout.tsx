import ClickBubbles from "@/components/ClickBubbles";
import type { Metadata, Viewport } from "next";
import { LOGO_IMAGE } from "@/components/landing/images";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const TITLE = "도유 사주";
const DESCRIPTION = "수달 도사 도리의 신비한 운세 자판기. 매일 첫 1회 무료, 그다음부터는 500원!";

export const metadata: Metadata = {
  // 공유할 때 미리보기 주소를 만들 기준 주소 (배포 주소를 NEXT_PUBLIC_SITE_URL 로 넣어요)
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: LOGO_IMAGE, apple: LOGO_IMAGE },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", locale: "ko_KR", images: [{ url: "/images/hero.jpg", alt: "수달 도사 도리의 운세 자판기" }] },
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Serif+KR:wght@500;600;700;900&family=Jua&family=Gaegu:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* 쓰는 아이콘 15개만 받아요. 새 아이콘을 쓰면 아래 주소의 icon_names(가나다 순)에 이름을 추가해야 보여요. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=arrow_downward,bubble_chart,calendar_today,chat_bubble,close,folder_special,home,keyboard_arrow_down,lock,magic_button,menu_book,person,verified,wb_sunny,workspace_premium"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FFF8FC] text-[#2A2140] font-sans antialiased selection:bg-brand-200">{children}
        <ClickBubbles />
      </body>
    </html>
  );
}
