import type { Metadata } from 'next';
import { DM_Serif_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import TabNav from './components/TabNav';

const dmSerif = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--ql-font-display-stack',
  display: 'swap',
});

const dmSans = DM_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--ql-font-body-stack',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quintus Portal',
  description: 'Personal command dashboard — general entries, ventures, weekly review.',
};

// Inline pre-paint script: reads saved palette from localStorage and applies
// the .palette-* class to <html> BEFORE any rendering, so reload doesn't
// flash the wrong palette. Defaults to 'meridian' if nothing saved.
const PALETTE_BOOTSTRAP = `
  (function () {
    try {
      var p = localStorage.getItem('qp-palette') || 'meridian';
      var cls = 'palette-' + p;
      var root = document.documentElement;
      ['meridian','linen','cobalt','burnish'].forEach(function (n) {
        root.classList.remove('palette-' + n);
      });
      root.classList.add(cls);
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${dmSans.variable} palette-meridian`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PALETTE_BOOTSTRAP }} />
      </head>
      <body>
        <TabNav />
        {children}
      </body>
    </html>
  );
}
