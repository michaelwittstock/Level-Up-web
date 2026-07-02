import { notion, DB, titleText, num, check, queryAll } from "../../lib/notion";

// GET  /api/routines                        -> { routines: [...] }
// POST /api/routines { id, on, streak }     -> toggles Done Today (+streak bump)
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { id, on, streak } = req.body || {};
      if (!id) return res.status(400).json({ error: "missing id" });
      const properties = { "Done Today": { checkbox: !!on } };
      if (on && typeof streak === "number") {
        properties["Streak 🔥"] = { number: streak };
      }
      await notion.pages.update({ page_id: id, properties });
      return res.status(200).json({ ok: true });
    }
    const pages = await queryAll(DB.routines, {
      sorts: [{ property: "Order", direction: "ascending" }],
    });
    const routines = pages.map((p) => ({
      id: p.id,
      habit: titleText(p),
      done: check(p, "Done Today"),
      streak: num(p, "Streak 🔥"),
    }));
    res.status(200).json({ routines });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
