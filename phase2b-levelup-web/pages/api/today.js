import { notion, DB, titleText, text, sel, queryAll } from "../../lib/notion";

// GET  /api/today                  -> { tasks: [...], quote: {...} }
// POST /api/today {title, status}  -> creates a task (🔥 Today or 🧠 Brain Dump)
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { title, status } = req.body || {};
      if (!title?.trim()) return res.status(400).json({ error: "missing title" });
      const st = status === "🧠 Brain Dump" ? "🧠 Brain Dump" : "🔥 Today";
      const page = await notion.pages.create({
        parent: { database_id: DB.todo },
        properties: {
          Task: { title: [{ text: { content: title.trim().slice(0, 200) } }] },
          Status: { select: { name: st } },
        },
      });
      return res.status(200).json({ ok: true, id: page.id });
    }
    const taskPages = await queryAll(DB.todo, {
      filter: { property: "Status", select: { equals: "🔥 Today" } },
    });
    const tasks = taskPages.map((p) => ({
      id: p.id,
      title: titleText(p),
      step: text(p, "Smallest Next Step"),
      priority: sel(p, "Priority"),
      energy: sel(p, "Energy"),
    }));

    const favs = await queryAll(DB.quotes, {
      filter: { property: "⭐ Favorite", checkbox: { equals: true } },
    });
    const pool = favs.length
      ? favs
      : await queryAll(DB.quotes, {}, 100);
    const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    const quote = pick ? { quote: titleText(pick), author: text(pick, "Author") } : null;

    res.status(200).json({ tasks, quote });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
