/**
 * 오늘의 도리 한마디 장면: 파스텔 하늘 배경에서 도리가 손을 흔들고, 오른쪽 유리 느낌 카드에 한마디와 작은 실천이 보여요.
 * 배경 그림(daily-scene.webp)의 카드 자리를 같은 모양의 카드로 덮어서, 글은 실제 글자로 보여줘요.
 * 글자 크기는 장면 너비에 비례해서(cqw) 화면이 좁아도 그림과 같은 비율로 줄어요.
 */
export default function DoriScene({ line, tip }: { line: string; tip: string }) {
  const long = line.length > 42;
  return (
    <div
      data-testid="dori-scene"
      className="relative mx-auto aspect-[1434/654] w-full max-w-xl overflow-hidden rounded-3xl bg-[#f6eef0] bg-cover bg-center shadow-[0_8px_24px_rgba(128,87,224,0.12)]"
      style={{ backgroundImage: "url(/images/daily-scene.webp)", containerType: "inline-size" }}
      role="img"
      aria-label={`도리가 말해요: ${line} ${tip}`}
    >
      <div
        className="absolute flex flex-col justify-center border border-white/80 bg-[#efeaf4] shadow-[0_6px_20px_rgba(120,100,170,0.18)]"
        style={{ left: "50.4%", top: "10.2%", width: "46.8%", height: "83%", borderRadius: "3.4cqw", padding: "2.4cqw 2.8cqw", gap: "1.6cqw" }}
      >
        <p data-testid="dori-scene-line" className="text-left font-medium text-slate-700" style={{ fontSize: long ? "2.5cqw" : "3cqw", lineHeight: 1.4, wordBreak: "keep-all" }}>
          {line}
        </p>
        <div aria-hidden="true" className="h-px w-full bg-slate-300/70" />
        <p data-testid="dori-scene-tip" className="rounded-[1.6cqw] bg-[#e3dcf0] text-left font-medium text-[#5b2a4a]" style={{ fontSize: "2.1cqw", lineHeight: 1.4, padding: "1.3cqw 1.8cqw", wordBreak: "keep-all" }}>
          🫧 {tip.replace(/^🫧\s*/, "")}
        </p>
      </div>
    </div>
  );
}
