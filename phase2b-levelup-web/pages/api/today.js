import { notion, DB, PROP, titleText, richText } from "../../lib/notion";

// GET /api/today  ->  { tasks: [...], quote: {...} }
export default async function handler(req, res) {
  try {
    // Today's open tasks (Status != Done).
    const tasks = await notion.databases.query({ database_id: DB.todo, page_size: 25 });
    const open = tasks.results
      .filter((p) => {
        const val = p.properties?.[PROP.todoStatus]?.select?.name || "";
        return val !== PROP.doneValue;
      })
      .map((p) => ({ id: p.id, title: titleText(p) }));

    // A random favorite quote (falls back to any quote).
    const q = await notion.databases.query({ database_id: DB.quotes, page_size: 100 });
    const all = q.results
      .map((p) => ({
        quote: richText(p.properties?.[PROP.quote]),
        author: richText(p.properties?.[PROP.author]),
        fav: !!p.properties?.[PROP.favorite]?.checkbox,
      }))
      .filter((x) => x.quote);
    const favs = all.filter((x) => x.fav);
    const pool = favs.length ? favs : all;
    const quote = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;

    res.status(200).json({ tasks: open, quote });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
