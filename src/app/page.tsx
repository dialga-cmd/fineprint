'use client';

import dynamic from 'next/dynamic';

const ChatApp = dynamic(() => import('../components/ChatApp').then((m) => m.ChatApp), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"
        aria-label="Loading"
      />
    </div>
  ),
});

export default function Home() {
  return <ChatApp />;
}