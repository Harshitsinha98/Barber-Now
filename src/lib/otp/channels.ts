/**
 * OTP delivery channels — WhatsApp, SMS, Voice.
 *
 * Each sender returns { ok, skipped?, error? }:
 *   - ok:true            → provider accepted the request
 *   - ok:false, skipped  → this channel isn't configured; try the next one
 *   - ok:false, error    → provider rejected it; try the next one
 *
 * `sendViaChannels` walks `otpConfig.channelOrder` and stops at the first
 * channel that returns ok:true — giving WhatsApp-first with SMS/voice fallback
 * without any channel being a hard dependency.
 *
 * Adapted for BarberNow from the SNS-ADS-ERP reference implementation.
 */
import { otpConfig, type ChannelType } from "./config";

const MSG91_BASE = "https://control.msg91.com/api/v5";

type SendResult = { ok: boolean; skipped?: boolean; error?: string };

/** Bare digits with country code, e.g. 919876543210. */
function toDigits(e164: string): string {
  return String(e164 || "").replace(/\D/g, "");
}

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown
) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data as { type?: string })?.type === "error") {
    throw new Error(
      (data as { message?: string })?.message || `Provider responded ${res.status}`
    );
  }
  return data;
}

/** WhatsApp OTP via Meta's WhatsApp Cloud API directly (preferred, no BSP). */
async function sendWhatsAppViaMeta(e164: string, code: string): Promise<SendResult> {
  const {
    metaWhatsappPhoneNumberId,
    metaWhatsappAccessToken,
    metaWhatsappTemplateName,
    metaWhatsappTemplateLang,
    metaGraphApiVersion,
  } = otpConfig;
  if (!metaWhatsappPhoneNumberId || !metaWhatsappAccessToken || !metaWhatsappTemplateName) {
    return { ok: false, skipped: true };
  }
  try {
    await postJson(
      `https://graph.facebook.com/${metaGraphApiVersion}/${metaWhatsappPhoneNumberId}/messages`,
      { Authorization: `Bearer ${metaWhatsappAccessToken}` },
      {
        messaging_product: "whatsapp",
        to: toDigits(e164),
        type: "template",
        template: {
          name: metaWhatsappTemplateName,
          language: { code: metaWhatsappTemplateLang },
          components: [
            { type: "body", parameters: [{ type: "text", text: code }] },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      }
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** WhatsApp OTP via MSG91. */
async function sendWhatsAppViaMsg91(e164: string, code: string): Promise<SendResult> {
  const { msg91AuthKey, msg91WhatsappTemplateId, msg91WhatsappNumber } = otpConfig;
  if (!msg91AuthKey || !msg91WhatsappTemplateId || !msg91WhatsappNumber) {
    return { ok: false, skipped: true };
  }
  try {
    await postJson(
      `${MSG91_BASE}/whatsapp/whatsapp-outbound-message/bulk/`,
      { authkey: msg91AuthKey },
      {
        integrated_number: msg91WhatsappNumber,
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: msg91WhatsappTemplateId,
            language: { code: "en", policy: "deterministic" },
            to_and_components: [
              { to: [toDigits(e164)], components: { body_1: { type: "text", value: code } } },
            ],
          },
        },
      }
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** SMS OTP via MSG91 OTP API. */
async function sendSMSViaMsg91(e164: string, code: string): Promise<SendResult> {
  const { msg91AuthKey, msg91SmsTemplateId } = otpConfig;
  if (!msg91AuthKey || !msg91SmsTemplateId) return { ok: false, skipped: true };
  try {
    const params = new URLSearchParams({
      template_id: msg91SmsTemplateId,
      mobile: toDigits(e164),
      otp: code,
      authkey: msg91AuthKey,
    });
    const res = await fetch(`${MSG91_BASE}/otp?${params.toString()}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data as { type?: string })?.type === "error") {
      throw new Error((data as { message?: string })?.message || `SMS provider ${res.status}`);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Voice-call OTP via Plivo (outbound call with TTS, no DLT needed). */
async function sendVoiceViaPlivo(e164: string, code: string): Promise<SendResult> {
  const { plivoAuthId, plivoAuthToken, plivoFromNumber, plivoAnswerUrl } = otpConfig;
  if (!plivoAuthId || !plivoAuthToken || !plivoFromNumber || !plivoAnswerUrl) {
    return { ok: false, skipped: true };
  }
  try {
    const to = toDigits(e164);
    const from = toDigits(plivoFromNumber);
    const spokenCode = code.split("").join(". "); // "1. 2. 3. 4. 5. 6"
    const answerUrl = `${plivoAnswerUrl}?code=${encodeURIComponent(spokenCode)}`;
    const auth = Buffer.from(`${plivoAuthId}:${plivoAuthToken}`).toString("base64");

    const res = await fetch(`https://api.plivo.com/v1/Account/${plivoAuthId}/Call/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        from,
        to,
        answer_url: answerUrl,
        answer_method: "GET",
        time_limit: 59, // auto-hangup — prevents runaway billing
        ring_timeout: 30,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data as { error?: string })?.error) {
      throw new Error(
        (data as { error?: string })?.error || `Plivo responded ${res.status}`
      );
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Voice-call OTP via MSG91. */
async function sendVoiceViaMsg91(e164: string, code: string): Promise<SendResult> {
  const { msg91AuthKey, msg91VoiceTemplateId } = otpConfig;
  if (!msg91AuthKey || !msg91VoiceTemplateId) return { ok: false, skipped: true };
  try {
    const params = new URLSearchParams({
      template_id: msg91VoiceTemplateId,
      mobile: toDigits(e164),
      otp: code,
      authkey: msg91AuthKey,
      otp_via: "voice",
    });
    const res = await fetch(`${MSG91_BASE}/otp?${params.toString()}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data as { type?: string })?.type === "error") {
      throw new Error((data as { message?: string })?.message || `Voice provider ${res.status}`);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const SENDERS: Record<string, (e164: string, code: string) => Promise<SendResult>> = {
  whatsapp_meta: sendWhatsAppViaMeta, // direct Meta Cloud API (preferred)
  whatsapp: sendWhatsAppViaMsg91, // MSG91 WhatsApp
  sms: sendSMSViaMsg91, // MSG91 SMS
  voice_plivo: sendVoiceViaPlivo, // Plivo voice (no DLT)
  voice: sendVoiceViaMsg91, // MSG91 voice
};

/** Map a user-facing type to internal sender keys. */
function matchesType(channel: string, type: ChannelType): boolean {
  if (type === "whatsapp") return channel === "whatsapp_meta" || channel === "whatsapp";
  if (type === "voice") return channel === "voice_plivo" || channel === "voice";
  return channel === type;
}

/**
 * Try configured channels in order; return the first that succeeds.
 * When `only` is set, restrict to that user-facing type (used for the
 * "didn't get it? send SMS / call me" fallback buttons).
 */
export async function sendViaChannels(
  e164: string,
  code: string,
  only: ChannelType | null = null
): Promise<{ ok: boolean; channel?: string; tried: string[] }> {
  const order = only
    ? otpConfig.channelOrder.filter((c) => matchesType(c, only))
    : otpConfig.channelOrder;
  const tried: string[] = [];
  for (const channel of order) {
    const sender = SENDERS[channel];
    if (!sender) continue;
    const result = await sender(e164, code);
    tried.push(channel);
    if (result.ok) return { ok: true, channel, tried };
  }
  return { ok: false, tried };
}
