// GET /api/cover?t=<title>&a=<author> -> 302 redirect to a Google Books thumbnail.
// Cached hard at the CDN so each book is looked up rarely. 404 when no cover found
// (the client falls back to an initials tile).
export default async function handler(req, res) {
  const t = String(req.query.t || "").slice(0, 120);
  const a = String(req.query.a || "").slice(0, 80);
  if (!t) return res.status(400).end();
  try {
    const q = encodeURIComponent(`intitle:${t}${a ? " inauthor:" + a : ""}`);
    const r = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&fields=items(volumeInfo(imageLinks))`
    );
    const j = await r.json();
    const img = j?.items?.[0]?.volumeInfo?.imageLinks;
    let url = img?.thumbnail || img?.smallThumbnail;
    if (!url) {
      res.setHeader("Cache-Control", "public, s-maxage=86400");
      return res.status(404).end();
    }
    url = url.replace("http://", "https://");
    res.setHeader("Cache-Control", "public, s-maxage=2592000, stale-while-revalidate=86400");
    res.redirect(302, url);
  } catch {
    res.status(404).end();
  }
}
