import { NextResponse } from "next/server";
import { otpConfig } from "@/lib/otp/config";

/** Lets the UI discover whether OTP is live and which channels are available. */
export async function GET() {
  return NextResponse.json({
    enabled: otpConfig.enabled,
    channelOrder: otpConfig.channelOrder,
    availableChannels: otpConfig.availableChannels,
  });
}
