import { FITNESS_PAGE, blockChildren, plainText } from "../../lib/notion";

// GET /api/workouts -> { plans: [{ name, days: [{id, title}] }] }
// Reads the workout plans from the Fitness page (toggles containing day sub-pages).
export default async function handler(req, res) {
  try {
    const top = await blockChildren(FITNESS_PAGE);
    const plans = [];
    for (const b of top) {
      if (b.type === "toggle") {
        const name = plainText(b.toggle.rich_text) || "Workout plan";
        const kids = b.has_children ? await blockChildren(b.id) : [];
        const days = kids
          .filter((k) => k.type === "child_page")
          .map((k) => ({ id: k.id, title: k.child_page.title }));
        if (days.length) plans.push({ name, days });
      }
    }
    res.status(200).json({ plans });
  } catch (e) {
    const hint =
      e.code === "object_not_found" || e.status === 404
        ? "Notion integration can't see the Fitness page — open the 'Michael Wittstock' page in Notion → ••• → Connections → add your Level Up integration."
        : e.message;
    res.status(500).json({ error: hint });
  }
}
