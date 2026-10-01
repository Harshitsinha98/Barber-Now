"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";

const PLAN = 1499;

/** "How much would a commission app take?" — illustrative comparison. */
export function CommissionCalculator() {
  const [customers, setCustomers] = useState(300);
  const [ticket, setTicket] = useState(400);
  const [rate, setRate] = useState(20);

  const revenue = customers * ticket;
  const commission = Math.round((revenue * rate) / 100);
  const saved = Math.max(0, commission - PLAN);

  return (
    <div className="grid gap-8 rounded-[2rem] border border-black/5 bg-white p-6 shadow-card sm:p-10 lg:grid-cols-2">
      <div className="space-y-6">
        <Slider label="Online customers per month" value={customers} min={50} max={1500} step={10} onChange={setCustomers} format={(v) => String(v)} />
        <Slider label="Average bill per customer" value={ticket} min={100} max={3000} step={50} onChange={setTicket} format={formatINR} />
        <Slider label="Commission a typical booking app charges" value={rate} min={10} max={30} step={1} onChange={setRate} format={(v) => `${v}%`} />
        <p className="text-xs text-ink/40">Illustrative estimate. Commission rates vary by app and city.</p>
      </div>

      <div className="flex flex-col justify-center gap-4">
        <Row label="Your monthly revenue" value={formatINR(revenue)} />
        <Row label={`Commission app takes (${rate}%)`} value={`− ${formatINR(commission)}`} tone="bad" />
        <Row label="BarberNow (flat, 0% commission)" value={`− ${formatINR(PLAN)}`} tone="good" />
        <div className="rounded-2xl bg-gradient-to-br from-gold via-[#ff8a3d] to-coral p-5 text-ink">
          <p className="text-sm font-medium text-ink/70">You keep extra every month</p>
          <p className="font-display text-4xl font-extrabold">{formatINR(saved)}</p>
          <p className="text-xs text-ink/70">≈ {formatINR(saved * 12)} a year</p>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink/70">{label}</span>
        <span className="font-display text-lg font-bold text-ink">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#ff8a3d]"
      />
    </label>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 pb-3 text-sm">
      <span className="text-ink/60">{label}</span>
      <span className={`font-semibold ${tone === "bad" ? "text-rose-600" : tone === "good" ? "text-emerald-600" : "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}
