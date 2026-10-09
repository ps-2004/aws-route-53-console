import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AWS Route 53 Console',
  description: 'Amazon Route 53 Management Console Clone with Hosted Zones and DNS Records.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f2f3f3] text-[#16191f] antialiased">{children}</body>
    </html>
  );
}
