"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/** Share booking details with family/friends (native share sheet → WhatsApp fallback). */
export function ShareBookingButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "My BarberNow booking", text });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      }
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      /* user closed the share sheet */
    }
  }

  return (
    <button onClick={share} className="btn-outline text-sm">
      {done ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />} Share booking
    </button>
  );
}
