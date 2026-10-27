/** 결과가 열릴 때 위쪽에서 반짝이가 톡 퍼지는 짧은 연출. 움직임 줄이기 설정이면 CSS 에서 숨겨요. */
const SPARKS = [
  { x: -120, y: -10, d: 0, s: 18 },
  { x: -80, y: -46, d: 60, s: 12 },
  { x: -30, y: -64, d: 120, s: 16 },
  { x: 30, y: -64, d: 40, s: 12 },
  { x: 80, y: -46, d: 100, s: 18 },
  { x: 120, y: -10, d: 20, s: 14 },
  { x: -56, y: 22, d: 140, s: 10 },
  { x: 56, y: 22, d: 80, s: 10 },
];

export default function ResultBurst({ luxe = false }: { luxe?: boolean }) {
  return (
    <div aria-hidden="true" className="result-burst pointer-events-none absolute left-1/2 top-10 z-10 h-0 w-0">
      {SPARKS.map((p, i) => (
        <span
          key={i}
          className={luxe ? "text-[#e6c887]" : "text-amber-400"}
          style={{ ["--bx" as string]: `${p.x}px`, ["--by" as string]: `${p.y}px`, fontSize: p.s, animationDelay: `${p.d}ms` }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}
