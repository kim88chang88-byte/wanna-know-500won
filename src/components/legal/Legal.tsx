import Link from "next/link";
import type { ReactNode } from "react";
import { CONTACT_EMAILS, LEGAL_EFFECTIVE_DATE } from "@/lib/siteInfo";

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-serifKr font-bold text-lg text-gray-900 mt-8 mb-2">{children}</h2>;
}

export function ContactList() {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {CONTACT_EMAILS.map((m) => (
        <li key={m}>
          <a href={`mailto:${m}`} className="text-brand-600 underline">
            {m}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** 약관/방침 페이지 공통 틀 */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-sm leading-relaxed text-gray-700">
      <Link href="/" className="text-xs text-brand-600 hover:underline">
        ← 처음으로
      </Link>
      <h1 className="font-serifKr font-black text-2xl text-gray-900 mt-3">{title}</h1>
      <p className="text-xs text-gray-500 mt-1">시행일: {LEGAL_EFFECTIVE_DATE}</p>
      {children}
    </main>
  );
}
