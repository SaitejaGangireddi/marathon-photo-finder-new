import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marathon Photo Finder',
  description: 'Find your marathon race moments instantly',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}