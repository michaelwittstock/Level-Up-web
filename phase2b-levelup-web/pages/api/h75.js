import { notion, DB, H75, titleText, check, queryAll } from "../../lib/notion";

// GET  /api/h75?date=YYYY-MM-DD        -> today's 75 Hard row + 7 items
// POST /api/h75 { id, prop, on }       -> toggles one checkbox
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { id, prop, on } = req.body || {};
      const valid = H75.some(([p]) => p === prop);
      if (!id || !valid) return res.status(400).json({ error: "bad request" });
      await notion.pages.update({
        page_id: id,
        properties: { [prop]: { checkbox: !!on } },
      });
      return res.status(200).json({ ok: true });
    }
    const date = String(req.query.date || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "pass ?date=YYYY-MM-DD" });
    }
    const [rows, allRows] = await Promise.all([
      queryAll(DB.h75, { filter: { property: "Date", date: { equals: date } } }),
      queryAll(DB.h75, { filter: { property: "Date", date: { on_or_before: date } } }),
    ]);
    // overall progress: days elapsed + how many were perfect (all 7 checked)
    const elapsed = allRows.length;
    let perfect = 0;
    for (const r of allRows) {
      if (H75.every(([prop]) => check(r, prop))) perfect++;
    }
    const totals = { elapsed, perfect, total: 75 };
    if (!rows.length) return res.status(200).json({ row: null, totals });
    const p = rows[0];
    res.status(200).json({
      row: {
        id: p.id,
        day: titleText(p),
        items: H75.map(([prop, label]) => ({ prop, label, on: check(p, prop) })),
      },
      totals,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
