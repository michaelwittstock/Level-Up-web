// POST /api/cleanup { text, type } -> { title, area, why, body }
// Turns a voice-note ramble into a structured goal/dream entry via Claude.
const AREAS = ["Health", "Work/Business", "Money", "Relationships", "Growth", "Fun/Adventure"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  const text = String(req.body?.text || "").slice(0, 6000);
  const type = req.body?.type === "dream" ? "dream" : "goal";
  if (text.length < 20) return res.status(400).json({ error: "write or dictate a bit more first" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 700,
        system: `You clean up rambling voice notes into structured ${type} entries for Michael's personal development app. Respond with ONLY valid JSON, no markdown: {"title": "punchy name, max 10 words", "area": one of ${JSON.stringify(AREAS)}, "why": "1-2 sentences on why this matters to him, in first person, drawn from his words", "body": "his thoughts cleaned up: fix grammar, remove filler words and repetition, organize into short paragraphs, KEEP his voice and every distinct idea"}`,
        messages: [{ role: "user", content: text }],
      }),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    const raw = (j.content || []).map((c) => c.text || "").join("");
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    if (!AREAS.includes(parsed.area)) parsed.area = "Growth";
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
