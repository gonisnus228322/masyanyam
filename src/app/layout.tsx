import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'masyanya',
  description: 'Free movie and TV show streaming aggregator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-white min-h-screen antialiased selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
