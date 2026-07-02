import { notion, titleText, text, sel, queryAll } from "../../lib/notion";

const MILA_DB = "5c960914323d4abe88744acf3894fb80"; // 🐶 Mila Care

// GET  /api/mila            -> { items: [{id, care, freq, last, notes}] }
// POST /api/mila {id, date} -> sets Last Done
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { id, date } = req.body || {};
      const d = /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? date : new Date().toISOString().slice(0, 10);
      if (!id) return res.status(400).json({ error: "missing id" });
      await notion.pages.update({ page_id: id, properties: { "Last Done": { date: { start: d } } } });
      return res.status(200).json({ ok: true });
    }
    const pages = await queryAll(MILA_DB);
    const items = pages.map((p) => ({
      id: p.id,
      care: titleText(p),
      freq: sel(p, "Frequency"),
      last: p.properties?.["Last Done"]?.date?.start || null,
      notes: text(p, "Notes"),
    }));
    res.status(200).json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
