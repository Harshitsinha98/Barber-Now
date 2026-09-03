"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  LoaderCircle,
  MessageCircle,
  MessageSquare,
  PhoneCall,
} from "lucide-react";

type Step = "phone" | "code";
type Channel = "whatsapp" | "sms" | "voice";

const CHANNEL_META: Record<Channel, { label: string; icon: React.ReactNode }> = {
  whatsapp: { label: "WhatsApp", icon: <MessageCircle size={15} /> },
  sms: { label: "SMS", icon: <MessageSquare size={15} /> },
  voice: { label: "Call me", icon: <PhoneCall size={15} /> },
};

export function OtpLogin({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sentChannel, setSentChannel] = useState<string | null>(null);
  const [available, setAvailable] = useState<Channel[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  const phoneValid = /^[6-9]\d{9}$/.test(phone);
  const codeValid = otp.every((d) => d !== "");

  // Discover which fallback channels are configured.
  useEffect(() => {
    fetch("/api/otp/config")
      .then((r) => r.json())
      .then((d) => setAvailable(d.availableChannels ?? []))
      .catch(() => setAvailable([]));
  }, []);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function sendCode(channel?: Channel) {
    setLoading(true);
    setError(null);
    setInfo(null);
    setDevCode(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, ...(channel ? { channel } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send the code.");
        if (data.retryAfter) setCooldown(data.retryAfter);
        return;
      }
      setStep("code");
      setSentChannel(data.channel ?? null);
      setCooldown(30);
      if (data.devCode) {
        setDevCode(data.devCode);
        setInfo("Dev mode: no SMS provider configured — code shown below.");
      } else {
        const label =
          data.channel === "sms"
            ? "SMS"
            : data.channel === "voice" || data.channel === "voice_plivo"
              ? "a phone call"
              : "WhatsApp";
        setInfo(`Code sent via ${label} to +91 ${phone}.`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp.join("") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect code.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  }

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">
              Mobile number
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3 focus-within:border-gold">
              <span className="flex items-center gap-1 text-sm text-ink/60">
                <Phone size={16} /> +91
              </span>
              <input
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                onKeyDown={(e) => e.key === "Enter" && phoneValid && sendCode()}
                placeholder="98765 43210"
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink/30"
              />
            </div>
          </div>
          <button
            disabled={!phoneValid || loading}
            onClick={() => sendCode()}
            className="btn-gold w-full"
          >
            {loading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <>
                Send code <ArrowRight size={16} />
              </>
            )}
          </button>
          <p className="text-center text-xs text-ink/40">
            We&apos;ll send a one-time code via WhatsApp.
          </p>
        </>
      ) : (
        <>
          <div className="flex justify-center gap-2">
            {otp.map((d, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKey(i, e)}
                className="h-13 w-11 rounded-xl border border-black/10 py-3 text-center text-2xl font-bold text-ink outline-none focus:border-gold sm:w-12"
              />
            ))}
          </div>

          {devCode && (
            <p className="rounded-lg bg-amber-50 p-2 text-center text-sm font-mono font-bold text-amber-700">
              {devCode}
            </p>
          )}

          <button
            disabled={!codeValid || loading}
            onClick={verifyCode}
            className="btn-gold w-full"
          >
            {loading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <>
                Verify &amp; continue <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Resend + channel fallback */}
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => setStep("phone")}
              className="text-ink/50 hover:text-ink"
            >
              Change number
            </button>
            <button
              disabled={cooldown > 0 || loading}
              onClick={() => sendCode()}
              className="text-gold-dark hover:text-ink disabled:text-ink/30"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>

          {available.length > 1 && (
            <div className="border-t border-black/5 pt-3">
              <p className="mb-2 text-center text-xs text-ink/40">
                Didn&apos;t get it? Try another way:
              </p>
              <div className="flex justify-center gap-2">
                {available.map((ch) => (
                  <button
                    key={ch}
                    disabled={loading || cooldown > 0}
                    onClick={() => sendCode(ch)}
                    className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-ink/70 hover:border-gold disabled:opacity-40"
                  >
                    {CHANNEL_META[ch].icon}
                    {CHANNEL_META[ch].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {info && <p className="text-center text-xs text-emerald-600">{info}</p>}
      {error && <p className="text-center text-sm text-rose-600">{error}</p>}

      <div className="flex items-center justify-center gap-1.5 text-xs text-ink/40">
        <ShieldCheck size={14} /> Your number stays private &amp; secure.
      </div>
    </div>
  );
}
