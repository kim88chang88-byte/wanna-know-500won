"use client";

/** 조약돌(프리미엄 종합 사주는 진주, 궁합은 조약돌 2개)이 톡 떨어지는 짧은 연출. 끝나면 부모가 입력창을 열어요. (움직임 줄이기 설정이면 아예 만들지 않아요) */
export default function CoinRitual({ big = false, two = false }: { big?: boolean; two?: boolean }) {
  return (
    <div className={`coin-ritual${two ? " coin-ritual-two" : ""}`} aria-hidden="true" data-testid="coin-ritual">
      <div className="coin-ritual-slot" />
      {two ? (
        <>
          {/* eslint-disable @next/next/no-img-element */}
          <img src="/images/coin-500.webp" alt="" width={96} height={96} className="coin-ritual-coin coin-ritual-a" />
          <img src="/images/coin-500.webp" alt="" width={96} height={96} className="coin-ritual-coin coin-ritual-b" />
          {/* eslint-enable @next/next/no-img-element */}
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={big ? "/images/pearl-3000.webp" : "/images/coin-500.webp"} alt="" width={96} height={96} className="coin-ritual-coin" />
      )}
      <p className="coin-ritual-text">도리가 운세를 꺼내는 중… ❄️</p>
    </div>
  );
}
