import webpush from "web-push";
import { notion, titleText, text, queryAll } from "../../lib/notion";

const SUBS_DB = "d284b883c1bb4b09931c195f14397bae"; // 🔔 Push Subscriptions

// GET /api/push-breathe — Vercel Cron, early afternoon.
// A midday nudge: stop, box-breathe, reset.
export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return res.status(500).json({ error: "VAPID keys not configured" });
  webpush.setVapidDetails("mailto:contact@michaelwittstock.com", pub, priv);

  const NUDGES = [
    "Stop. 5 box-breath cycles. 4 in · 4 hold · 4 out · 4 hold. Then attack.",
    "Midday reset: shoulders down, jaw loose, 5 slow breaths. Open the app → Breathe.",
    "Conscious breathing is your anchor. 90 seconds, right now.",
    "Pressure is a privilege — but breathe first. 5 cycles.",
    "Being — Core 4. Calm the mind for two minutes. Go.",
  ];
  const payload = JSON.stringify({
    title: "🧘 Breathe",
    body: NUDGES[Math.floor(Math.random() * NUDGES.length)],
  });

  try {
    const subs = await queryAll(SUBS_DB);
    let sent = 0, removed = 0;
    for (const p of subs) {
      const sub = { endpoint: titleText(p), keys: { p256dh: text(p, "P256dh"), auth: text(p, "Auth") } };
      try { await webpush.sendNotification(sub, payload); sent++; }
      catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await notion.pages.update({ page_id: p.id, archived: true }).catch(() => {});
          removed++;
        }
      }
    }
    res.status(200).json({ sent, removed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
