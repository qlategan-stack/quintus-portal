// ─────────────────────────────────────────────────────────────────────────
//  Notion property encoders / decoders.
//
//  Notion's property model is verbose: every field is wrapped in a
//  type-tagged object. These helpers go in both directions:
//    decode<X>(props, name) — read from a notion page's properties
//    encode<X>(value)        — produce a properties patch for write
//
//  Splitting these out keeps the per-entity mapper modules readable.
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';

type Props = Record<string, unknown>;
type RT = { plain_text: string };

// ── Decoders (Notion → JS) ───────────────────────────────────────────────

export const dTitle = (p: Props, name: string): string | null => {
  const arr = (p[name] as { title?: RT[] } | undefined)?.title ?? [];
  const text = arr.map((t) => t.plain_text).join('').trim();
  return text || null;
};

export const dRich = (p: Props, name: string): string | null => {
  const arr = (p[name] as { rich_text?: RT[] } | undefined)?.rich_text ?? [];
  const text = arr.map((t) => t.plain_text).join('').trim();
  return text || null;
};

export const dSelect = (p: Props, name: string): string | null =>
  (p[name] as { select?: { name: string } } | undefined)?.select?.name ?? null;

export const dMulti = (p: Props, name: string): string[] =>
  ((p[name] as { multi_select?: { name: string }[] } | undefined)?.multi_select ?? []).map(
    (s) => s.name,
  );

export const dDate = (p: Props, name: string): string | null =>
  (p[name] as { date?: { start: string } } | undefined)?.date?.start ?? null;

export const dUrl = (p: Props, name: string): string | null =>
  (p[name] as { url?: string } | undefined)?.url ?? null;

export const dCheck = (p: Props, name: string): boolean =>
  Boolean((p[name] as { checkbox?: boolean } | undefined)?.checkbox);

// ── Encoders (JS → Notion patch) ─────────────────────────────────────────
// Each returns an object suitable for `properties: { [name]: encX(value) }`
// in notion.pages.create / pages.update.

export const eTitle = (text: string | null) => ({
  title: text ? [{ type: 'text' as const, text: { content: text } }] : [],
});

export const eRich = (text: string | null) => ({
  rich_text: text ? [{ type: 'text' as const, text: { content: text } }] : [],
});

export const eSelect = (name: string | null) => ({
  select: name ? { name } : null,
});

export const eMulti = (names: string[]) => ({
  multi_select: names.map((n) => ({ name: n })),
});

export const eDate = (iso: string | null) => ({
  date: iso ? { start: iso } : null,
});

export const eUrl = (url: string | null) => ({
  url: url || null,
});

export const eCheck = (v: boolean) => ({ checkbox: v });

// ── Normalizers (for canonical comparison) ───────────────────────────────
// Notion returns dates as '2026-05-15' or full ISO; Supabase returns
// timestamptz as '2026-05-15T00:00:00+00:00'. Both refer to the same
// instant but differ as strings — hash comparison fails. normalizeIso
// converts either to a canonical UTC ISO string so both sides hash equal.

export function normalizeIso(s: string | null | undefined): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
