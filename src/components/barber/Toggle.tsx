"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export function Toggle({
  checked,
  onToggle,
  labelOn = "On",
  labelOff = "Off",
}: {
  checked: boolean;
  onToggle: (next: boolean) => Promise<{ ok: boolean; error?: string } | void>;
  labelOn?: string;
  labelOff?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await onToggle(!checked);
            if (res && !res.ok) setError(res.error ?? "Something went wrong.");
            router.refresh();
          })
        }
        className="flex items-center gap-2"
        aria-pressed={checked}
      >
        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            checked ? "bg-emerald-500" : "bg-black/20"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              checked ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </span>
        <span className="flex items-center gap-1 text-sm font-medium text-ink">
          {pending && <LoaderCircle size={13} className="animate-spin" />}
          {checked ? labelOn : labelOff}
        </span>
      </button>
      {error && <span className="mt-1 max-w-[220px] text-right text-xs text-rose-600">{error}</span>}
    </div>
  );
}
