/**
 * 오늘의 도리 한마디 장면: 파스텔 하늘 배경에서 도리가 손을 흔들고, 오른쪽 말풍선에 한마디와 작은 실천이 보여요.
 * 배경 그림(daily-scene.webp)의 말풍선 자리를 같은 모양의 풍선으로 덮어서, 글은 실제 글자로 보여줘요.
 * 글자 크기는 장면 너비에 비례해서(cqw) 화면이 좁아도 그림과 같은 비율로 줄어요.
 */
export default function DoriScene({ line, tip }: { line: string; tip: string }) {
  const long = line.length > 42;
  // "오늘의 작은 실천: 내 속도대로…" → "오늘의 작은 실천:" 다음에서 줄을 바꿔요
  const cleanTip = tip.replace(/^🫧\s*/, "");
  const m = /^([^:：]{1,20}[:：])\s*(.+)$/s.exec(cleanTip);
  const tipHead = m ? m[1] : cleanTip;
  const tipRest = m ? m[2] : "";
  return (
    <div
      data-testid="dori-scene"
      className="relative mx-auto aspect-[856/412] w-full max-w-xl overflow-hidden rounded-3xl bg-[#f6eef0] bg-cover bg-center shadow-[0_8px_24px_rgba(128,87,224,0.12)]"
      style={{ backgroundImage: "url(/images/daily-scene.webp)", containerType: "inline-size" }}
      role="img"
      aria-label={`도리가 말해요: ${line} ${tip}`}
    >
      <div
        className="absolute flex flex-col border border-white/70 shadow-[0_6px_18px_rgba(150,130,190,0.22)]"
        style={{
          left: "40%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "58.5%",
          borderRadius: "5cqw",
          padding: "2.8cqw 3.4cqw",
          gap: "2cqw",
          background: "linear-gradient(120deg, #fbf3f0 0%, #f4eaef 42%, #e7e5f5 100%)",
        }}
      >
        {/* 도리를 향한 말풍선 꼬리 */}
        <span
          aria-hidden="true"
          className="absolute border-b border-l border-white/70"
          style={{ left: "-1.7cqw", top: "calc(50% - 1.7cqw)", width: "3.4cqw", height: "3.4cqw", transform: "rotate(45deg)", background: "#f8eef0" }}
        />
        <p data-testid="dori-scene-line" className="text-left font-bold text-slate-800" style={{ fontSize: long ? "3.1cqw" : "3.8cqw", lineHeight: 1.4, wordBreak: "keep-all" }}>
          “{line}”
        </p>
        <p data-testid="dori-scene-tip" className="border border-white/80 bg-white/60 text-left font-medium text-[#5b2a4a]" style={{ fontSize: "2.2cqw", lineHeight: 1.4, padding: "1.5cqw 2.4cqw", borderRadius: "2.6cqw", wordBreak: "keep-all" }}>
          🫧 {tipHead}
          {tipRest && (
            <>
              <br />
              {tipRest}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
