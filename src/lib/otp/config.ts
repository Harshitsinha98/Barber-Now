/**
 * Multi-channel OTP configuration (WhatsApp → SMS → Voice).
 *
 * The whole feature is OFF by default: unless at least one provider is
 * configured, the API reports `enabled: false` and the UI can fall back to
 * email/password. This lets us ship without disrupting anything.
 *
 * All values are read from server-side env vars (never NEXT_PUBLIC_*), so
 * provider secrets never reach the browser.
 */

const bool = (v: string | undefined, def = false) =>
  v == null ? def : v.toLowerCase() !== "false";

export const otpConfig = {
  // ── MSG91 (WhatsApp + SMS + Voice under one auth key) ──────────────
  msg91AuthKey: process.env.MSG91_AUTH_KEY || "",
  msg91SmsTemplateId: process.env.MSG91_SMS_TEMPLATE_ID || "",
  msg91WhatsappTemplateId: process.env.MSG91_WHATSAPP_TEMPLATE_ID || "",
  msg91WhatsappNumber: process.env.MSG91_WHATSAPP_NUMBER || "",
  msg91VoiceTemplateId: process.env.MSG91_VOICE_TEMPLATE_ID || "",

  // ── Direct Meta WhatsApp Cloud API (preferred WhatsApp channel, no BSP) ──
  // Reuse an existing WhatsApp Business number's credentials for now.
  metaWhatsappPhoneNumberId: process.env.WHATSAPP_OTP_PHONE_NUMBER_ID || "",
  metaWhatsappAccessToken: process.env.WHATSAPP_OTP_ACCESS_TOKEN || "",
  metaWhatsappTemplateName: process.env.WHATSAPP_OTP_TEMPLATE_NAME || "",
  metaWhatsappTemplateLang: process.env.WHATSAPP_OTP_TEMPLATE_LANG || "en_US",
  metaGraphApiVersion: process.env.META_GRAPH_API_VERSION || "v22.0",

  // ── Plivo Voice OTP (outbound call + TTS, no DLT needed) ────────────
  plivoAuthId: process.env.PLIVO_AUTH_ID || "",
  plivoAuthToken: process.env.PLIVO_AUTH_TOKEN || "",
  plivoFromNumber: process.env.PLIVO_FROM_NUMBER || "",
  plivoAnswerUrl: process.env.PLIVO_OTP_ANSWER_URL || "",

  // Fallback chain. "whatsapp_meta" = direct Meta; "whatsapp"/"sms"/"voice"
  // = MSG91; "voice_plivo" = Plivo. Default matches the plan: WhatsApp first,
  // then SMS, then voice.
  channelOrder: (
    process.env.OTP_CHANNEL_ORDER || "whatsapp_meta,whatsapp,sms,voice_plivo,voice"
  )
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean),

  // Secret pepper mixed into the OTP hash so a DB leak isn't enough.
  hashPepper: process.env.OTP_HASH_PEPPER || "",

  codeLength: Number(process.env.OTP_CODE_LENGTH) || 6,
  ttlSeconds: Number(process.env.OTP_TTL_SECONDS) || 300, // 5 min
  maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5,
  resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN) || 30,
  maxSendsPerWindow: Number(process.env.OTP_MAX_SENDS_PER_WINDOW) || 5,
  sendWindowSeconds: Number(process.env.OTP_SEND_WINDOW_SECONDS) || 3600, // 1 hr

  // Optional test bypass (e.g. app-store review): fixed number + code.
  testPhone: process.env.OTP_TEST_PHONE || "",
  testCode: process.env.OTP_TEST_CODE || "",

  get metaWhatsappEnabled() {
    return Boolean(
      this.metaWhatsappPhoneNumberId &&
        this.metaWhatsappAccessToken &&
        this.metaWhatsappTemplateName
    );
  },

  /** User-facing channel types actually configured, for "send via …" options. */
  get availableChannels(): Array<"whatsapp" | "sms" | "voice"> {
    const list: Array<"whatsapp" | "sms" | "voice"> = [];
    const whatsappMsg91 = Boolean(
      this.msg91AuthKey && this.msg91WhatsappTemplateId && this.msg91WhatsappNumber
    );
    if (this.metaWhatsappEnabled || whatsappMsg91) list.push("whatsapp");
    if (this.msg91AuthKey && this.msg91SmsTemplateId) list.push("sms");
    if (
      (this.plivoAuthId && this.plivoAuthToken && this.plivoFromNumber) ||
      (this.msg91AuthKey && this.msg91VoiceTemplateId)
    )
      list.push("voice");
    return list;
  },

  get enabled() {
    // Kill-switch: OTP_ENABLED=false forces the feature off.
    if (!bool(process.env.OTP_ENABLED, true)) return false;
    return (
      this.metaWhatsappEnabled ||
      Boolean(this.plivoAuthId && this.plivoAuthToken) ||
      Boolean(this.msg91AuthKey)
    );
  },
};

export type ChannelType = "whatsapp" | "sms" | "voice";
