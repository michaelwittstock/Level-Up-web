import { notion, DB, titleText, sel, num, queryAll } from "../../lib/notion";

// GET  /api/reflect                                  -> { goals: [...] }
// POST /api/reflect { grateful, win, mood, date }    -> logs a Gratitude & Wins entry
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { grateful, win, mood, date, goalId, pct } = req.body || {};
      // goal progress update
      if (goalId !== undefined) {
        const n = Math.max(0, Math.min(100, Number(pct)));
        if (!goalId || isNaN(n)) return res.status(400).json({ error: "bad goal update" });
        await notion.pages.update({ page_id: goalId, properties: { "Progress %": { number: n } } });
        return res.status(200).json({ ok: true });
      }
      if (!grateful && !win) return res.status(400).json({ error: "empty" });
      const properties = {
        "Grateful For": {
          title: [{ text: { content: grateful || "(a quiet good moment)" } }],
        },
        "Win of the Day 🏆": { rich_text: [{ text: { content: win || "" } }] },
        Mood: { select: { name: mood || "🙂 Good" } },
      };
      const d = (date || "").slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) properties.Date = { date: { start: d } };
      await notion.pages.create({ parent: { database_id: DB.grat }, properties });
      return res.status(200).json({ ok: true });
    }
    const pages = await queryAll(DB.goals, {
      filter: { property: "Status", select: { does_not_equal: "🏆 Achieved" } },
    });
    const goals = pages.map((p) => ({
      id: p.id,
      goal: titleText(p),
      status: sel(p, "Status"),
      pct: num(p, "Progress %"),
    }));
    res.status(200).json({ goals });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
