import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnedShop } from "@/lib/barber";
import type { ServiceRow } from "@/lib/supabase/database.types";
import { PARTNER_PLAN, isActive, daysLeft } from "@/lib/plans";
import { formatINR } from "@/lib/utils";
import { OnboardingForm } from "./OnboardingForm";
import { DocumentsForm, SubmitButton } from "./StepForms";
import { ServiceForm } from "../(dashboard)/services/AddServiceForm";
import { ServiceRowItem } from "../(dashboard)/services/ServiceRowItem";
import { PhotoUploader } from "../(dashboard)/photos/PhotoUploader";
import { PayButton } from "@/components/barber/PayButton";
import {
  Store,
  Scissors,
  ImageIcon,
  FileText,
  BadgeIndianRupee,
  CheckCircle2,
  Circle,
  ArrowRight,
  Clock4,
  XCircle,
  Check,
  LogOut,
} from "lucide-react";
import { logout } from "../actions";

const STEPS = [
  { n: 1, key: "details", title: "Shop details", hint: "Name, location & timings", icon: Store },
  { n: 2, key: "services", title: "Services & prices", hint: "Your rate card", icon: Scissors },
  { n: 3, key: "photos", title: "Photos", hint: "Cover + gallery", icon: ImageIcon },
  { n: 4, key: "documents", title: "Documents", hint: "PAN, GST (optional)", icon: FileText },
  { n: 5, key: "plan", title: "Plan & go live", hint: "₹1,499/month · 0% commission", icon: BadgeIndianRupee },
] as const;

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/barber/login");

  const ctx = await getOwnedShop();
  const shop = ctx?.shop ?? null;
  const status = shop?.onboarding_status;

  // Already approved (or a pre-0007 database) → straight to the dashboard.
  if (shop && (status === "approved" || status === undefined)) redirect("/barber/dashboard");

  const { data: svcData } = shop
    ? await supabase.from("services").select("*").eq("shop_id", shop.id).order("created_at")
    : { data: [] };
  const services = (svcData as ServiceRow[]) ?? [];

  const done: Record<string, boolean> = {
    details: Boolean(shop),
    services: services.some((s) => s.is_active),
    photos: Boolean(shop?.cover_image),
    documents: Boolean(shop?.pan_number),
    plan: isActive(shop?.subscription_until),
  };
  const ready = done.details && done.services && done.photos && done.documents;
  const completed = STEPS.filter((s) => done[s.key]).length;

  const firstOpen = STEPS.find((s) => !done[s.key])?.n ?? 5;
  let step = Number((await searchParams).step) || firstOpen;
  if (!shop) step = 1; // nothing else is possible before the shop exists
  step = Math.min(5, Math.max(1, step));
  const current = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[360px_1fr]">
      {/* ───── Sidebar (steps) ───── */}
      <aside className="relative overflow-hidden bg-ink p-6 text-cream lg:sticky lg:top-0 lg:h-screen lg:p-8">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl font-extrabold">
              barber<span className="text-gradient">now</span>{" "}
              <span className="text-xs font-medium text-cream/50">partner</span>
            </span>
            <form action={logout}>
              <button className="rounded-lg p-2 text-cream/50 hover:text-cream" title="Logout">
                <LogOut size={16} />
              </button>
            </form>
          </div>

          <h1 className="mt-8 font-display text-3xl font-bold leading-tight">
            Get your shop on <span className="text-gradient">BarberNow</span>
          </h1>
          <p className="mt-2 text-sm text-cream/60">Takes about 10 minutes. Keep your PAN handy.</p>

          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-coral transition-all"
              style={{ width: `${(completed / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-cream/50">
            {completed} of {STEPS.length} steps complete
          </p>

          <ol className="no-scrollbar mt-6 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const active = s.n === step;
              const locked = !shop && s.n > 1;
              return (
                <li key={s.key} className="shrink-0">
                  <Link
                    href={locked ? "#" : `/barber/onboarding?step=${s.n}`}
                    aria-disabled={locked}
                    className={`flex items-center gap-3 rounded-2xl p-3 transition ${
                      active ? "bg-white/10 ring-1 ring-gold/40" : "hover:bg-white/5"
                    } ${locked ? "pointer-events-none opacity-40" : ""}`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        done[s.key] ? "bg-emerald-500 text-white" : active ? "bg-gold text-ink" : "bg-white/10 text-cream/60"
                      }`}
                    >
                      {done[s.key] ? <Check size={18} /> : <Icon size={18} />}
                    </span>
                    <span className="hidden min-w-0 sm:block">
                      <span className="block text-sm font-semibold">{s.title}</span>
                      <span className="block truncate text-xs text-cream/50">{s.hint}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          <div className="mt-auto hidden rounded-2xl bg-white/5 p-4 text-xs text-cream/60 lg:block">
            <p className="font-semibold text-cream">Why partners love it</p>
            <p className="mt-1">0% commission · Ads included in the app · Live queue · Paid boosts when you want more customers.</p>
          </div>
        </div>
      </aside>

      {/* ───── Main ───── */}
      <main className="p-5 sm:p-10">
        <div className="mx-auto max-w-3xl">
          {status === "submitted" && <ReviewBanner plan={done.plan} until={shop?.subscription_until} />}
          {status === "rejected" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <XCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Changes needed before we can approve your shop</p>
                <p className="mt-1">{shop?.rejection_reason || "Please review your details and resubmit."}</p>
              </div>
            </div>
          )}

          <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">Step {step} of 5</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-ink sm:text-4xl">{current.title}</h2>
          <p className="mb-8 text-ink/60">{STEP_COPY[current.key]}</p>

          <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-card sm:p-8">
            {step === 1 && <OnboardingForm shop={shop} />}

            {step === 2 && shop && (
              <div className="space-y-6">
                <ServiceForm salonType={shop.salon_type} />
                {services.length > 0 && (
                  <div className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5">
                    {services.map((s) => (
                      <ServiceRowItem key={s.id} s={s} />
                    ))}
                  </div>
                )}
                <NextLink show={done.services} to={3} />
              </div>
            )}

            {step === 3 && shop && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">Cover photo *</p>
                    <p className="text-xs text-ink/50">Your shop front or best interior shot. Landscape works best.</p>
                  </div>
                  <PhotoUploader shopId={shop.id} target="cover" />
                </div>
                <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-black/5">
                  {shop.cover_image ? (
                    <Image src={shop.cover_image} alt="Cover" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-ink/40">No cover yet</div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-6">
                  <div>
                    <p className="font-semibold text-ink">Gallery ({shop.gallery?.length ?? 0})</p>
                    <p className="text-xs text-ink/50">Haircuts you&apos;re proud of, chairs, interiors. 4+ photos get more bookings.</p>
                  </div>
                  <PhotoUploader shopId={shop.id} target="gallery" />
                </div>
                {shop.gallery?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {shop.gallery.map((g) => (
                      <div key={g} className="relative aspect-square overflow-hidden rounded-xl">
                        <Image src={g} alt="" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <NextLink show={done.photos} to={4} />
              </div>
            )}

            {step === 4 && shop && ctx && (
              <DocumentsForm userId={ctx.user.id} pan={shop.pan_number} gstin={shop.gstin} hasDoc={Boolean(shop.kyc_doc_path)} />
            )}

            {step === 5 && shop && (
              <div className="space-y-8">
                <PlanCard active={done.plan} until={shop.subscription_until} />

                <div className="rounded-2xl bg-black/[0.03] p-5">
                  <p className="mb-3 text-sm font-semibold text-ink">Before you submit</p>
                  <ul className="mb-5 space-y-2 text-sm">
                    {STEPS.slice(0, 4).map((s) => (
                      <li key={s.key} className="flex items-center gap-2">
                        {done[s.key] ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-ink/30" />}
                        <Link href={`/barber/onboarding?step=${s.n}`} className={done[s.key] ? "text-ink/60" : "font-medium text-ink underline"}>
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {status === "submitted" ? (
                    <p className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">
                      <Clock4 size={16} /> Submitted — our team is reviewing your shop.
                    </p>
                  ) : (
                    <SubmitButton ready={ready} />
                  )}
                  <p className="mt-3 text-center text-xs text-ink/50">
                    Your shop goes live once it&apos;s verified <b>and</b> the plan is active. You can pay now or after approval.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const STEP_COPY: Record<string, string> = {
  details: "Tell customers who you are and where to find you.",
  services: "Add what you offer with prices. Use quick-add to set up in seconds — you can edit anytime.",
  photos: "Shops with good photos get up to 3× more bookings.",
  documents: "We verify every partner so customers can trust BarberNow. Your documents stay private.",
  plan: "One simple plan. No commission on any service — ever.",
};

function NextLink({ show, to }: { show: boolean; to: number }) {
  if (!show) return null;
  return (
    <Link href={`/barber/onboarding?step=${to}`} className="btn-gold py-3.5 sm:px-10">
      Continue <ArrowRight size={16} />
    </Link>
  );
}

function PlanCard({ active, until }: { active: boolean; until?: string | null }) {
  const p = PARTNER_PLAN;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-cream sm:p-8">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/25 blur-3xl" />
      <div className="relative">
        <span className="glass inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
          {p.name}
        </span>
        <div className="mt-4 flex items-end gap-2">
          <span className="font-display text-5xl font-extrabold">{formatINR(p.price)}</span>
          <span className="mb-1.5 text-cream/60">/ month</span>
        </div>
        <p className="mt-1 text-sm text-cream/60">{p.tagline} Prices include GST.</p>
        <ul className="mt-6 grid gap-2.5 text-sm sm:grid-cols-2">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-gold" /> {f}
            </li>
          ))}
        </ul>
        <div className="mt-7 max-w-xs">
          {active ? (
            <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300">
              ✓ Plan active · {daysLeft(until)} days left
            </p>
          ) : (
            <PayButton planCode={p.code} label={`Pay ${formatINR(p.price)} & activate`} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewBanner({ plan, until }: { plan: boolean; until?: string | null }) {
  return (
    <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-gold via-[#ff8a3d] to-coral p-6 text-ink">
      <p className="flex items-center gap-2 font-display text-2xl font-bold">
        <Clock4 size={22} /> Under review
      </p>
      <p className="mt-1 text-sm text-ink/75">
        We usually verify shops within 24 hours. You can still edit anything below.
        {plan
          ? ` Your plan is active (${daysLeft(until)} days) — you'll go live as soon as we approve.`
          : " Activate your plan in step 5 so you go live the moment we approve."}
      </p>
    </div>
  );
}
