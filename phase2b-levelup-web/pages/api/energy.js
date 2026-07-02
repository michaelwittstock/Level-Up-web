import { notion } from "../../lib/notion";

const ENERGY_DB = "2d4f49729dc1445ab0d1cedd4f8e960e"; // 🔋 Energy & Sleep Log

// POST /api/energy { sleep, energy, mood, workedOut, notes, date }
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { sleep, weight, energy, mood, workedOut, notes, date } = req.body || {};
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? date : new Date().toISOString().slice(0, 10);
    const label = new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const properties = {
      Day: { title: [{ text: { content: label } }] },
      Date: { date: { start: d } },
      Mood: { select: { name: mood || "🙂 Good" } },
      "Worked out": { checkbox: !!workedOut },
    };
    if (typeof sleep === "number") properties["Sleep (hrs)"] = { number: sleep };
    if (typeof weight === "number" && weight > 0) properties["Weight (lbs)"] = { number: weight };
    if (typeof energy === "number") properties["Energy (1-10)"] = { number: energy };
    if (notes) properties.Notes = { rich_text: [{ text: { content: String(notes).slice(0, 500) } }] };
    await notion.pages.create({ parent: { database_id: ENERGY_DB }, properties });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
