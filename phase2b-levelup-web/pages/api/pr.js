import { notion, titleText, sel, num, queryAll } from "../../lib/notion";

const PR_DB = "0550c16da72644648c91c6b037313e21"; // 🏋️ PR Tracker
const LIFTS = ["Bench", "Squat", "Deadlift", "Overhead Press", "Row", "Other"];

// GET  /api/pr                       -> { entries, bests: {lift: {weight, reps, date}} }
// POST /api/pr {lift, weight, reps}  -> logs an entry; returns { pr: true } if it beats the best
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { lift, weight, reps } = req.body || {};
      if (!LIFTS.includes(lift) || !(weight > 0) || !(reps > 0)) return res.status(400).json({ error: "bad entry" });
      const prev = await queryAll(PR_DB);
      const best = Math.max(0, ...prev.filter((p) => sel(p, "Lift") === lift).map((p) => num(p, "Weight (lbs)")));
      const d = new Date().toISOString().slice(0, 10);
      await notion.pages.create({
        parent: { database_id: PR_DB },
        properties: {
          Entry: { title: [{ text: { content: `${lift} ${weight}×${reps}` } }] },
          Lift: { select: { name: lift } },
          "Weight (lbs)": { number: Number(weight) },
          Reps: { number: Number(reps) },
          Date: { date: { start: d } },
        },
      });
      return res.status(200).json({ ok: true, pr: weight > best, prevBest: best });
    }
    const pages = await queryAll(PR_DB);
    const entries = pages.map((p) => ({
      entry: titleText(p),
      lift: sel(p, "Lift"),
      weight: num(p, "Weight (lbs)"),
      reps: num(p, "Reps"),
      date: p.properties?.Date?.date?.start || "",
    })).sort((a, b) => (a.date < b.date ? 1 : -1));
    const bests = {};
    for (const e of entries) {
      if (!bests[e.lift] || e.weight > bests[e.lift].weight) bests[e.lift] = { weight: e.weight, reps: e.reps, date: e.date };
    }
    res.status(200).json({ entries: entries.slice(0, 20), bests });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
