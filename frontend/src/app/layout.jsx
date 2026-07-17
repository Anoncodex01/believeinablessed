// app/layout.jsx
import { Syne, Figtree } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const LiveTrackingWidget = dynamic(
  () => import('@/components/home/LiveTrackingWidget'),
  { ssr: false }
);

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: 'BelieveinaBlessed - Modern Fashion',
  description:
    "Tanzania's modern fashion destination for clean, confident everyday style.",
};

export default function RootLayout({ children }) {
  return (
    // Add suppressHydrationWarning to prevent theme flash
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${figtree.variable} ${syne.variable} font-body antialiased`}
      >
        <Providers>
          {children}
          <LiveTrackingWidget />
        </Providers>
      </body>
    </html>
  );
}
