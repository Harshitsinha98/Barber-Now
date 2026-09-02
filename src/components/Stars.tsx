import { Star } from "lucide-react";

export function Stars({
  rating,
  size = 14,
  showValue = false,
  count,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
  count?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-white">
        <span className="text-xs font-bold">{rating.toFixed(1)}</span>
        <Star size={size - 3} className="fill-white" />
      </span>
      {showValue && count != null && (
        <span className="text-xs text-ink/50">({count.toLocaleString("en-IN")})</span>
      )}
    </span>
  );
}
