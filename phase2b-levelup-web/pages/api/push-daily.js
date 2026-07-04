import webpush from "web-push";
import { notion, DB, H75, titleText, text, sel, check, queryAll } from "../../lib/notion";

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
    const today = new Date().toISOString().slice(0, 10);
    const lines = [];

    // 1) quote of the day
    const favs = await queryAll(DB.quotes, {
      filter: { property: "⭐ Favorite", checkbox: { equals: true } },
    });
    const pool = favs.length ? favs : await queryAll(DB.quotes, {}, 100);
    if (pool.length) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      lines.push(`“${titleText(pick)}” — ${text(pick, "Author") || "Unknown"}`);
    }

    // 2) reminders due today (or overdue), not done
    try {
      const due = await queryAll(DB.reminders, {
        filter: {
          and: [
            { property: "Date", date: { on_or_before: today } },
            { property: "Done", checkbox: { equals: false } },
          ],
        },
      });
      if (due.length) {
        const names = due.slice(0, 3).map(titleText).join(", ");
        lines.push(`⏰ ${due.length} reminder${due.length > 1 ? "s" : ""}: ${names}${due.length > 3 ? "…" : ""}`);
      }
    } catch {}

    // 3) Mila dues
    try {
      const mila = await queryAll(DB.mila);
      const dueM = mila.filter((p) => {
        const last = p.properties?.["Last Done"]?.date?.start;
        const days = last ? Math.floor((new Date(today) - new Date(last)) / 86400000) : Infinity;
        const f = sel(p, "Frequency");
        return f.includes("Daily") ? days >= 1 : f.includes("Weekly") ? days >= 7 : days >= 30;
      });
      if (dueM.length) lines.push(`🐶 Mila: ${dueM.length} due (${dueM.slice(0, 2).map(titleText).join(", ")}${dueM.length > 2 ? "…" : ""})`);
    } catch {}

    // 3.5) 1st of the month: net worth snapshot + cash flow nudge
    try {
      if (new Date(today + "T12:00:00Z").getUTCDate() === 1) {
        const NW_HISTORY = "501d1cc52bdd469383a92ecf0fd571bb";
        const items = await queryAll("081ec9b7fbaf434f8d32c6509d4e3ee1");
        let assets = 0, liabilities = 0;
        for (const p of items) {
          const v = p.properties?.Value?.number || 0;
          if ((sel(p, "Type") || "").includes("Asset")) assets += v; else liabilities += v;
        }
        const label = new Date(today + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric" });
        await notion.pages.create({
          parent: { database_id: NW_HISTORY },
          properties: {
            Month: { title: [{ text: { content: label } }] },
            Date: { date: { start: today } },
            Assets: { number: assets },
            Liabilities: { number: liabilities },
            Net: { number: assets - liabilities },
          },
        });
        lines.push(`🧾 New month: net worth snapshot saved ($${Math.round(assets - liabilities).toLocaleString()}). Log last month's cash flow.`);
      }
    } catch {}

    // 4) Sunday: the coach reviews your week, unprompted
    try {
      if (new Date().getUTCDay() === 0) {
        const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        const week = await queryAll(DB.h75, {
          filter: { and: [{ property: "Date", date: { on_or_after: weekStart } }, { property: "Date", date: { on_or_before: today } }] },
        });
        const perf = week.filter((r) => H75.every(([prop]) => check(r, prop))).length;
        let coachLine = `📊 This week: ${perf}/7 perfect days — full recap lands in Notion at 6pm.`;
        const akey = process.env.ANTHROPIC_API_KEY;
        if (akey) {
          try {
            const r = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: { "x-api-key": akey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
              body: JSON.stringify({
                model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
                max_tokens: 120,
                system: "You are Michael's hard-nosed but supportive coach (Goggins intensity, Jocko discipline). Write a 1-2 sentence Sunday check-in push notification about his 75 Hard week. Plain text, no markdown, no emojis, under 200 characters. Direct, personal, end with a charge for the coming week.",
                messages: [{ role: "user", content: `This week he logged ${perf} perfect days out of 7 on 75 Hard.` }],
              }),
            });
            const j = await r.json();
            const t = (j.content || []).map((c) => c.text || "").join("").trim();
            if (t) coachLine = "🥊 Coach: " + t;
          } catch {}
        }
        lines.push(coachLine);
      }
    } catch {}

    if (!lines.length) return res.status(200).json({ sent: 0, note: "nothing to send" });
    const payload = JSON.stringify({ title: "⚡ Morning fuel", body: lines.join("\n") });

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
