"use client";

import { useEffect, useState } from "react";
import { SAMPLE_CAPSULES } from "./data";
import AutoMarquee from "./AutoMarquee";

interface PublicReview {
  id: number;
  rating: number;
  text: string;
  topic: string;
}

/** 이 개수 이상 모이기 전에는 실제 후기 대신 '예시' 문구를 보여 줘요. (카드가 너무 적으면 흐르는 줄이 비어 보여요) */
const MIN_REAL = 3;

const TAGS = [
  "bg-brand-500 text-white",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-pink-100 text-pink-800",
  "bg-sky-100 text-sky-800",
];

function Stars({ n }: { n: number }) {
  return (
    <span className="whitespace-nowrap text-sm text-amber-400" aria-label={`5점 만점에 ${n}점`}>
      {"★".repeat(n)}
      <span className="text-gray-200">{"★".repeat(5 - n)}</span>
    </span>
  );
}

/**
 * 메인 화면의 후기 줄. 카드가 왼쪽에서 오른쪽으로 천천히 흘러가요.
 * 이용자가 직접 "이름 없이 공개해도 좋아요"를 고른 후기만 보여 주고, 아직 모자라면 '예시'를 보여 줘요.
 */
export default function ReviewsSection() {
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/reviews/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { reviews?: PublicReview[] } | null) => {
        if (alive && Array.isArray(d?.reviews)) setReviews(d.reviews);
      })
      .catch(() => {
        /* 못 불러오면 예시를 보여 줘요 */
      });
    return () => {
      alive = false;
    };
  }, []);

  const real = reviews && reviews.length >= MIN_REAL ? reviews : null;

  const cards = real
    ? real.map((r, i) => (
        <div key={r.id} className="card-water-glow mr-5 w-[280px] shrink-0 rounded-3xl border border-brand-200 bg-white p-6 shadow-sm sm:w-[340px]">
          <div className="mb-4 flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TAGS[i % TAGS.length]}`}>{r.topic}</span>
            <Stars n={r.rating} />
          </div>
          <p className="text-sm leading-relaxed text-slate-800 break-keep">&ldquo;{r.text}&rdquo;</p>
          <p className="mt-3 text-[11px] text-slate-400">도리 운세 사주 이용자</p>
        </div>
      ))
    : SAMPLE_CAPSULES.map((s) => (
        <div key={s.key} className={`card-water-glow mr-5 w-[280px] shrink-0 rounded-3xl border bg-white p-6 shadow-sm sm:w-[340px] ${s.border}`}>
          <div className="mb-4 flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.tagClass}`}>{s.tag}</span>
            <span className="text-xs text-slate-400">예시</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-800">
            {s.parts.map((p, i) => (p.strong ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>))}
          </p>
        </div>
      ));

  return (
    <section className="mb-8 relative z-10" data-testid={real ? "review-section" : "sample-section"}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-brand-500">
            <span className="material-symbols-outlined text-[22px]">{real ? "chat_bubble" : "bubble_chart"}</span>
          </div>
          <div>
            <h3 className="font-cute text-xl font-normal text-gray-900 sm:text-2xl">{real ? "이용자 후기" : "이런 운세 풀이가 나와요"}</h3>
            <p className="text-xs text-slate-500">{real ? "도리 운세 사주를 써 본 분들이 직접 남긴 후기예요" : "수달 도사 '도리'가 건네는 한마디, 이런 느낌이에요"}</p>
          </div>
        </div>
        {!real && (
          <span className="hidden rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-brand-500 sm:inline-flex">예시 문구</span>
        )}
      </div>

      {/* 카드를 왼쪽에서 오른쪽으로 흘려요. 같은 줄을 두 번 이어 붙여 끊김 없이 반복하고, 마우스를 올리면 멈춰요.
          움직임 줄이기 설정이면 움직이지 않고 옆으로 밀어서 볼 수 있어요. */}
      <AutoMarquee testId="sample-marquee" speed={48} className="py-2">
        {() => <>{cards}</>}
      </AutoMarquee>
      <p className="mt-3 text-center text-[11px] text-slate-400">
        {real
          ? "* 이용자가 직접 공개에 동의한 후기만 이름 없이 보여 드려요. 풀이는 사람마다 달라질 수 있어요."
          : "* 예시 문구예요. 실제 이용자의 기록이 아니며, 실제 풀이는 입력한 정보에 따라 달라져요."}
      </p>
    </section>
  );
}
