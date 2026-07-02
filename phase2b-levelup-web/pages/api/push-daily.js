import webpush from "web-push";
import { notion, DB, titleText, text, queryAll } from "../../lib/notion";

const SUBS_DB = "d284b883c1bb4b09931c195f14397bae"; // 🔔 Push Subscriptions

// GET /api/push-daily — called by Vercel Cron each morning.
// Sends one favorite quote to every subscribed device.
export default async function handler(req, res) {
  // If CRON_SECRET is set, only allow Vercel Cron (it sends this header).
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return res.status(500).json({ error: "VAPID keys not configured" });
  webpush.setVapidDetails("mailto:contact@michaelwittstock.com", pub, priv);

  try {
    const favs = await queryAll(DB.quotes, {
      filter: { property: "⭐ Favorite", checkbox: { equals: true } },
    });
    const pool = favs.length ? favs : await queryAll(DB.quotes, {}, 100);
    if (!pool.length) return res.status(200).json({ sent: 0, note: "no quotes" });
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const payload = JSON.stringify({
      title: "⚡ Today's fuel",
      body: `“${titleText(pick)}” — ${text(pick, "Author") || "Unknown"}`,
    });

    const subs = await queryAll(SUBS_DB);
    let sent = 0, removed = 0;
    for (const p of subs) {
      const sub = {
        endpoint: titleText(p),
        keys: { p256dh: text(p, "P256dh"), auth: text(p, "Auth") },
      };
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (e) {
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
