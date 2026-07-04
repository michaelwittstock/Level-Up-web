import { DB, titleText, blockChildren, plainText, queryAll } from "../../lib/notion";

// GET /api/flashcards -> { cards: [{book, lesson}] }
// Samples books and pulls their "Key Lessons" bullets. CDN-cached.
export default async function handler(req, res) {
  try {
    const books = await queryAll(DB.library);
    // deterministic-ish daily sample: rotate by day of year so cards vary
    const day = Math.floor(Date.now() / 86400000);
    const shuffled = books
      .map((b, i) => ({ b, k: (i * 2654435761 + day) % 997 }))
      .sort((a, z) => a.k - z.k)
      .slice(0, 8)
      .map((x) => x.b);

    const cards = [];
    for (const p of shuffled) {
      try {
        const blocks = await blockChildren(p.id, 80);
        let inLessons = false;
        for (const b of blocks) {
          const t = b.type;
          if (t?.startsWith("heading")) {
            inLessons = plainText(b[t].rich_text).toLowerCase().includes("key lessons");
            continue;
          }
          if (inLessons && t === "bulleted_list_item") {
            const lesson = plainText(b[t].rich_text);
            if (lesson) cards.push({ book: titleText(p), lesson });
          }
        }
      } catch {}
      if (cards.length > 40) break;
    }
    res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=3600");
    res.status(200).json({ cards });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
