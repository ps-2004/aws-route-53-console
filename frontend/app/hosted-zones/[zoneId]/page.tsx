'use client';

import dynamic from 'next/dynamic';

const Route53Console = dynamic(() => import('../../../src/Route53Console'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#161e2e] flex flex-col items-center justify-center text-white space-y-3 font-mono text-xs">
      <div className="w-8 h-8 border-2 border-[#ec7211] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[#aab7b8]">Loading Zone Records...</p>
    </div>
  ),
});

export default function ZoneDetailPage() {
  return <Route53Console />;
}
