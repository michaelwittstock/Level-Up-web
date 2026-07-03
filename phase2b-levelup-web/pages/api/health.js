import { notion } from "../../lib/notion";

const ENERGY_DB = "2d4f49729dc1445ab0d1cedd4f8e960e";

// GET or POST /api/health?key=SECRET&steps=8500[&date=YYYY-MM-DD]
// iPhone Health bridge: an iOS Shortcuts automation calls this nightly with the
// day's step count. Upserts the "Steps" column on that day's Energy & Sleep row.
export default async function handler(req, res) {
  try {
    const q = { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
    const secret = process.env.HEALTH_KEY;
    if (!secret) return res.status(500).json({ error: "Set HEALTH_KEY in Vercel first (any random string)" });
    if (q.key !== secret) return res.status(401).json({ error: "bad key" });
    const steps = Math.round(Number(q.steps));
    if (!steps || isNaN(steps) || steps < 0) return res.status(400).json({ error: "pass steps=NUMBER" });
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(q.date || "")) ? q.date : new Date().toISOString().slice(0, 10);

    const existing = await notion.databases.query({
      database_id: ENERGY_DB,
      page_size: 1,
      filter: { property: "Date", date: { equals: d } },
    });
    if (existing.results.length) {
      await notion.pages.update({ page_id: existing.results[0].id, properties: { Steps: { number: steps } } });
      return res.status(200).json({ ok: true, mode: "updated", date: d, steps });
    }
    const label = new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
    await notion.pages.create({
      parent: { database_id: ENERGY_DB },
      properties: {
        Day: { title: [{ text: { content: label } }] },
        Date: { date: { start: d } },
        Steps: { number: steps },
      },
    });
    res.status(200).json({ ok: true, mode: "created", date: d, steps });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
