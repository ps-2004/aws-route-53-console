'use client';

import dynamic from 'next/dynamic';

const Route53Console = dynamic(() => import('../src/Route53Console'), {
  ssr: false,
});

export default function NotFound() {
  return <Route53Console />;
}
