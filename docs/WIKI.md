# Level Up wiki

The one page to read first, for any AI or person working on this repo: what Level Up is, how it's built, where the data lives, and what's next.

- **Live app:** https://levelup.michaelwittstock.com
- **Repo:** https://github.com/michaelwittstock/level-up-web (branch `main`)
- **The plan:** [`docs/BOARD.md`](BOARD.md), a copy of the Notion build board that syncs every hour
- **Claude Code kickoff prompt:** [`docs/CLAUDE-CODE-KICKOFF.md`](CLAUDE-CODE-KICKOFF.md)
- **Agent rules:** [`AGENTS.md`](../AGENTS.md) · **Handoff log:** [`LOG.md`](../LOG.md) · **Design rules:** [`docs/DESIGN.md`](DESIGN.md)

## What Level Up is

Michael's all-in-one personal life app. It's a single place for the lessons, principles, quotes, books and guides on how to live his best life, plus his to-dos, workouts, food, health, faith and money. It's built for an ADHD brain: visual boards, checklists, one clear next step. You open it, see today, and tap to check things off.

One user (Michael), phone-first, installed to the home screen as a PWA. Notion holds the data. The app is the fast, good-looking way to use it every day. The design bar is "tech-giant app" polish, with each area modeled on the best app in its category (see Design).

## Areas of the app

| Area | What it covers | Status |
|---|---|---|
| **Today** | Today's tasks (from the merged Tasks list), routines, quote, calendar, Mila care, notifications | Live (v1.00) |
| **Tasks** | One to-do database for everything. Personal and work are kept apart by a field, with a separate board for each | Notion merged Nov 22; app switch in progress |
| **75 Hard / Body** | 75 Hard checklist, workout plans, PR log. Coming next: weekly workout split, workout log, fasting timer | Partly live |
| **Labs** | Bloodwork markers over time with ranges, supplements linked to markers | Planned |
| **Focus** | Pomodoro, 45-min workout timer, breathing | Live |
| **Learn / Mind** | ONE focus, quotes, courses, library, in-app reader, flashcards. Moving to the Personal Library (Books + Authors) | Live, upgrade planned |
| **Spirit** | Gospel of John reading plan, verse of the day, prayer list, streaks | Planned |
| **Identity** | Personality and zodiac profile, written as a "how I work best" guide | Planned |
| **Reflect / Journal** | Gratitude and wins, goals, energy log, stats, AI coach, journal with voice input | Live |
| **Money** | Cards, due dates, debt payoff, net worth, rewards. Grok supplies account data | Finance module in `finance/`; tab expansion planned |

## How it's built

```
phase2b-levelup-web/      The Next.js app. This is the Vercel root directory.
  pages/index.js          The whole UI: one file, one component per tab (to be split up)
  pages/api/*.js          One small API route per feature; each talks to Notion
  lib/notion.js           Notion client, database IDs, property helpers
  styles/globals.css      All styling
  vercel.json             Crons (daily push notifications) + build-skip rule
finance/                  Finance module: data contracts, Grok's drop zone, payoff calculator
imports/grok/             Grok's exports of Michael's life notes (markdown) for Claude to turn into Notion data
scripts/sync-board.mjs    Notion build board -> docs/BOARD.md
docs/                     This wiki, the board copy, design rules
AGENTS.md / LOG.md        Rules for Claude + Grok, and their shared handoff log
```

- **Stack:** Next.js 14 (Pages Router), plain JavaScript and CSS, React 18, `@notionhq/client`, `web-push`, Anthropic API for the in-app coach.
- **Hosting:** Vercel project `level-up`. Every push to `main` that touches `phase2b-levelup-web/` or `finance/` deploys to production. Pushes that only change docs, scripts or the board skip the build (see `ignoreCommand` in `vercel.json`).
- **Secrets:** they live only in Vercel environment variables and GitHub Actions secrets, never in the repo. Names: `NOTION_TOKEN`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GOOGLE_CAL_ICS`, `CRON_SECRET`, `HEALTH_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.
- **XP, level and streak** are kept in the browser (localStorage) for now.

## Where the data lives (Notion)

The app reads and writes these through the "Level Up App" Notion integration. A database the integration isn't connected to returns `object_not_found`.

| Database | Used for | Notion ID |
|---|---|---|
| **Tasks** (Master Command Center) | THE to-do list. `Life` = Personal or Business; `Lane` = Now / Today / Brain dump / Later / Waiting / Done; `Business` = which company | `a8731f8a82504988bc6a10a77493557c` |
| 🛠️ Level Up Build Board | The build plan, mirrored to `docs/BOARD.md` | `c703f3206a1f4481a80f2450d390f569` |
| 🔁 Routines & Habits | Morning / Warrior Core 4 / Evening checklists | `1035973dfe3143faa11b86298a0032fb` |
| 💬 Quotes | Quote of the day | `e1147eed857b48d0a2a7be03bfd2668a` |
| 🔥 75 Hard Tracker | The 7 daily items | `7c2ee1019e85489fb24ee3385bc0b1c7` |
| 🎯 Goals & Dreams | Goals | `d395ac413db14be2b55f16909e219427` |
| 🙏 Gratitude & Wins | Reflect tab | `b4aa46dcb40f46408f124980b6d67f9e` |
| 📚 Courses / 📖 Library | Learn tab | `8d662e89dddb479596d83dfe1316fed8` / `9c4b369ee79b46e49f328869cd679c2d` |
| ⏰ Reminders · 🐶 Mila Care | Today tab | `d18c69d5c18e4ed696f858ea490943e1` · `5c960914323d4abe88744acf3894fb80` |
| 🗄️ OLD To-Do & Brain Dump | Retired Nov 22, kept as history; the app falls back to it only if Tasks can't be read | `19525df701d14d278163fb6954278917` |

