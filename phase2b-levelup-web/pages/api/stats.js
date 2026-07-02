import { DB, H75, titleText, num, sel, check, queryAll } from "../../lib/notion";

const ENERGY_DB = "2d4f49729dc1445ab0d1cedd4f8e960e";

// GET /api/stats -> 14-day trends { energy: [...], h75: [...] }
export default async function handler(req, res) {
  try {
    const days = Math.min(120, Math.max(7, Number(req.query.days) || 14));
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

    const [energyPages, h75Pages] = await Promise.all([
      queryAll(ENERGY_DB, {
        filter: { property: "Date", date: { on_or_after: since } },
        sorts: [{ property: "Date", direction: "ascending" }],
      }),
      queryAll(DB.h75, {
        filter: { property: "Date", date: { on_or_after: since } },
        sorts: [{ property: "Date", direction: "ascending" }],
      }),
    ]);

    const energy = energyPages.map((p) => ({
      day: titleText(p),
      date: p.properties?.Date?.date?.start || "",
      sleep: num(p, "Sleep (hrs)"),
      energy: num(p, "Energy (1-10)"),
      weight: num(p, "Weight (lbs)"),
      mood: sel(p, "Mood"),
    }));

    const h75 = h75Pages.map((p) => ({
      day: titleText(p),
      date: p.properties?.Date?.date?.start || "",
      done: H75.reduce((s, [prop]) => s + (check(p, prop) ? 1 : 0), 0),
    }));

    res.status(200).json({ energy, h75 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
