import { notion, DB, PROP } from "../../lib/notion";

// POST /api/complete  { id }  ->  marks a task Done
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "missing id" });
  try {
    await notion.pages.update({
      page_id: id,
      properties: { [PROP.todoStatus]: { select: { name: PROP.doneValue } } },
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
