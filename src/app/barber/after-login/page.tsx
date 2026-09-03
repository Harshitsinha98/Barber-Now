import { completeBarberLogin } from "../actions";

/**
 * OtpLogin redirects here after a successful barber OTP verification.
 * We finalise the barber role and route to onboarding/dashboard.
 */
export default async function AfterLoginPage() {
  await completeBarberLogin();
  return null;
}
