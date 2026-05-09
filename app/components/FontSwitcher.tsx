'use client';

import { useEffect, useRef, useState } from 'react';

type FontPair = {
  id: string;
  name: string;
  description: string;
  /** The CSS variable next/font set on <html> for this pair's display font.
   *  Used in the menu preview so each option shows itself. */
  previewVar: string;
  fallbackFamily: string;
};

export const FONT_PAIRS: FontPair[] = [
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'DM Serif Display + DM Sans',
    previewVar: '--ql-dm-serif',
    fallbackFamily: 'Georgia, serif',
  },
  {
    id: 'slab',
    name: 'Slab',
    description: 'Roboto Slab + IBM Plex Sans',
    previewVar: '--ql-roboto-slab',
    fallbackFamily: 'Georgia, serif',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Archivo Black + Archivo',
    previewVar: '--ql-archivo-black',
    fallbackFamily: 'Impact, sans-serif',
  },
  {
    id: 'plex',
    name: 'Plex',
    description: 'IBM Plex Serif + Sans',
    previewVar: '--ql-plex-serif',
    fallbackFamily: 'Georgia, serif',
  },
];

const STORAGE_KEY = 'qp-font';

function applyFont(id: string) {
  const root = document.documentElement;
  FONT_PAIRS.forEach((p) => root.classList.remove(`font-${p.id}`));
  root.classList.add(`font-${id}`);
}

export default function FontSwitcher() {
  const [current, setCurrent] = useState<string>('editorial');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && FONT_PAIRS.some((p) => p.id === saved)) {
        setCurrent(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function pick(id: string) {
    setCurrent(id);
    applyFont(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
    setOpen(false);
  }

  const currentFont = FONT_PAIRS.find((p) => p.id === current) ?? FONT_PAIRS[0];

  return (
    <div className="palette-switcher" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="palette-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change font"
      >
        <span
          className="font-trigger-aa"
          style={{ fontFamily: `var(${currentFont.previewVar}), ${currentFont.fallbackFamily}` }}
          aria-hidden
        >
          Aa
        </span>
        <span>{currentFont.name}</span>
      </button>
      {open && (
        <div className="palette-menu" role="menu" style={{ minWidth: 280 }}>
          {FONT_PAIRS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitemradio"
              aria-checked={current === p.id}
              onClick={() => pick(p.id)}
              className={`palette-option ${current === p.id ? 'is-active' : ''}`}
            >
              <span
                className="font-preview-aa"
                style={{
                  fontFamily: `var(${p.previewVar}), ${p.fallbackFamily}`,
                }}
                aria-hidden
              >
                Aa
              </span>
              <span className="palette-text">
                <span
                  className="palette-name"
                  style={{
                    fontFamily: `var(${p.previewVar}), ${p.fallbackFamily}`,
                  }}
                >
                  {p.name}
                </span>
                <span className="palette-desc">{p.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
