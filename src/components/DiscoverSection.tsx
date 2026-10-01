"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Shop } from "@/lib/types";
import { ShopCard } from "./ShopCard";
import { estimatedWaitMinutes, haversineKm, formatDistance } from "@/lib/utils";
import { useGeolocation } from "@/lib/useGeolocation";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Navigation,
  LoaderCircle,
  Crosshair,
  X,
} from "lucide-react";

type SortKey = "nearest" | "rating" | "wait";

const CATEGORIES = [
  { value: "all", label: "All services" },
  { value: "hair", label: "✂️ Haircut" },
  { value: "beard", label: "🧔 Beard" },
  { value: "shave", label: "🪒 Shave" },
  { value: "spa", label: "💆 Spa & facial" },
  { value: "combo", label: "⭐ Combos" },
  { value: "kids", label: "🧒 Kids" },
];

const RADIUS_OPTIONS = [2, 5, 10, 25, 50, 0]; // 0 = any distance
const DEFAULT_RADIUS_KM = 10;

/** Lowercase + collapse spaces so "  Sharma  salon" matches "Sharma Salon". */
function norm(s: string | undefined | null): string {
  return String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Every searchable bit of a shop: name, place, tagline, services, barbers. */
function haystack(shop: Shop): string {
  return norm(
    [
      shop.name,
      shop.area,
      shop.city,
      shop.address,
      shop.tagline,
      ...shop.services.map((s) => s.name),
      ...shop.barbers.map((b) => b.name),
    ].join(" | ")
  );
}

export function DiscoverSection({
  shops,
  initialQuery = "",
}: {
  shops: Shop[];
  initialQuery?: string;
}) {
  const { coords, status, error, locate } = useGeolocation();

  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("nearest");
  const [openOnly, setOpenOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const [category, setCategory] = useState<string>("all");
  const [offersOnly, setOffersOnly] = useState(false);
  const [autoTried, setAutoTried] = useState(false);

  // Ask for the device location automatically on first mount.
  useEffect(() => {
    if (!autoTried) {
      setAutoTried(true);
      locate();
    }
  }, [autoTried, locate]);

  const usingLocation = status === "granted" && coords != null;

  // Live distance from the device; null when unknown (no device location, or
  // the barber never set the shop's location).
  const shopsWithDistance = useMemo(() => {
    return shops.map((s) => ({
      shop: s,
      distance:
        usingLocation && (s.lat || s.lng)
          ? haversineKm(coords!, { lat: s.lat, lng: s.lng })
          : null,
    }));
  }, [shops, coords, usingLocation]);

  const cities = useMemo(
    () => ["All", ...Array.from(new Set(shops.map((s) => s.city))).sort()],
    [shops]
  );

  const indexed = useMemo(
    () => shopsWithDistance.map((x) => ({ ...x, text: haystack(x.shop), name: norm(x.shop.name) })),
    [shopsWithDistance]
  );

  const q = norm(query);
  // A typed search means "find this shop wherever it is" — don't let the
  // distance radius hide it.
  const radiusActive = usingLocation && radiusKm > 0 && !q;

  // Everything except the radius — used to tell the user what lies further out.
  const beforeRadius = useMemo(() => {
    const words = q ? q.split(" ") : [];
    return indexed.filter(({ shop, text }) => {
      const matchesQuery = words.every((w) => text.includes(w));
      const matchesCity = city === "All" || shop.city === city;
      const matchesOpen = !openOnly || shop.openNow;
      const matchesCategory =
        category === "all" || shop.services.some((s) => s.category === category);
      const matchesOffers = !offersOnly || shop.services.some((s) => s.discountPercent);
      return matchesQuery && matchesCity && matchesOpen && matchesCategory && matchesOffers;
    });
  }, [indexed, q, city, openOnly, category, offersOnly]);

  const filtered = useMemo(() => {
    // Radius only applies to shops whose location we know.
    const list = radiusActive
      ? beforeRadius.filter((x) => x.distance == null || x.distance <= radiusKm)
      : beforeRadius;

    const far = Number.MAX_SAFE_INTEGER;
    return [...list].sort((a, b) => {
      if (q) {
        // Best name matches first: exact > starts-with > contains.
        const rank = (n: string) => (n === q ? 0 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : 3);
        const r = rank(a.name) - rank(b.name);
        if (r !== 0) return r;
      }
      if (sort === "nearest") return (a.distance ?? far) - (b.distance ?? far);
      if (sort === "rating") return b.shop.rating - a.shop.rating;
      return estimatedWaitMinutes(a.shop) - estimatedWaitMinutes(b.shop);
    });
  }, [beforeRadius, radiusActive, radiusKm, sort, q]);

  // Shops hidden only because they're outside the radius.
  const outside = radiusActive
    ? beforeRadius.filter((x) => x.distance != null && x.distance > radiusKm)
    : [];
  const closestOutside = outside.reduce<number | null>(
    (m, x) => (m == null || x.distance! < m ? x.distance! : m),
    null
  );

  // Smallest preset radius that would include the closest hidden shop.
  const suggestedRadius =
    closestOutside == null
      ? null
      : RADIUS_OPTIONS.find((r) => r > 0 && r >= closestOutside) ?? 0;

  const nearest =
    usingLocation && filtered.length > 0 && filtered[0].distance != null ? filtered[0] : null;

  if (shops.length === 0) {
    return (
      <section id="discover" className="container-app scroll-mt-20 py-16">
        <div className="card mx-auto max-w-2xl p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold-dark">
            <MapPin size={24} />
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">
            Partner shops are coming soon
          </h2>
          <p className="mt-2 text-ink/60">
            We&apos;re onboarding barbershops in your area. Own a shop? List it
            for free and start taking online bookings today.
          </p>
          <Link href="/barber/login" className="btn-gold mt-6">
            List your shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="discover" className="container-app scroll-mt-20 py-16">
      <div className="flex flex-col gap-2 text-center">
        <span className="mx-auto badge bg-gold/15 text-gold-dark">
          <MapPin size={12} /> Barbershops near you
        </span>
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Find &amp; book your next cut
        </h2>
        <p className="mx-auto max-w-xl text-ink/60">
          Real-time queues, verified ratings and instant booking — all in one place.
        </p>
      </div>

      {/* Location status banner */}
      <div className="mx-auto mt-6 max-w-4xl">
        <LocationBanner
          status={status}
          error={error}
          nearestLabel={
            nearest && nearest.distance != null
              ? `${nearest.shop.name} · ${formatDistance(nearest.distance)}`
              : null
          }
          radiusLabel={
            radiusKm === 0
              ? "Showing shops at any distance, nearest first."
              : `Showing shops within ${radiusKm} km of you, nearest first.`
          }
          onLocate={locate}
        />
      </div>

      {/* Controls */}
      <div className="mx-auto mt-4 max-w-4xl">
        <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-black/5 px-3 py-2.5 focus-within:ring-2 focus-within:ring-gold/40">
            <Search size={18} className="text-ink/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by shop name, area, service or barber…"
              aria-label="Search barbershops"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="rounded-full p-0.5 text-ink/40 hover:bg-black/10 hover:text-ink"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl bg-black/5 px-3 py-2.5 text-sm outline-none"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All cities" : c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl bg-black/5 px-3 py-2.5 text-sm outline-none"
          >
            <option value="nearest">Nearest first</option>
            <option value="rating">Top rated</option>
            <option value="wait">Shortest wait</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink/60">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal size={14} /> Filters
          </span>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            Open now
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={offersOnly}
              onChange={(e) => setOffersOnly(e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            Offers
          </label>

          {/* Radius filter — only meaningful with a real location */}
          {usingLocation && (
            <label className={`flex items-center gap-2 ${q ? "opacity-50" : ""}`}>
              <Navigation size={14} className="text-gold-dark" />
              <span>Within</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                disabled={Boolean(q)}
                className="rounded-lg bg-black/5 px-2 py-1 text-sm outline-none"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r === 0 ? "Any distance" : `${r} km${r === DEFAULT_RADIUS_KM ? " (default)" : ""}`}
                  </option>
                ))}
              </select>
            </label>
          )}

          <span className="ml-auto">
            {filtered.length} shop{filtered.length === 1 ? "" : "s"} found
          </span>
        </div>

        {usingLocation && q && (
          <p className="mt-2 text-xs text-ink/50">
            Searching for “{query.trim()}” across all distances.
          </p>
        )}

        {/* Service category chips */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                category === c.value
                  ? "border-ink bg-ink text-cream"
                  : "border-black/10 bg-white text-ink/70 hover:border-black/30"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ shop, distance }) => (
            <ShopCard key={shop.id} shop={shop} distanceKm={distance} />
          ))}
        </div>
      ) : (
        <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
          <Search size={28} className="mx-auto text-ink/20" />
          {radiusActive && suggestedRadius != null ? (
            <>
              <p className="mt-3 font-medium text-ink">No shops within {radiusKm} km</p>
              <p className="mt-1 text-sm text-ink/50">
                The nearest one is {formatDistance(closestOutside!)} away.
              </p>
              <button onClick={() => setRadiusKm(suggestedRadius)} className="btn-gold mt-4 text-sm">
                Show shops within {suggestedRadius === 0 ? "any distance" : `${suggestedRadius} km`}
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 font-medium text-ink">
                {q ? `No shops found for “${query.trim()}”` : "No shops match these filters"}
              </p>
              <p className="mt-1 text-sm text-ink/50">
                Check the spelling, or try an area, city or service name.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setCity("All");
                  setCategory("all");
                  setOpenOnly(false);
                  setOffersOnly(false);
                }}
                className="btn-outline mt-4 text-sm"
              >
                Clear search &amp; filters
              </button>
            </>
          )}
        </div>
      )}

      {/* Results exist, but more shops lie just beyond the radius. */}
      {filtered.length > 0 && outside.length > 0 && suggestedRadius != null && (
        <p className="mt-6 text-center text-sm text-ink/50">
          {outside.length} more shop{outside.length === 1 ? "" : "s"} beyond {radiusKm} km ·{" "}
          <button onClick={() => setRadiusKm(suggestedRadius)} className="font-medium text-gold-dark underline">
            show {suggestedRadius === 0 ? "all" : `within ${suggestedRadius} km`}
          </button>
        </p>
      )}
    </section>
  );
}

