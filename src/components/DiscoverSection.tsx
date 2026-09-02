"use client";

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
} from "lucide-react";

type SortKey = "nearest" | "rating" | "wait";

export function DiscoverSection({ shops }: { shops: Shop[] }) {
  const { coords, status, error, locate } = useGeolocation();

  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("nearest");
  const [openOnly, setOpenOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [autoTried, setAutoTried] = useState(false);

  // Ask for the device location automatically on first mount.
  useEffect(() => {
    if (!autoTried) {
      setAutoTried(true);
      locate();
    }
  }, [autoTried, locate]);

  const usingLocation = status === "granted" && coords != null;

  // Attach a live distance (from device) to each shop when we have coords.
  const shopsWithDistance = useMemo(() => {
    return shops.map((s) => ({
      shop: s,
      distance: usingLocation
        ? haversineKm(coords!, { lat: s.lat, lng: s.lng })
        : s.distanceKm,
    }));
  }, [shops, coords, usingLocation]);

  const cities = useMemo(
    () => ["All", ...Array.from(new Set(shops.map((s) => s.city))).sort()],
    [shops]
  );

  const filtered = useMemo(() => {
    let list = shopsWithDistance.filter(({ shop, distance }) => {
      const matchesQuery =
        !query ||
        shop.name.toLowerCase().includes(query.toLowerCase()) ||
        shop.area.toLowerCase().includes(query.toLowerCase()) ||
        shop.city.toLowerCase().includes(query.toLowerCase());
      const matchesCity = city === "All" || shop.city === city;
      const matchesOpen = !openOnly || shop.openNow;
      // Radius only applies when we actually have the user's location
      const matchesRadius = !usingLocation || distance <= radiusKm;
      return matchesQuery && matchesCity && matchesOpen && matchesRadius;
    });

    list = [...list].sort((a, b) => {
      if (sort === "nearest") return a.distance - b.distance;
      if (sort === "rating") return b.shop.rating - a.shop.rating;
      return estimatedWaitMinutes(a.shop) - estimatedWaitMinutes(b.shop);
    });
    return list;
  }, [shopsWithDistance, query, city, sort, openOnly, radiusKm, usingLocation]);

  const nearest = usingLocation && filtered.length > 0 ? filtered[0] : null;

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
            nearest
              ? `${nearest.shop.name} · ${formatDistance(nearest.distance)}`
              : null
          }
          onLocate={locate}
        />
      </div>

      {/* Controls */}
      <div className="mx-auto mt-4 max-w-4xl">
        <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-black/5 px-3 py-2.5">
            <Search size={18} className="text-ink/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shop, area or city…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
            />
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

          {/* Radius filter — only meaningful with a real location */}
          {usingLocation && (
            <label className="flex items-center gap-2">
              <span>Within</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="rounded-lg bg-black/5 px-2 py-1 text-sm outline-none"
              >
                {[2, 5, 10, 25, 50].map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </label>
          )}

          <span className="ml-auto">{filtered.length} shops found</span>
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
        <div className="mt-12 text-center text-ink/50">
          {usingLocation ? (
            <>
              No onboarded shops within {radiusKm} km. Try widening the radius
              or searching another city.
            </>
          ) : (
            <>No shops match your search. Try a different city or clear filters.</>
          )}
        </div>
      )}
    </section>
  );
}

function LocationBanner({
  status,
  error,
  nearestLabel,
  onLocate,
}: {
  status: ReturnType<typeof useGeolocation>["status"];
  error: string | null;
  nearestLabel: string | null;
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
          Showing onboarded shops near your location, sorted by distance.
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
