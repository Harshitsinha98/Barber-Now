"use client";

import { useTransition } from "react";
import { LoaderCircle } from "lucide-react";

export function Toggle({
  checked,
  onToggle,
  labelOn = "On",
  labelOff = "Off",
}: {
  checked: boolean;
  onToggle: (next: boolean) => Promise<void> | void;
  labelOn?: string;
  labelOff?: string;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void onToggle(!checked))}
      className="flex items-center gap-2"
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
  );
}
