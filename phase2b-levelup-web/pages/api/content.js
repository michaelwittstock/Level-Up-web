// Retired in v5.1 — the Content tab was removed. Kept as a stub so old clients fail gracefully.
export default function handler(req, res) {
  res.status(410).json({ error: "Content tab was removed in v5.1" });
}
