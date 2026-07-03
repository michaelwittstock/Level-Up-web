import { DB, H75, titleText, num, sel, check, queryAll } from "../../lib/notion";

const ENERGY_DB = "2d4f49729dc1445ab0d1cedd4f8e960e";

// POST /api/coach { messages: [{role, content}...] } -> { reply }
// The coach sees live context: goals, 75 Hard streak, recent energy.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "Add ANTHROPIC_API_KEY in Vercel to wake the coach." });

  try {
    const messages = (req.body?.messages || []).slice(-10).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 1500),
    }));
    if (!messages.length) return res.status(400).json({ error: "say something" });

    // live context (best-effort; coach still works if any fetch fails)
    let ctx = "";
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [goals, rows, energy] = await Promise.all([
        queryAll(DB.goals, { filter: { property: "Status", select: { does_not_equal: "🏆 Achieved" } } }),
        queryAll(DB.h75, { filter: { property: "Date", date: { on_or_before: today } } }),
        queryAll(ENERGY_DB, { filter: { property: "Date", date: { on_or_after: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10) } } }),
      ]);
      const sorted = rows.map((r) => ({ d: r.properties?.Date?.date?.start, p: H75.every(([x]) => check(r, x)) })).filter((r) => r.d).sort((a, b) => (a.d < b.d ? -1 : 1));
      let streak = 0;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (i === sorted.length - 1 && sorted[i].d === today && !sorted[i].p) continue;
        if (sorted[i].p) streak++; else break;
      }
      const perfect = sorted.filter((r) => r.p).length;
      // attempt-aware day: a missed past day restarts the challenge
      const past = sorted.filter((r) => r.d < today);
      let resets = 0, attemptStart = sorted.length ? sorted[0].d : today;
      for (const r of past) {
        if (!r.p) {
          resets++;
          const nxt = new Date(r.d + "T12:00:00Z");
          nxt.setUTCDate(nxt.getUTCDate() + 1);
          attemptStart = nxt.toISOString().slice(0, 10);
        }
      }
      const attemptDay = Math.max(1, Math.min(75, Math.floor((new Date(today) - new Date(attemptStart)) / 86400000) + 1));
      const avgE = energy.length ? (energy.reduce((s, p) => s + num(p, "Energy (1-10)"), 0) / energy.length).toFixed(1) : "no data";
      const avgS = energy.length ? (energy.reduce((s, p) => s + num(p, "Sleep (hrs)"), 0) / energy.length).toFixed(1) : "no data";
      ctx = `Michael's live data: 75 Hard — day ${attemptDay} of 75 on attempt #${resets + 1}${resets ? ` (he failed and restarted ${resets}x — respect the restart, it means he didn't quit)` : ""}, ${perfect} total perfect days, current streak ${streak}. Last-7-days avg energy ${avgE}/10, avg sleep ${avgS}h. Goals: ${goals.slice(0, 6).map((g) => `${titleText(g)} (${num(g, "Progress %")}%)`).join("; ") || "none set"}.`;
    } catch {}

    const system = `You are Michael's personal coach inside his "Level Up" app — think David Goggins' intensity with Jocko Willink's discipline, but you're on HIS side. Rules: be direct, punchy, no fluff, max ~120 words. PLAIN TEXT ONLY — no markdown, no asterisks, no headers, no bullet symbols; short paragraphs and line breaks only. Use his real numbers when relevant. Call out excuses, then give ONE concrete next action. Never shame — push. Occasionally reference: extreme ownership, discipline equals freedom, staying hard, the 40% rule. He's doing 75 Hard, building a business (Wittstock Digital), and has a mini dachshund Mila. ${ctx}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system,
        messages,
      }),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message || "API error");
    const reply = (j.content || []).map((c) => c.text || "").join("").trim();
    res.status(200).json({ reply: reply || "…locked in. Go work." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
