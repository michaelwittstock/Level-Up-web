# Personal Level Up — Full Web App (v2)

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
