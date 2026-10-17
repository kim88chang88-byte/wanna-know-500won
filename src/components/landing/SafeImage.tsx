"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
  /** 이미지를 못 불러왔을 때 대신 보여줄 이모지 */
  fallback: string;
  /** 자리 표시 크기(Tailwind 글자 크기 클래스) */
  fallbackClass?: string;
}

/**
 * 이미지가 없거나(404) 주소가 만료돼도 깨진 아이콘 대신 이모지를 보여주는 이미지예요.
 * 서버에서 만든 HTML 의 이미지는 React 가 붙기 전에 실패할 수도 있어서, 붙은 뒤에 한 번 더 확인해요.
 */
export default function SafeImage({ src, alt, className, fallback, fallbackClass = "text-6xl" }: Props) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (failed) {
    return (
      <span role="img" aria-label={alt} data-testid="image-fallback" className={`select-none ${fallbackClass}`}>
        {fallback}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
