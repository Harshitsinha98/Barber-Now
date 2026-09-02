import type { Shop } from "@/lib/types";
import { estimatedWaitMinutes, waitLabel, queueStatusStyle } from "@/lib/utils";
import { Clock } from "lucide-react";

export function QueueBadge({ shop, size = "sm" }: { shop: Shop; size?: "sm" | "lg" }) {
  const style = queueStatusStyle(shop.queue.status);
  const wait = waitLabel(estimatedWaitMinutes(shop));

  if (size === "lg") {
    return (
      <div className={`flex items-center gap-3 rounded-xl ${style.bg} px-4 py-3`}>
        <span className="relative flex h-3 w-3">
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-60 animate-pulse-dot`}
          />
          <span className={`relative inline-flex h-3 w-3 rounded-full ${style.dot}`} />
        </span>
        <div>
          <p className={`text-sm font-semibold ${style.text}`}>
            {style.label} · {shop.queue.peopleAhead} in queue
          </p>
          <p className="text-xs text-ink/60">Estimated wait {wait}</p>
        </div>
      </div>
    );
  }

  return (
    <span className={`badge ${style.bg} ${style.text}`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-60 animate-pulse-dot`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${style.dot}`} />
      </span>
      <Clock size={12} />
      {wait}
    </span>
  );
}
