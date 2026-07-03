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
    // attempt-aware: any PAST day (before today) with <7 checks = failed attempt →
    // the challenge restarts the next day. attemptDay = today's day number in the
    // current attempt; resets = how many times it restarted.
    const past = sorted.filter((r) => r.d < date);
    let resets = 0, attemptStart = sorted.length ? sorted[0].d : date;
    for (const r of past) {
      if (!r.perfect) {
        resets++;
        const nxt = new Date(r.d + "T12:00:00Z");
        nxt.setUTCDate(nxt.getUTCDate() + 1);
        attemptStart = nxt.toISOString().slice(0, 10);
      }
    }
    const attemptDay = Math.max(1, Math.min(75, Math.floor((new Date(date) - new Date(attemptStart)) / 86400000) + 1));
    const finish = new Date(new Date(attemptStart + "T12:00:00Z").getTime() + 74 * 86400000).toISOString().slice(0, 10);
    const totals = { elapsed, perfect, total: 75, current, longest, attemptDay, resets, attemptStart, finish };

    // ---- auto-archive: tag every row with its attempt number so Notion can
    // ---- group failed runs ("Attempt 1", "Attempt 2", …) like folders.
    try {
      // attempt number for a date = 1 + failures strictly before that date
      const failDates = past.filter((r) => !r.perfect).map((r) => r.d);
      const attemptOf = (d) => 1 + failDates.filter((f) => f < d).length;
      let updates = 0;
      for (const raw of allRows) {
        if (updates >= 15) break; // stay under serverless time limits; next load continues
        const d = raw.properties?.Date?.date?.start;
        if (!d) continue;
        const want = "Attempt " + attemptOf(d);
        const have = raw.properties?.Attempt?.select?.name || "";
        if (have !== want) {
          await notion.pages.update({ page_id: raw.id, properties: { Attempt: { select: { name: want } } } });
          updates++;
        }
      }
    } catch {}
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
