"use client";

/** 500원 동전이 톡 떨어지는 짧은 연출. 끝나면 부모가 입력창을 열어요. (움직임 줄이기 설정이면 아예 만들지 않아요) */
export default function CoinRitual() {
  return (
    <div className="coin-ritual" aria-hidden="true" data-testid="coin-ritual">
      <div className="coin-ritual-slot" />
      <div className="coin-ritual-coin">500</div>
      <p className="coin-ritual-text">도리가 운세를 꺼내는 중… 🫧</p>
    </div>
  );
}
