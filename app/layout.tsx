import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quintus Portal',
  description: 'Personal command dashboard — ventures, dashboards, daily journal.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
