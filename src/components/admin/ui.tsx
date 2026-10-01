import Link from "next/link";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-ink/60">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const body = (
    <div className="card h-full p-4 transition hover:shadow-premium">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
        <span className="text-gold-dark [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="text-xs text-ink/50">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Filter pills driven by a query-string param. */
export function FilterTabs({
  base,
  param,
  current,
  options,
  extra,
}: {
  base: string;
  param: string;
  current: string;
  options: { value: string; label: string; count?: number }[];
  extra?: Record<string, string | undefined>;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {options.map((o) => {
        const qs = new URLSearchParams();
        Object.entries(extra ?? {}).forEach(([k, v]) => v && qs.set(k, v));
        if (o.value !== "all") qs.set(param, o.value);
        const href = qs.toString() ? `${base}?${qs}` : base;
        const active = current === o.value;
        return (
          <Link
            key={o.value}
            href={href}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              active ? "border-ink bg-ink text-cream" : "border-black/10 bg-white text-ink/70 hover:border-black/30"
            }`}
          >
            {o.label}
            {o.count != null && <span className={active ? "ml-1 text-gold" : "ml-1 text-ink/40"}>{o.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export function SearchBox({ action, defaultValue, placeholder, hidden }: { action: string; defaultValue?: string; placeholder: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form action={action} className="flex">
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-64 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </form>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card p-10 text-center text-sm text-ink/50">{children}</div>;
}
