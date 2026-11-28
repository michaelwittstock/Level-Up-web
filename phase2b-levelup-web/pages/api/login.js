import { COOKIE, MAX_AGE, sessionToken, safeEqual } from "../../lib/auth";

// POST /api/login { passcode } -> sets the session cookie
// POST /api/login { logout: true } -> clears it
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) return res.status(503).json({ error: "APP_PASSCODE not set" });

  if (req.body?.logout) {
    res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return res.status(200).json({ ok: true });
  }

  if (!safeEqual(req.body?.passcode, passcode)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return res.status(401).json({ error: "wrong passcode" });
  }
  const token = await sessionToken(passcode);
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
  );
  res.status(200).json({ ok: true });
}
