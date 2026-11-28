# Shared Log (Claude ⇄ Grok)

Newest at the bottom. Format: `## YYYY-MM-DD HH:MM PT — Agent`.

## 2026-11-19 22:45 PT — Claude
- Finance is now part of Level Up (no separate app/repo). Added `finance/` (data contracts, payoff calculator) and this log + `AGENTS.md`.
- App code untouched in this push. Next: expand the Money tab (bills/due dates, cards, debt payoff, rewards) reading from `finance/feeds/`.
- **For Grok:** read `AGENTS.md` and `finance/README.md`. Your job: daily `finance/feeds/accounts.json` and `finance/feeds/prices.json`. Write only in `finance/feeds/`. Log every push here.

## 2026-11-22 00:45 PT — Claude
- Added the repo wiki `docs/WIKI.md` (read this first), `docs/DESIGN.md`, `CLAUDE.md`, root `README.md`.
- The build plan now lives in Notion (🛠️ Level Up Build Board) and is mirrored to `docs/BOARD.md` by `scripts/sync-board.mjs` + `.github/workflows/sync-board.yml` (hourly). Docs-only pushes no longer redeploy production (`ignoreCommand` in `phase2b-levelup-web/vercel.json`).
- To-dos merged in Notion: one Tasks database with a Personal Board and a Work Board. Old lists renamed OLD.
- **For Grok:** you can now read the whole repo. New lane: `imports/grok/` (format in its README). Board card #38: export Michael's Grok notes on workouts, supplements, bloodwork and fasting there. Still: `finance/feeds/` daily (card #3).

## 2026-11-22 00:55 PT — Claude
- PR #1 (branch `tasks-merge`): Today tab reads the merged Tasks list, v1.01. Preview is Ready and returns `"source":"tasks"`. Not merged; waiting on Michael.
- Added `docs/CLAUDE-CODE-KICKOFF.md` (the prompt Michael pastes into Claude Code) and `.gitignore`.
- Board sync is not live yet: the repo secret `NOTION_TOKEN` is missing. The kickoff prompt sets it.

## 2026-11-22 15:05 PT — Claude
- Michael merged PR #1. v1.01 is live: production `/api/today` returns `"source":"tasks"` with the 5 Now + Today cards. Board card #26 moved to Shipped.
- Board sync still isn't live: the last two scheduled runs skipped with "NOTION_TOKEN secret is not set yet". `docs/BOARD.md` was refreshed by hand from Notion in this push. Fix: Step 3 of `docs/CLAUDE-CODE-KICKOFF.md`, or add the secret at https://github.com/michaelwittstock/level-up-web/settings/secrets/actions/new.
- Next card: #27, Daily Command Center + 7 AM printout read Tasks.

## 2026-11-23 09:15 PT — Claude
- QA pass: test agents ran a code audit, a read-only check of the live app, a device/readability pass (8 screen sizes, light + dark) and a stress test. 72 issues, 57 screenshots, in a private report for Michael.
- Added board cards #40–#48 (QA fix 1–9). #40 (add a login) goes first. #41: the live Learn tab fails because `DB.library` in `lib/notion.js` can't be read by the integration, and `/report` asks Notion for the 31st of 30-day months.
- No app code changed in this push.

## 2026-11-27 18:30 PT — Claude
- Security: the live app had no login, so anyone with the URL could read every Net Worth row and change its Value through `/api/money`, read Notion pages through `/api/page`, and run up the Anthropic key through `/api/coach` and `/api/cleanup`. No keys or real figures were ever committed (checked all history).
- Branch `security/app-login`: passcode login for every page and API route (board card #40), cron routes now require `CRON_SECRET`. Not merged; needs `APP_PASSCODE` + `CRON_SECRET` in Vercel first, then Michael's yes. Repo still public until he switches it.

