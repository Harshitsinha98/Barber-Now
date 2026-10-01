import Link from "next/link";
import Image from "next/image";
import type { Shop } from "@/lib/types";
import {
  priceLevelLabel,
  formatDistance,
  effectivePrice,
  formatINR,
  estimatedWaitMinutes,
  waitLabel,
  queueStatusStyle,
} from "@/lib/utils";
import { MapPin, Navigation, BadgeCheck, Star, ArrowUpRight, Music } from "lucide-react";
import { salonTypeLabel } from "@/lib/salon";

export function ShopCard({
  shop,
  distanceKm,
  sponsored = false,
  onOpen,
}: {
  shop: Shop;
  /** Live distance from the user's device; hidden when unknown. */
  distanceKm?: number | null;
  /** Shown in a paid slot → must be labelled. */
  sponsored?: boolean;
  onOpen?: () => void;
}) {
  const fromPrice = shop.services.length ? Math.min(...shop.services.map(effectivePrice)) : null;
  const maxOff = Math.max(0, ...shop.services.map((s) => s.discountPercent ?? 0));
  const q = queueStatusStyle(shop.queue.status);

  return (
    <Link
      href={`/shop/${shop.slug}`}
      onClick={onOpen}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-premium ${
        sponsored ? "ring-2 ring-gold/60" : "border border-black/5"
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={shop.coverImage}
          alt={shop.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          {shop.openNow ? (
            <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow">
              <span className={`h-2 w-2 animate-pulse-dot rounded-full ${q.dot}`} />
              {waitLabel(estimatedWaitMinutes(shop))} wait
            </span>
          ) : (
            <span className="rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-cream backdrop-blur">
              Closed now
            </span>
          )}
          <div className="flex flex-col items-end gap-1.5">
            {sponsored && (
              <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold backdrop-blur">
                Sponsored
              </span>
            )}
            {maxOff > 0 && (
              <span className="rounded-full bg-gradient-to-r from-gold to-coral px-2.5 py-1 text-xs font-bold text-ink shadow">
                Up to {maxOff}% off
              </span>
            )}
          </div>
        </div>

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-cream">
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 truncate font-display text-xl font-bold leading-tight">
              <span className="truncate">{shop.name}</span>
              {shop.isVerified && <BadgeCheck size={18} className="shrink-0 text-gold" />}
            </h3>
            <p className="flex items-center gap-1 truncate text-xs text-cream/75">
              <MapPin size={11} /> {[shop.area, shop.city].filter(Boolean).join(", ")}
              {distanceKm != null && distanceKm > 0 && (
                <>
                  <span className="mx-1 opacity-50">•</span>
                  <Navigation size={11} className="text-gold" /> {formatDistance(distanceKm)}
                </>
              )}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 translate-y-1 items-center justify-center rounded-full bg-gold text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 text-sm">
          {shop.rating > 0 ? (
            <span className="flex items-center gap-1 font-semibold text-ink">
              <Star size={14} className="fill-gold text-gold" /> {shop.rating.toFixed(1)}
              <span className="font-normal text-ink/40">({shop.reviewCount})</span>
            </span>
          ) : (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold-dark">New</span>
          )}
          <span className="text-ink/30">·</span>
          <span className="font-medium text-ink/60">{priceLevelLabel(shop.priceLevel)}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              shop.salonType === "women"
                ? "bg-pink-50 text-pink-700"
                : shop.salonType === "unisex"
                  ? "bg-violet-50 text-violet-700"
                  : "bg-sky-50 text-sky-700"
            }`}
          >
            {salonTypeLabel(shop.salonType)}
          </span>
          {shop.femaleStaff && (
            <span className="hidden rounded-full bg-pink-50 px-2 py-0.5 text-[11px] font-semibold text-pink-700 sm:inline">
              Female staff
            </span>
          )}
          {shop.acceptsSongRequests && (
            <Music size={14} className="text-coral" aria-label="Takes song requests" />
          )}
        </div>
        {fromPrice != null && (
          <span className="text-right text-xs text-ink/50">
            from <span className="font-display text-base font-bold text-ink">{formatINR(fromPrice)}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
