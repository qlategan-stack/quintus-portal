'use client';

import { useEffect, useRef, useState } from 'react';

type Palette = {
  id: string;
  name: string;
  description: string;
  bg: string;
  accent: string;
  swatch2: string;
};

export const PALETTES: Palette[] = [
  {
    id: 'meridian',
    name: 'Meridian',
    description: 'Navy + gold (default)',
    bg: '#0a0d12',
    accent: '#c9a84c',
    swatch2: '#1a3560',
  },
  {
    id: 'linen',
    name: 'Linen',
    description: 'Light mode',
    bg: '#f0ede8',
    accent: '#a8863a',
    swatch2: '#1a3560',
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    description: 'Cool blue + cyan',
    bg: '#08111c',
    accent: '#5fc6d4',
    swatch2: '#2856a8',
  },
  {
    id: 'burnish',
    name: 'Burnish',
    description: 'Warm bronze',
    bg: '#14100a',
    accent: '#d4a55a',
    swatch2: '#5a3820',
  },
];

const STORAGE_KEY = 'qp-palette';

function applyPalette(id: string) {
  const root = document.documentElement;
  PALETTES.forEach((p) => root.classList.remove(`palette-${p.id}`));
  root.classList.add(`palette-${id}`);
}

export default function PaletteSwitcher() {
  // Initial state matches the SSR default palette ('meridian'). The bootstrap
  // script in <head> may have applied a different class before hydration —
  // the useEffect below resyncs from localStorage so the trigger label
  // matches what's actually on screen.
  const [current, setCurrent] = useState<string>('meridian');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && PALETTES.some((p) => p.id === saved)) {
        setCurrent(saved);
      }
    } catch {
      // localStorage unavailable — silent fallback
    }
  }, []);

  // Click-outside to close
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
    applyPalette(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
    setOpen(false);
  }

  const currentPalette = PALETTES.find((p) => p.id === current) ?? PALETTES[0];

  return (
    <div className="palette-switcher" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="palette-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change palette"
      >
        <span className="palette-dot" style={{ background: currentPalette.accent }} aria-hidden />
        <span>{currentPalette.name}</span>
      </button>
      {open && (
        <div className="palette-menu" role="menu">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitemradio"
              aria-checked={current === p.id}
              onClick={() => pick(p.id)}
              className={`palette-option ${current === p.id ? 'is-active' : ''}`}
            >
              <span className="palette-preview" style={{ background: p.bg }} aria-hidden>
                <span className="palette-preview-dot" style={{ background: p.accent }} />
                <span className="palette-preview-dot" style={{ background: p.swatch2 }} />
              </span>
              <span className="palette-text">
                <span className="palette-name">{p.name}</span>
                <span className="palette-desc">{p.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
