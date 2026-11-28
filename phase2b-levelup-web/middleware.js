import { NextResponse } from "next/server";
import { COOKIE, sessionToken, safeEqual } from "./lib/auth";

// Everything (pages and /api/*) needs the login cookie, except:
const PUBLIC = new Set([
  "/login",
  "/api/login",
  "/share", // public 75 Hard scoreboard, shows no personal data
]);
// These check their own secret (CRON_SECRET / HEALTH_KEY), so the
// cron job and the iPhone Shortcut keep working without the cookie.
const OWN_SECRET = new Set(["/api/push-daily", "/api/push-breathe", "/api/health"]);

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.has(pathname) || OWN_SECRET.has(pathname)) return NextResponse.next();

  const passcode = process.env.APP_PASSCODE;
  if (!passcode) {
    // Fail closed: no passcode configured means nobody gets in.
    return new NextResponse("Level Up is locked: set APP_PASSCODE in Vercel.", { status: 503 });
  }

  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie && safeEqual(cookie, await sessionToken(passcode))) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "?next=" + encodeURIComponent(pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // Skip build assets and the PWA files the browser fetches before login.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-|manifest.json|sw.js).*)"],
};
