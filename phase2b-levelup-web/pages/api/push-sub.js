import { notion, titleText, queryAll } from "../../lib/notion";

const SUBS_DB = "d284b883c1bb4b09931c195f14397bae"; // 🔔 Push Subscriptions

// GET  /api/push-sub          -> { publicKey } (VAPID public key for the client)
// POST /api/push-sub {sub}    -> stores a push subscription in Notion (deduped)
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
    }
    const sub = req.body?.sub;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res.status(400).json({ error: "bad subscription" });
    }
    const existing = await queryAll(SUBS_DB);
    if (existing.some((p) => titleText(p) === sub.endpoint)) {
      return res.status(200).json({ ok: true, existed: true });
    }
    await notion.pages.create({
      parent: { database_id: SUBS_DB },
      properties: {
        Endpoint: { title: [{ text: { content: sub.endpoint.slice(0, 1900) } }] },
        P256dh: { rich_text: [{ text: { content: sub.keys.p256dh } }] },
        Auth: { rich_text: [{ text: { content: sub.keys.auth } }] },
        Added: { date: { start: new Date().toISOString().slice(0, 10) } },
      },
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
