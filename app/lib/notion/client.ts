// ─────────────────────────────────────────────────────────────────────────
//  Notion client (server-only) with built-in throttle.
//
//  Notion's REST API rate-limits at ~3 req/sec per integration token.
//  Hitting it returns 429 + a Retry-After header. We simply space calls
//  out by 350ms — generous enough to avoid 429s without dragging out the
//  small incremental syncs that are the common path.
//
//  All sync work goes through the `np` proxy below. Direct
//  notion.databases.query / notion.pages.* calls are fine in scripts but
//  unsafe inside Server Actions where many concurrent invocations could
//  trip the limit.
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';
import { Client as Notion } from '@notionhq/client';

let client: Notion | null = null;

export function getNotionClient(): Notion {
  if (client) return client;
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN missing');
  client = new Notion({ auth: token });
  return client;
}

let lastCallAt = 0;
const MIN_GAP_MS = 350;

export async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCallAt;
  if (elapsed < MIN_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_GAP_MS - elapsed));
  }
  lastCallAt = Date.now();
}

/** Wrap a Notion API call so every call is rate-limited. */
export async function np<T>(fn: () => Promise<T>): Promise<T> {
  await throttle();
  return fn();
}
