import type { Metadata } from 'next';
import React from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import { Nav } from './components/nav';
import { AnalyticsProvider } from './components/analytics-provider';

export const metadata: Metadata = {
  title: 'Anvara Marketplace',
  description: 'Sponsorship marketplace connecting sponsors with publishers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const envGaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const gaId = envGaId || (process.env.NODE_ENV === 'development' ? 'G-DEMO000000' : undefined);

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <AnalyticsProvider />
        <main className="mx-auto max-w-6xl p-4">{children}</main>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
