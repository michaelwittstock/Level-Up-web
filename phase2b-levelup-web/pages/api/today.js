import { notion, DB, titleText, text, sel, queryAll } from "../../lib/notion";

// GET /api/today -> { tasks: [...], quote: {...} }
export default async function handler(req, res) {
  try {
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
