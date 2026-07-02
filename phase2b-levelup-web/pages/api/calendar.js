// GET /api/calendar -> { events: [...] } from a Google Calendar secret ICS URL.
// Setup: Google Calendar → Settings → (your calendar) → "Integrate calendar" →
// copy "Secret address in iCal format" → add as GOOGLE_CAL_ICS env var in Vercel.
export default async function handler(req, res) {
  const url = process.env.GOOGLE_CAL_ICS;
  if (!url) return res.status(200).json({ events: null }); // not configured

  try {
    const ics = await (await fetch(url)).text();
    // Unfold continuation lines, then walk VEVENTs.
    const lines = ics.replace(/\r\n[ \t]/g, "").split(/\r?\n/);
    const events = [];
    let cur = null;
    for (const line of lines) {
      if (line === "BEGIN:VEVENT") cur = {};
      else if (line === "END:VEVENT") { if (cur?.start) events.push(cur); cur = null; }
      else if (cur) {
        if (line.startsWith("SUMMARY:")) cur.summary = line.slice(8).replace(/\\,/g, ",");
        else if (line.startsWith("DTSTART")) {
          const v = line.split(":").pop();
          if (/^\d{8}$/.test(v)) {
            cur.start = v.slice(0, 4) + "-" + v.slice(4, 6) + "-" + v.slice(6, 8);
            cur.allDay = true;
          } else {
            const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
            if (m) {
              const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? "Z" : ""}`;
              cur.start = iso;
              cur.allDay = false;
            }
          }
        }
      }
    }
    // keep events from start of today to +3 days, soonest first, max 10
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const to = new Date(from.getTime() + 4 * 86400000);
    const upcoming = events
      .map((e) => ({ ...e, t: new Date(e.start) }))
      .filter((e) => !isNaN(e.t) && e.t >= from && e.t < to)
      .sort((a, b) => a.t - b.t)
      .slice(0, 10)
      .map(({ summary, start, allDay }) => ({ summary: summary || "(busy)", start, allDay: !!allDay }));
    res.status(200).json({ events: upcoming });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
