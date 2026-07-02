import { DB, titleText, text, queryAll } from "../../lib/notion";

// GET /api/quotes?m=Frisella,Grover -> quotes whose Author contains any of the names
export default async function handler(req, res) {
  try {
    const names = String(req.query.m || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
    if (!names.length) return res.status(400).json({ error: "pass ?m=name1,name2" });
    const pages = await queryAll(DB.quotes, {
      filter: { or: names.map((n) => ({ property: "Author", rich_text: { contains: n } })) },
    });
    const quotes = pages
      .map((p) => ({ quote: titleText(p), author: text(p, "Author") }))
      .filter((q) => q.quote);
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    res.status(200).json({ quotes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
