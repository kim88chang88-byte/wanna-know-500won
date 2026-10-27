import SafeImage from "./SafeImage";

/** 안내 카드 제목 앞에 붙는 작은 도리(수달 도사) 그림 */
export default function DoriIcon({ className = "" }: { className?: string }) {
  return (
    <SafeImage
      src="/images/dori-icon.webp"
      alt=""
      className={`mr-1.5 inline-block h-7 w-7 -translate-y-0.5 object-contain align-middle ${className}`}
      fallback="🦦"
      fallbackClass="text-base"
    />
  );
}
