import { notion, queryAll } from "../../lib/notion";

const ENERGY_DB = "2d4f49729dc1445ab0d1cedd4f8e960e"; // 🔋 Energy & Sleep Log

// GET /api/health?key=YOUR_HEALTH_KEY&steps=8450[&date=YYYY-MM-DD]
// Called by an iPhone Shortcuts automation each evening.
// Upserts today's Energy & Sleep row with the step count.
export default async function handler(req, res) {
  const key = process.env.HEALTH_KEY;
  if (!key || req.query.key !== key) return res.status(401).json({ error: "bad key" });

  const steps = Math.round(Number(req.query.steps));
  if (!steps || steps < 0 || steps > 200000) return res.status(400).json({ error: "bad steps" });
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date || "")) ? req.query.date : new Date().toISOString().slice(0, 10);

  try {
    const rows = await queryAll(ENERGY_DB, { filter: { property: "Date", date: { equals: d } } });
    if (rows.length) {
      await notion.pages.update({ page_id: rows[0].id, properties: { Steps: { number: steps } } });
    } else {
      const label = new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
      await notion.pages.create({
        parent: { database_id: ENERGY_DB },
        properties: {
          Day: { title: [{ text: { content: label } }] },
          Date: { date: { start: d } },
          Steps: { number: steps },
        },
      });
    }
    res.status(200).json({ ok: true, steps, date: d });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
