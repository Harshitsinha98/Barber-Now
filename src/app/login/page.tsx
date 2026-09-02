"use client";

import { useState } from "react";
import Link from "next/link";
import { Scissors, Phone, ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);

  const phoneValid = /^[6-9]\d{9}$/.test(phone);
  const otpValid = otp.every((d) => d !== "");

  function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 3) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  }

  return (
    <div className="container-app flex min-h-[75vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-gold">
              <Scissors size={26} />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold text-ink">
              {step === "phone" ? "Welcome to BarberNow" : "Verify your number"}
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              {step === "phone"
                ? "Sign in with your mobile number to book & track."
                : `Enter the 4-digit code sent to +91 ${phone}`}
            </p>
          </div>

          {step === "phone" ? (
            <div className="space-y-4">
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
                    placeholder="98765 43210"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-ink/30"
                  />
                </div>
              </div>
              <button
                disabled={!phoneValid}
                onClick={() => setStep("otp")}
                className="btn-gold w-full"
              >
                Send OTP <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="h-14 w-14 rounded-xl border border-black/10 text-center text-2xl font-bold text-ink outline-none focus:border-gold"
                  />
                ))}
              </div>
              <button disabled={!otpValid} className="btn-gold w-full">
                Verify &amp; continue <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setStep("phone")}
                className="w-full text-center text-sm text-ink/50 hover:text-ink"
              >
                Change number
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink/40">
            <ShieldCheck size={14} /> Your number stays private &amp; secure.
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-ink/40">
          By continuing you agree to our{" "}
          <Link href="#" className="underline">Terms</Link> &amp;{" "}
          <Link href="#" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
