# Personal Level Up — Full Web App (v3)

## New in v3

- **Today**: your routines — Morning (incl. Million Dollar Morning), Warrior Core 4,
  Evening — with check-off + streaks, and a **📅 Coming up** calendar card
- **75 Hard**: your 3 workout plans from the Fitness page — tap a day to see the
  exercises in-app
- **Learn**: tap any book/course → its summary, lessons & quiz open **inside the app**,
  quiz checkboxes are tappable, and you can save notes back to the Notion page

## v3 setup (two one-time steps)

1. **Calendar** — Google Calendar (web) → ⚙️ Settings → click your calendar on the left →
   **Integrate calendar** → copy **"Secret address in iCal format"** → in Vercel:
   Settings → Environment Variables → add `GOOGLE_CAL_ICS` = that URL → Redeploy.
   (Keep this URL private — anyone with it can read your calendar.)
2. **Workouts** — in Notion, open your **"Michael Wittstock"** page → ••• menu →
   **Connections** → add your **Level Up App** integration. (The Fitness page lives
   under it, and the integration can only see pages it's connected to.)

---


The complete Level Up app on your public URL: **Today** (tasks + quote), **75 Hard**
(check off all 7 daily items), **Focus** (Pomodoro + 45-min workout timer), **Learn**
(Your ONE, quotes shuffle, courses, library), **Reflect** (gratitude + goals) — with
XP, levels, and streak, in the SF90 blue/yellow/carbon look. Reads and writes your
Notion live.

## How to ship this update (2 minutes)

Your GitHub repo `Level-Up-web` already auto-deploys to Vercel, so:

1. Open https://github.com/michaelwittstock/Level-Up-web
2. Click **Add file → Upload files**
3. Drag in ALL the contents of this folder (package.json, `pages/`, `lib/`, `styles/`,
   next.config.js) — GitHub replaces the old versions of files with the same names
4. **Commit changes** → Vercel rebuilds automatically (~1 min) → refresh your site

Everything else (NOTION_TOKEN, framework preset) is already set up from v1.

## What's inside

- `pages/index.js` — the whole 5-tab app (XP/streak stored in your browser)
- `pages/api/today.js` — 🔥 Today tasks + favorite quote
- `pages/api/complete.js` — mark task ✅ Done
- `pages/api/routines.js` — routines list + check-off (streak bump)
- `pages/api/h75.js` — today's 75 Hard row + toggle the 7 items
- `pages/api/learn.js` — quotes, Your ONE (🎯 Focus), courses, library
- `pages/api/reflect.js` — goals + log gratitude/wins
- `lib/notion.js` — Notion client, your database IDs, helpers

## If a section shows an error

That property name probably changed in Notion. Open `lib/notion.js` / the matching
`pages/api/*.js` and make sure names match your Notion columns exactly (emoji included).


## v6.4 additions

**🥊 AI Coach (Today tab)** — needs `ANTHROPIC_API_KEY` in Vercel → Settings → Environment Variables
(create one at console.anthropic.com). Optional: `ANTHROPIC_MODEL` to override the default Haiku model.

**📱 iPhone steps → Energy log** — set `HEALTH_KEY` in Vercel to any random string, redeploy, then on your
iPhone: Shortcuts → Automation → Daily at 9:00 PM → New Blank Automation:
1. "Find Health Samples" — Type: Steps, Start Date: is today (or "Get Numbers of Steps" if available)
2. "Calculate Statistics" — Sum
3. "Get Contents of URL" — `https://YOUR-APP.vercel.app/api/health?key=YOUR_HEALTH_KEY&steps=` + Statistics result
Your daily steps land in the Steps column of 🔋 Energy & Sleep automatically.

**📈 Net worth history** — on the 1st of each month the daily cron snapshots your Net Worth into
📈 Net Worth History in Notion, and the Money card shows the trend.

**🔄 Pull to refresh** — on your phone, drag down from the top of any tab to reload every card.
**📳 Haptics** — small vibrations on completions (Android/supported browsers; iOS Safari doesn't expose vibration).
**🔥 75 Hard auto-restart** — miss a day and the app restarts your attempt count automatically (your Notion rows keep their original labels). Finishing the 45-min timer now auto-checks 💪 Workout 1.
