"use client";

import { useMemo, useState } from "react";
import type { Shop } from "@/lib/types";
import { ShopCard } from "./ShopCard";
import { estimatedWaitMinutes } from "@/lib/utils";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";

type SortKey = "nearest" | "rating" | "wait";

export function DiscoverSection({ shops }: { shops: Shop[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("nearest");
  const [openOnly, setOpenOnly] = useState(false);

  const cities = useMemo(
    () => ["All", ...Array.from(new Set(shops.map((s) => s.city))).sort()],
    [shops]
  );

  const filtered = useMemo(() => {
    let list = shops.filter((s) => {
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.area.toLowerCase().includes(query.toLowerCase()) ||
        s.city.toLowerCase().includes(query.toLowerCase());
      const matchesCity = city === "All" || s.city === city;
      const matchesOpen = !openOnly || s.openNow;
      return matchesQuery && matchesCity && matchesOpen;
    });

    list = [...list].sort((a, b) => {
      if (sort === "nearest") return a.distanceKm - b.distanceKm;
      if (sort === "rating") return b.rating - a.rating;
      return estimatedWaitMinutes(a) - estimatedWaitMinutes(b);
    });
    return list;
  }, [shops, query, city, sort, openOnly]);

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

      {/* Controls */}
      <div className="mx-auto mt-8 max-w-4xl">
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

        <div className="mt-3 flex items-center gap-3 text-sm text-ink/60">
          <SlidersHorizontal size={14} />
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            Open now
          </label>
          <span className="ml-auto">{filtered.length} shops found</span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center text-ink/50">
          No shops match your search. Try a different city or clear filters.
        </div>
      )}
    </section>
  );
}
