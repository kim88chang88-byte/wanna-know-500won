"use client";

/** 500원 동전(또는 1,000원 지폐)이 톡 떨어지는 짧은 연출. 끝나면 부모가 입력창을 열어요. (움직임 줄이기 설정이면 아예 만들지 않아요) */
export default function CoinRitual({ bill = false }: { bill?: boolean }) {
  return (
    <div className={`coin-ritual${bill ? " coin-ritual-bill" : ""}`} aria-hidden="true" data-testid="coin-ritual">
      <div className="coin-ritual-slot" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {bill ? (
        <img src="/images/bill-1000.webp" alt="" width={168} height={94} className="coin-ritual-coin coin-ritual-note" />
      ) : (
        <img src="/images/coin-500.webp" alt="" width={96} height={96} className="coin-ritual-coin" />
      )}
      <p className="coin-ritual-text">도리가 운세를 꺼내는 중… 🫧</p>
    </div>
  );
}
