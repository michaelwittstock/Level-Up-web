import { DB, H75, titleText, num, check, queryAll } from "../../lib/notion";

const ENERGY_DB = "2d4f49729dc1445ab0d1cedd4f8e960e";

// POST /api/coach { messages: [{role:"user"|"assistant", content}] }
// -> { reply } — Claude-powered accountability coach with live context.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "Add ANTHROPIC_API_KEY in Vercel to wake the coach" });
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "no messages" });

    // ---- live context (best-effort; never block the chat on a Notion hiccup) ----
    let ctx = "";
    try {
      const today = new Date().toISOString().slice(0, 10);
      const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const [h75Rows, energyRows, goalRows] = await Promise.all([
        queryAll(DB.h75, { filter: { property: "Date", date: { on_or_before: today } } }),
        queryAll(ENERGY_DB, { filter: { property: "Date", date: { on_or_after: since } } }),
        queryAll(DB.goals, { filter: { property: "Status", select: { does_not_equal: "🏆 Achieved" } } }),
      ]);
      const sorted = h75Rows
        .map((r) => ({ d: r.properties?.Date?.date?.start || "", perfect: H75.every(([p]) => check(r, p)) }))
        .filter((r) => r.d)
        .sort((a, b) => (a.d < b.d ? -1 : 1));
      const perfect = sorted.filter((r) => r.perfect).length;
      let current = 0;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (i === sorted.length - 1 && sorted[i].d === today && !sorted[i].perfect) continue;
        if (sorted[i].perfect) current++;
        else break;
      }
      const avg = (a) => (a.length ? Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 10) / 10 : 0);
      const energies = energyRows.map((p) => num(p, "Energy (1-10)")).filter(Boolean);
      const sleeps = energyRows.map((p) => num(p, "Sleep (hrs)")).filter(Boolean);
      const goals = goalRows.slice(0, 6).map((p) => `${titleText(p)} (${num(p, "Progress %")}%)`).join("; ");
      ctx = `\n\nLIVE DATA (today ${today}): 75 Hard — ${sorted.length} days logged, ${perfect} perfect, current streak ${current}. Last 7 days: avg energy ${avg(energies)}/10, avg sleep ${avg(sleeps)}h. Active goals: ${goals || "none set"}.`;
    } catch {}

    const system =
      "You are Michael's personal accountability coach inside his Level Up app. Blend David Goggins intensity with Jocko Willink discipline — but you are ON HIS SIDE. " +
      "Rules: max 120 words. Always end with ONE concrete action he can take in the next hour. Never shame him; a setback gets a reset plan, not guilt. " +
      "He is doing 75 Hard, builds businesses, follows Million Dollar Morning + Warrior Core 4, and has a miniature dachshund, Mila." + ctx;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system,
        messages: messages.slice(-12).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "").slice(0, 1000),
        })),
      }),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message || "Anthropic error");
    res.status(200).json({ reply: (j.content || []).map((c) => c.text || "").join("") });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
