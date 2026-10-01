"use client";

import { createClient } from "./supabase/client";

/**
 * Count an impression/click for a shop's ad report. Deduped per browser tab
 * session so scrolling back and forth doesn't inflate numbers. Never throws.
 */
export function trackShop(shopId: string, event: "impression" | "click") {
  try {
    const key = `bn:${event}:${shopId}:${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void createClient()
      .rpc("track_shop_event", { p_shop: shopId, p_event: event })
      .then(() => undefined, () => undefined);
  } catch {
    /* tracking must never break the page */
  }
}
