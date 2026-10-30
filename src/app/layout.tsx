import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Masyanya | Streaming App',
  description: 'Your favorite movies and TV shows in one place',
  icons: {
    icon: 'https://i.imgur.com/3mMGsBi.png',
    shortcut: 'https://i.imgur.com/3mMGsBi.png',
    apple: 'https://i.imgur.com/3mMGsBi.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
