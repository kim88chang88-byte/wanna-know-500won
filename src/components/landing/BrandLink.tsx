import Link from "next/link";
import { SERVICE_NAME } from "@/lib/siteInfo";
import { LOGO_IMAGE } from "./images";
import SafeImage from "./SafeImage";

/** 맨 위 왼쪽의 도리 로고 + 제목 + Beta 스티커. 랜딩과 보관함 같은 모든 화면이 똑같이 써요. */
export default function BrandLink({ heading = true }: { heading?: boolean }) {
  const Title = heading ? "h1" : "p";
  return (
    <Link href="/" aria-label={`${SERVICE_NAME} 홈으로`} data-testid="home-link" className="flex items-center gap-2 sm:gap-2.5">
      <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-brand-500/40 shadow-sm shrink-0 bg-sky-50 flex items-center justify-center">
        <SafeImage src={LOGO_IMAGE} alt="도리 운세 사주 로고" className="w-full h-full object-cover" fallback="🦦" fallbackClass="text-2xl" />
      </div>
      <Title className="font-cute font-normal text-[19px] min-[400px]:text-[22px] sm:text-[30px] leading-none whitespace-nowrap tracking-normal bg-gradient-to-r from-brand-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent inline-flex items-center gap-1.5">
        도리운세⋅사주
        <span
          data-testid="beta-sticker"
          className="-rotate-6 rounded-md border border-amber-300 bg-amber-100 px-1.5 py-0.5 font-sans text-[9px] font-extrabold uppercase leading-none tracking-wide text-amber-700 shadow-[1px_1px_0_0_rgba(217,119,6,0.35)] sm:text-[11px]"
        >
          Beta
        </span>
      </Title>
    </Link>
  );
}
