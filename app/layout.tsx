import type { Metadata } from 'next';
import './globals.css';
import TabNav from './components/TabNav';

export const metadata: Metadata = {
  title: 'Quintus Portal',
  description: 'Personal command dashboard — general entries, ventures, weekly review.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TabNav />
        {children}
      </body>
    </html>
  );
}
