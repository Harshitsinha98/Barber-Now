import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Refreshes the Supabase auth session on every request and guards the
 * /barber/* dashboard routes (must be logged in).
 *
 * IMPORTANT: middleware runs on EVERY request, so it must never throw — a
 * crash here takes the whole site down (MIDDLEWARE_INVOCATION_FAILED on
 * Vercel). If Supabase env vars are missing or the client errors, we fail
 * open and just let the request through.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // If Supabase isn't configured (e.g. env vars not set on the host), skip
  // auth handling entirely rather than crashing the middleware.
  if (!url || !key) {
    return response;
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Protect the barber + admin areas (but not their login pages).
    // Admin *authorisation* (phone allow-list) is checked in the admin layout.
    const area = path.startsWith("/barber") ? "barber" : path.startsWith("/admin") ? "admin" : null;
    const isLogin = path === `/${area}/login`;

    if (area && !isLogin && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${area}/login`;
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch {
    // Never let an auth/network hiccup crash the whole site.
    return response;
  }
}
