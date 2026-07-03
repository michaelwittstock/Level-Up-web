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
    // overall progress: days elapsed, perfect days, current + longest perfect streaks
    const sorted = allRows
      .map((r) => ({ d: r.properties?.Date?.date?.start || "", perfect: H75.every(([prop]) => check(r, prop)) }))
      .filter((r) => r.d)
      .sort((a, b) => (a.d < b.d ? -1 : 1));
    const elapsed = sorted.length;
    let perfect = 0, longest = 0, run = 0;
    for (const r of sorted) {
      if (r.perfect) { perfect++; run++; longest = Math.max(longest, run); }
      else run = 0;
    }
    // current streak: consecutive perfect days counting back from the end,
    // ignoring today if it's still in progress (not yet perfect)
    let current = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (i === sorted.length - 1 && sorted[i].d === date && !sorted[i].perfect) continue;
      if (sorted[i].perfect) current++;
      else break;
    }
    // attempt-aware: any PAST day with <7 checks fails the attempt; it restarts the next day.
    // (Notion rows keep their original Day labels — this only changes what we display.)
    let attemptStartIdx = 0, resets = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].d < date && !sorted[i].perfect) { attemptStartIdx = i + 1; resets++; }
    }
    const attemptDay = sorted.length - attemptStartIdx;
    const totals = { elapsed, perfect, total: 75, current, longest, attemptDay, resets };
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
