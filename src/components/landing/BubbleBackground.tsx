/** 화면 전체에 천천히 떠오르는 물방울 배경이에요. (움직임 줄이기 설정이면 CSS 가 숨겨요) */
const BUBBLES: ReadonlyArray<{ size: string; left: string; duration: number; delay: number }> = [
  { size: "w-7 h-7", left: "6%", duration: 13, delay: 0 },
  { size: "w-5 h-5", left: "14%", duration: 16, delay: 3 },
  { size: "w-9 h-9", left: "22%", duration: 18, delay: 1.5 },
  { size: "w-4 h-4", left: "31%", duration: 12, delay: 5 },
  { size: "w-8 h-8", left: "42%", duration: 15, delay: 2 },
  { size: "w-6 h-6", left: "53%", duration: 17, delay: 4.5 },
  { size: "w-10 h-10", left: "64%", duration: 20, delay: 0.8 },
  { size: "w-5 h-5", left: "73%", duration: 14, delay: 6 },
  { size: "w-8 h-8", left: "82%", duration: 19, delay: 2.2 },
  { size: "w-6 h-6", left: "91%", duration: 13.5, delay: 4 },
  { size: "w-4 h-4", left: "96%", duration: 15.5, delay: 1.2 },
  { size: "w-7 h-7", left: "38%", duration: 21, delay: 7 },
];

export default function BubbleBackground() {
  return (
    <div aria-hidden="true" data-testid="bubble-background" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className={`bubble-item ${b.size}`}
          style={{ left: b.left, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s` }}
        />
      ))}
    </div>
  );
}
