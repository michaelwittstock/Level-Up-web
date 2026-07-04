import { titleText, queryAll } from "../../lib/notion";

const ALBUM_DB = "14ef44c6e2204db2b8ec66b88feb563c"; // 📸 Mila Album

// GET /api/mila-album -> { photos: [{caption, date, url}] }
// Notion file URLs are signed (~1h) so this must not be CDN-cached long.
export default async function handler(req, res) {
  try {
    const pages = await queryAll(ALBUM_DB);
    const photos = pages
      .map((p) => {
        const files = p.properties?.Photo?.files || [];
        const f = files[0];
        const url = f?.file?.url || f?.external?.url || null;
        return { caption: titleText(p), date: p.properties?.Date?.date?.start || "", url };
      })
      .filter((p) => p.url)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    res.setHeader("Cache-Control", "private, max-age=600");
    res.status(200).json({ photos: photos.slice(0, 30) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
