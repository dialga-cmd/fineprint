'use client';

import {
  ChatCircle,
  Folders,
  ListChecks,
  Scales,
  ShieldWarning,
  Sparkle,
} from '@phosphor-icons/react';

interface Props {
  onSignIn: () => void;
  loading?: boolean;
}

const FEATURES = [
  { icon: Folders, title: 'Compare', desc: 'Spot conflicts between contracts' },
  { icon: ShieldWarning, title: 'Risk scan', desc: 'Find the clauses that bite' },
  { icon: ListChecks, title: 'Checklists', desc: 'Know exactly what to do next' },
  { icon: ChatCircle, title: 'Ask anything', desc: 'Plain-English legal Q&A' },
];

export function LoginScreen({ onSignIn, loading }: Props) {
  return (
    <div className="bg-ambient flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-gradient-to-br from-accent-softer to-accent-soft text-accent-hi shadow-xl shadow-accent/15">
          <Scales size={30} weight="fill" aria-hidden />
        </div>
        <h1 className="text-legal mt-7 text-5xl font-semibold tracking-[-0.03em] text-foreground">
          Fine<span className="text-gradient-gold italic">Print</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
          Stop drowning in legalese. Upload or paste a contract and let AI explain it, find the
          risks, and tell you what to do about it — in plain English.
        </p>

        <button
          onClick={onSignIn}
          disabled={loading}
          className="hairline-top mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-surface-2 px-5 py-3.5 text-[15px] font-semibold text-foreground transition-all duration-150 hover:border-accent/35 hover:bg-surface-3 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden />
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.1H42V20h-18v8h11.3C33.6 33.3 29 37 23.4 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.3 8.5 3.3l5.7-5.7C34.4 5.4 29.2 3 23.4 3 12.4 3 3.6 11.8 3.6 23s8.8 20 19.8 20 20-8.9 20-20c0-1-.1-2-.4-2.9z"/>
              <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.6 14.6 18.6 11 23.4 11c3.3 0 6.3 1.3 8.5 3.3l5.7-5.7C34.4 5.4 29.2 3 23.4 3 14.9 3 7.6 7.4 6.3 14.1z"/>
              <path fill="#4CAF50" d="M23.4 43c5.6 0 10.7-2.2 14.4-5.8l-6.7-5.6c-1.9 1.5-4.5 2.5-7.7 2.5-5.7 0-10.4-3.8-12.1-9l-6.5 5c3 6.1 9.4 10.9 18.6 10.9z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20h-18v8h11.3c-1.2 3.5-4 6.2-7.3 7.3l6.7 5.6C39.8 38.4 43.6 31.6 43.6 23c0-1-.1-2-.4-2.9z"/>
            </svg>
          )}
          Continue with Google
        </button>

        <p className="mt-7 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-2">
          <Sparkle size={11} className="text-accent" aria-hidden />
          Legal help, in plain English
        </p>

        <div className="stagger mt-6 grid grid-cols-2 gap-2.5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-surface group rounded-xl px-3.5 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/25">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-softer text-accent-hi">
                <f.icon size={16} weight="fill" aria-hidden />
              </span>
              <p className="mt-2.5 text-sm font-semibold text-foreground">{f.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-muted-2">
          FinePrint provides general information, not legal advice. Always consult a licensed
          professional for your specific situation.
        </p>
      </div>
    </div>
  );
}