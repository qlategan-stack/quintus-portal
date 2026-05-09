import type { Metadata } from 'next';
import {
  DM_Serif_Display,
  DM_Sans,
  Roboto_Slab,
  IBM_Plex_Sans,
  IBM_Plex_Serif,
  Archivo,
  Archivo_Black,
} from 'next/font/google';
import './globals.css';
import TabNav from './components/TabNav';

// All font pairings get loaded so the switcher can flip between them
// without a network round-trip. next/font self-hosts these — first visit
// pays the download once, subsequent visits hit cache.

const dmSerif = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--ql-dm-serif',
  display: 'swap',
});
const dmSans = DM_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--ql-dm-sans',
  display: 'swap',
});
const robotoSlab = Roboto_Slab({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--ql-roboto-slab',
  display: 'swap',
});
const plexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--ql-plex-sans',
  display: 'swap',
});
const plexSerif = IBM_Plex_Serif({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--ql-plex-serif',
  display: 'swap',
});
const archivo = Archivo({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--ql-archivo',
  display: 'swap',
});
const archivoBlack = Archivo_Black({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--ql-archivo-black',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quintus Portal',
  description: 'Personal command dashboard — general entries, ventures, weekly review.',
};

// Inline pre-paint script: reads saved palette + font from localStorage
// and applies the .palette-* and .font-* classes BEFORE any rendering, so
// reload doesn't flash the wrong palette/font. Defaults: meridian/editorial.
const BOOTSTRAP = `
  (function () {
    try {
      var root = document.documentElement;
      var p = localStorage.getItem('qp-palette') || 'linen';
      var f = localStorage.getItem('qp-font')    || 'slab';
      ['meridian','linen','cobalt','burnish'].forEach(function (n) {
        root.classList.remove('palette-' + n);
      });
      ['editorial','slab','bold','plex'].forEach(function (n) {
        root.classList.remove('font-' + n);
      });
      root.classList.add('palette-' + p);
      root.classList.add('font-' + f);
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    dmSerif.variable,
    dmSans.variable,
    robotoSlab.variable,
    plexSans.variable,
    plexSerif.variable,
    archivo.variable,
    archivoBlack.variable,
  ].join(' ');

  return (
    <html
      lang="en"
      className={`${fontVars} palette-linen font-slab`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP }} />
      </head>
      <body>
        <TabNav />
        {children}
      </body>
    </html>
  );
}
