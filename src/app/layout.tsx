import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Model-meter — Free AI Spend Audit',
    template: '%s | Model-meter',
  },
  description:
    'Audit your team\'s AI tool spend in 60 seconds. Identify overpaid plans, redundant subscriptions, and quantify your savings — free, no login required.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://model-meter.vercel.app'),
  openGraph: {
    siteName: 'Model-meter',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@model_meter',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
