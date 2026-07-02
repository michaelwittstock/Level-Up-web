import { notion, DB } from "../../lib/notion";

// POST /api/journal { type: 'goal'|'dream', title, area, why, body }
// Creates a page in 🎯 Goals & Dreams with the journaling text as page content.
const AREAS = ["Health", "Work/Business", "Money", "Relationships", "Growth", "Fun/Adventure"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { type, title, area, why, body } = req.body || {};
    if (!title || !["goal", "dream"].includes(type)) return res.status(400).json({ error: "bad request" });

    const properties = {
      Goal: { title: [{ text: { content: String(title).slice(0, 180) } }] },
      Status: { select: { name: type === "dream" ? "💭 Dreaming" : "🎯 Active" } },
      "Progress %": { number: 0 },
    };
    if (AREAS.includes(area)) properties.Area = { select: { name: area } };
    if (why) properties["Why this matters"] = { rich_text: [{ text: { content: String(why).slice(0, 900) } }] };

    const children = [];
    const stamp = new Date().toISOString().slice(0, 10);
    if (body) {
      children.push({ heading_3: { rich_text: [{ text: { content: "📝 Journal — " + stamp } }] } });
      // split long text into <=1800-char paragraph blocks (Notion caps ~2000/rich text)
      const chunks = String(body).match(/[\s\S]{1,1800}/g) || [];
      for (const c of chunks) children.push({ paragraph: { rich_text: [{ text: { content: c } }] } });
    }

    await notion.pages.create({ parent: { database_id: DB.goals }, properties, children });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