**One to-do list, two boards.** Personal and work to-dos live in the same Tasks database, so they sync with each other, the app, and Apple Reminders (tick `Send to Apple`). The **Personal Board** view shows `Life = 🏠 Personal` and the **Work Board** view shows `Life = 💼 Business`, grouped by Lane and by business. The older lists (To-Do & Brain Dump, Accountability OS Life Board, WD Work Board) were copied in and renamed "OLD". The Wittstock Digital OS Work Tracker stays as the company's own project board.

## How Claude and Grok work together

| Who | Does | Writes to |
|---|---|---|
| **Claude** (Claude Code + Claude chat) | Builds the app, keeps Notion and the board current, reviews Grok's pushes | Everything except Grok's folders |
| **Grok** | Reads all the code and docs. Supplies data: account balances, prices, and exports of Michael's notes from Grok chats | `finance/feeds/` and `imports/grok/` only |
| **Michael** | Decides, approves, answers questions, does the steps only he can do | Notion |

Every session: pull, read the last ~10 entries of `LOG.md` and the **Building** + **Up Next** sections of `docs/BOARD.md`, do one card, push, then add a line to `LOG.md`. To change the plan, change the card in Notion. Never hand-edit `docs/BOARD.md`; the next sync overwrites it.

## Design

The target look is in [`docs/DESIGN.md`](DESIGN.md): Satoshi + JetBrains Mono, off-black, one ember accent, stroke icons, no emoji, hairlines instead of boxed cards. Each area copies the layout (not the look) of the best app in its category on Mobbin:

| Area | Reference apps |
|---|---|
| Today | Gymshark 66-day habits, Hevy widgets, Life Reset XP bar |
| Body | Bevel fitness, Gymshark progress |
| Fasting | Yazio fasting tracker, Runna timer |
| Labs | Superpower biomarker detail, Bevel biomarker list, Visible score |
| Supplements | Apple Health medications, GoodRx reminders |
| Mind | Blinkist library, Apple Books reading goals |
| Spirit | 5 Minute Journal, timespent heatmap |
| Identity | Co–Star, Tolan insights |
| Money | Monarch dashboard, Rocket Money net worth |

## Health and money guardrails

- **Labs** show values, ranges and flags, plus questions for Michael's doctor. The app never sets supplement doses or tells him to stop or start a medication. A dose shown is what's on the bottle or what his doctor said.
- **Money** access is read-only. No agent pays, transfers or applies for anything. No full card or account numbers anywhere; last 4 digits only.

## Login and secrets

The whole app sits behind one passcode (`middleware.js` + `pages/login.js`). Every page and `/api/*` route returns a login screen or `401` without the `lu_session` cookie. Only `/share` (public 75 Hard scoreboard) is open, and three routes check their own secret instead: `/api/push-daily` and `/api/push-breathe` (`CRON_SECRET`, sent by Vercel Cron) and `/api/health` (`HEALTH_KEY`).

Vercel env vars the gate needs (Production + Preview): `APP_PASSCODE` (12+ characters) and `CRON_SECRET` (long random string). With `APP_PASSCODE` missing the app shows "Level Up is locked" instead of opening up. Changing `APP_PASSCODE` signs out every device. The installed iPhone app keeps its own cookie, so sign in once inside it too.

## Turning on the board sync

`.github/workflows/sync-board.yml` runs every hour and rewrites `docs/BOARD.md` from Notion. It needs two one-time steps from Michael:

1. **Connect the integration in Notion.** Open the [🛠️ Level Up Build Board](https://app.notion.com/p/c703f3206a1f4481a80f2450d390f569), click **•••** (top right) → **Connections** → add **Level Up App**. Do the same on [Tasks](https://app.notion.com/p/a8731f8a82504988bc6a10a77493557c) so the app can read the merged to-do list.
2. **Add the token to GitHub.** Go to https://github.com/michaelwittstock/level-up-web/settings/secrets/actions/new, name it `NOTION_TOKEN`, and paste the same value Vercel uses: Vercel → project `level-up` → Settings → Environment Variables → `NOTION_TOKEN` → reveal and copy.

Then run it once: https://github.com/michaelwittstock/level-up-web/actions/workflows/sync-board.yml → **Run workflow**.

Locally: in `phase2b-levelup-web/`, run `vercel env pull .env.local` once, then `npm run board`.
