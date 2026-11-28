// Login gate shared by middleware.js and /api/login.
// The session cookie holds an HMAC of a fixed label keyed by APP_PASSCODE,
// so the passcode itself never sits in the cookie, and changing APP_PASSCODE
// in Vercel signs every device out.

export const COOKIE = "lu_session";
export const MAX_AGE = 60 * 60 * 24 * 365; // one year

const LABEL = "levelup-session-v1";

export async function sessionToken(passcode) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(LABEL));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time string compare.
export function safeEqual(a, b) {
  a = String(a || "");
  b = String(b || "");
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
