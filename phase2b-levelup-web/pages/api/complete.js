import { notion } from "../../lib/notion";

// POST /api/complete { id } -> marks a task done.
// Tasks (the merged list) uses Lane = Done; the old To-Do list used Status = ✅ Done.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "missing id" });
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const properties = page.properties?.Lane
      ? { Lane: { select: { name: "Done" } } }
      : { Status: { select: { name: "✅ Done" } } };
    await notion.pages.update({ page_id: id, properties });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
