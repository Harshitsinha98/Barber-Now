"use client";

import { useState } from "react";
import type { ServiceRow } from "@/lib/supabase/database.types";
import { formatINR } from "@/lib/utils";
import { ServiceForm } from "./AddServiceForm";
import { categoryLabel } from "@/lib/salon";
import { deleteService, toggleService } from "./actions";
import { Clock, Tag, Trash2, Pencil } from "lucide-react";

export function ServiceRowItem({ s }: { s: ServiceRow }) {
  const [editing, setEditing] = useState(false);
  const discounted =
    s.discount_percent && s.discount_percent > 0
      ? Math.round(s.price * (1 - s.discount_percent / 100))
      : null;

  if (editing) {
    return (
      <div className="bg-gold/5 p-4">
        <ServiceForm initial={s} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 p-4 ${s.is_active ? "" : "opacity-50"}`}>
      <div className="min-w-[160px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-ink">{s.name}</p>
          <span className="badge bg-black/5 text-ink/60">{categoryLabel(s.category)}</span>
          {s.discount_percent ? (
            <span className="badge bg-emerald-50 text-emerald-700">
              <Tag size={10} /> {s.discount_percent}% off
            </span>
          ) : null}
        </div>
        {s.description && <p className="text-xs text-ink/50">{s.description}</p>}
        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/50">
          <Clock size={11} /> {s.duration_minutes} min
        </p>
      </div>

      <div className="text-right">
        {discounted != null && (
          <span className="block text-xs text-ink/40 line-through">{formatINR(s.price)}</span>
        )}
        <span className="font-semibold text-ink">{formatINR(discounted ?? s.price)}</span>
      </div>

      <form action={toggleService}>
        <input type="hidden" name="id" value={s.id} />
        <input type="hidden" name="active" value={String(s.is_active)} />
        <button
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-ink/50"
          }`}
          title={s.is_active ? "Hide from customers" : "Show to customers"}
        >
          {s.is_active ? "Active" : "Hidden"}
        </button>
      </form>

      <button
        onClick={() => setEditing(true)}
        className="rounded-lg p-2 text-ink/40 hover:bg-black/5 hover:text-ink"
        title="Edit"
      >
        <Pencil size={16} />
      </button>

      <form
        action={deleteService}
        onSubmit={(e) => {
          if (!window.confirm(`Delete "${s.name}"?`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={s.id} />
        <button className="rounded-lg p-2 text-ink/40 hover:bg-rose-50 hover:text-rose-600" title="Delete">
          <Trash2 size={16} />
        </button>
      </form>
    </div>
  );
}
