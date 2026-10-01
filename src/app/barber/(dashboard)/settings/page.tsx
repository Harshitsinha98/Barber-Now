import { requireBarberShop } from "@/lib/barber";
import { Toggle } from "@/components/barber/Toggle";
import { SettingsForm } from "./SettingsForm";
import { setSongRequests } from "./actions";
import { Music } from "lucide-react";

export default async function SettingsPage() {
  const { shop } = await requireBarberShop();
  // Column only exists after migration 0006.
  const songsReady = typeof shop.accepts_song_requests === "boolean";

  return (
    <div className="max-w-3xl p-5 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Shop settings</h1>
      <p className="mb-6 text-sm text-ink/60">This is what customers see on your shop page.</p>

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
            <Music size={18} />
          </span>
          <div>
            <p className="font-semibold text-ink">Song requests</p>
            <p className="text-xs text-ink/50">
              Let customers request a song while booking. You&apos;ll see it in the live queue with a
              one-tap YouTube link. Requests are never guaranteed.
            </p>
          </div>
        </div>
        {songsReady ? (
          <Toggle
            checked={shop.accepts_song_requests === true}
            labelOn="Accepting"
            labelOff="Off"
            onToggle={setSongRequests}
          />
        ) : (
          <span className="text-xs text-amber-700">Needs database update (migration 0006)</span>
        )}
      </div>

      <SettingsForm shop={shop} />
    </div>
  );
}
