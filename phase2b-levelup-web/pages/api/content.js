import { notion, titleText, text, sel, queryAll } from "../../lib/notion";

const CONTENT_DB = "cfc816e061d44fd5bb9c58cf086c2609"; // ✍️ Content Engine

// GET  /api/content              -> { posts: [...] } (Ideas + Drafted first)
// POST /api/content {id, status} -> set Status (📅 Scheduled / ✅ Posted / ✍️ Drafted)
const ALLOWED = ["💡 Idea", "✍️ Drafted", "📅 Scheduled", "✅ Posted"];

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { id, status } = req.body || {};
      if (!id || !ALLOWED.includes(status)) return res.status(400).json({ error: "bad request" });
      await notion.pages.update({ page_id: id, properties: { Status: { select: { name: status } } } });
      return res.status(200).json({ ok: true });
    }
    const pages = await queryAll(CONTENT_DB);
    const rank = { "💡 Idea": 0, "✍️ Drafted": 1, "📅 Scheduled": 2, "✅ Posted": 3 };
    const posts = pages
      .map((p) => {
        let platforms = [];
        const mp = p.properties?.Platform;
        if (mp?.multi_select) platforms = mp.multi_select.map((o) => o.name);
        return {
          id: p.id,
          hook: titleText(p),
          caption: text(p, "Caption"),
          hashtags: text(p, "Hashtags"),
          source: text(p, "Source"),
          status: sel(p, "Status") || "💡 Idea",
          platforms,
        };
      })
      .sort((a, b) => (rank[a.status] ?? 0) - (rank[b.status] ?? 0));
    res.status(200).json({ posts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