function LocationBanner({
  status,
  error,
  nearestLabel,
  radiusLabel,
  onLocate,
}: {
  status: ReturnType<typeof useGeolocation>["status"];
  error: string | null;
  nearestLabel: string | null;
  radiusLabel: string;
  onLocate: () => void;
}) {
  if (status === "locating") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-gold/10 px-4 py-3 text-sm text-gold-dark">
        <LoaderCircle size={16} className="animate-spin" />
        Detecting your location to find the nearest shops…
      </div>
    );
  }

  if (status === "granted") {
    return (
      <div className="flex flex-col items-center justify-between gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:flex-row">
        <span className="flex items-center gap-2">
          <Navigation size={16} className="text-emerald-600" />
          {radiusLabel}
        </span>
        {nearestLabel && (
          <span className="font-medium">Nearest: {nearestLabel}</span>
        )}
      </div>
    );
  }

  if (status === "denied" || status === "unavailable") {
    return (
      <div className="flex flex-col items-center justify-between gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row">
        <span className="flex items-center gap-2">
          <MapPin size={16} className="text-amber-600" />
          {error ?? "Location unavailable."} Showing all cities instead.
        </span>
        <button
          onClick={onLocate}
          className="flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700"
        >
          <Crosshair size={14} /> Try again
        </button>
      </div>
    );
  }

  // idle
  return (
    <div className="flex items-center justify-center">
      <button
        onClick={onLocate}
        className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-ink-soft"
      >
        <Crosshair size={15} className="text-gold" /> Use my location
      </button>
    </div>
  );
}
