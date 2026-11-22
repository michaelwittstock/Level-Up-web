# Level Up Build Board

_Last synced from Notion: Nov 22, 2026, 3:02 PM PT_

Mirror of the Notion board ([open in Notion](https://app.notion.com/p/c703f3206a1f4481a80f2450d390f569)). **Edit cards in Notion, not here.** This file is rewritten from Notion every hour by `.github/workflows/sync-board.yml`.

Building 0 · Up Next 7 · Idea 26 · Shipped 6

Owners: **Claude** builds the app · **Grok** data feeds and exports · **Michael** decisions and anything only he can do.

## Up Next

| # | Area | Card | Owner | Notes |
|---|---|---|---|---|
| 1 | Platform | Make Level-Up-web repo private (currently public) | Michael | Public now so Grok can read the code by link. Before Grok pushes REAL balances into finance/feeds/, make the repo private AND give Grok GitHub access to it, or real numbers become public. |
| 24 | Platform | Turn on the board sync: add NOTION_TOKEN to GitHub + connect Level Up App to this board and Tasks | Michael | 2 minutes. Steps are in docs/WIKI.md under 'Turning on the board sync'. |
| 38 | Platform | Export Grok's life notes (workouts, supplements, bloodwork, fasting) to imports/grok/ | Grok | Markdown files only. Claude turns them into Notion data. |
| 27 | Tasks | Daily Command Center + 7 AM printout read Tasks instead of the old list | Claude | Its views still point at the OLD To-Do & Brain Dump (Do Date, Must). Map to Tasks Due + Lane Today/Now. |
| 29 | Design | Design system v2: Taste rules + Mobbin references across every tab | Claude | References in the Project doc claude/sprint-1-inventory.md. Needs the approved tile-mockup.html. |
| 3 | Money | Grok: daily account balances + prices feed to finance/feeds/ | Grok | Grok already has the accounts connected, so SimpleFIN is optional backup only. Prompt is in chat. |
| 4 | Money | Expand Level Up Money tab (cards, due dates, debt payoff, net worth) | Claude | Built inside Level Up (Vercel project level-up), not a separate dashboard. |

## Idea

| # | Area | Card | Owner | Notes |
|---|---|---|---|---|
| 30 | Platform | Split pages/index.js into one component per tab | Claude |  |
| 28 | Tasks | Decide: fold Wittstock Digital OS Work Tracker cards into Tasks, or keep it as the company board | Michael | Work Tracker has departments, projects and Claude's engineering cards, so it was left alone. |
| 31 | Body | Body tab: weekly split (Mon push, Tue legs, Wed walk, Thu pull, Fri full-body light, weekend walk + 8-min stretch) + Workout Log + PRs | Claude | Plan comes from the old Life Board workout cards. Bevel / Gymshark layouts. |
| 32 | Body | Fasting timer + Fasting Log database | Claude | Yazio / Runna ring layout. |
| 33 | Labs | Labs: Labs database + bloodwork PDF upload, markers over time with ranges | Claude | Needs Michael's bloodwork PDF. Shows out-of-range flags and questions for the doctor, never doses. |
| 34 | Labs | Supplements database linked to lab markers + daily taken check-off | Claude | Dose = what's on the bottle or from his doctor. |
| 35 | Mind | Learn tab reads Personal Library (Books + Authors) instead of the old Library | Claude |  |
| 36 | Spirit | Spirit tab: John Reading plan, verse of the day, Prayer List, streak heatmap | Claude |  |
| 37 | Identity | Identity tab: personality + zodiac profile as a 'how I work best' guide | Claude |  |
| 5 | Money | Bills & due-date calendar + alerts (3 days / 1 day before) | Claude | Push to Google Calendar + iMessage/phone reminders. |
| 6 | Money | Debt payoff planner: avalanche vs snowball, payoff dates, interest saved | Claude |  |
| 7 | Money | "What if I pay $X more" calculator using daily APR interest | Claude | Shows interest saved, months shaved, and best card to send the extra $ to. |
| 8 | Money | Statement-date trick: pay before statement closes to lower utilization / credit score | Claude |  |
| 9 | Money | Balance transfer / 0% APR opportunity finder | Claude |  |
| 10 | Money | Subscription & recurring-charge detector (cancel list) | Claude |  |
| 11 | Money | Net worth: banks + cards + loans + stocks + crypto, monthly history chart | Claude |  |
| 12 | Money | Crypto tracking (exchange balances + public wallet addresses, live prices) | Grok | Good Grok task: pull prices + wallet balances daily and push JSON to repo. |
| 13 | Money | Spending-by-merchant/category analysis from transactions | Claude |  |
| 14 | Money | Best card per purchase ("use this card at Costco/Amazon/gas") | Claude |  |
| 15 | Money | Card offers tracker (Capital One Offers, Amex Offers, Chase Offers) + Capital One Shopping watchlist | Claude | No public Capital One Shopping API — plan: watchlist of your top stores + weekly browser check on your Mac. |
| 16 | Money | Rewards gap report: which new card would earn most on your real spending | Claude |  |
| 17 | Money | Business vs personal split (Wittstock Digital / wittstock.tech) + tax set-aside | Claude |  |
| 18 | Money | Money section on the 7 AM daily printout (due today, balances, 1 action) | Claude |  |
| 19 | Money | Weekly money check-in (Sunday): spending vs plan, debt progress, wins | Claude |  |
| 20 | Money | Emergency fund + savings goals tracker | Claude |  |
| 21 | Money | Credit score tracker + utilization by card | Claude |  |

## Shipped

| # | Area | Card | Owner | Notes |
|---|---|---|---|---|
| 22 | Platform | Repo wiki for Grok: docs/WIKI.md (what Level Up is, how it's built) | Claude | Grok reads it at github.com/michaelwittstock/level-up-web/blob/main/docs/WIKI.md |
| 23 | Platform | Sync this board to docs/BOARD.md (script + hourly GitHub Action) | Claude | Notion is the source of truth. Manual run: npm run board in phase2b-levelup-web. |
| 39 | Platform | Claude Code kickoff prompt: docs/CLAUDE-CODE-KICKOFF.md | Claude | Michael pastes it into Claude Code. It sets up the Mac, turns on the board sync, ships PR #1 and starts Design v2. |
| 25 | Tasks | Merge all to-do lists into Tasks (Personal Board + Work Board) | Claude | Moved 18 open items from To-Do & Brain Dump, Life Board and WD Work Board. Old lists renamed OLD and kept as history. |
| 26 | Tasks | App Today tab reads the merged Tasks list (Now + Today lanes) | Claude | Live in v1.01. Michael merged PR #1 on Nov 22; production reads Tasks (Now + Today lanes) and falls back to the old list only if Tasks can't be read. |
| 2 | Money | Finance module added to Level-Up-web (finance/, AGENTS.md, LOG.md, payoff calculator) | Claude |  |
