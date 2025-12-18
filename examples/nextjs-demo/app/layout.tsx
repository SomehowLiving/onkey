import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// Keep layout server-only and avoid passing complex objects to client components

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Onkey Demo',
  description: 'Self-hosted Web3 authentication SDK demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

