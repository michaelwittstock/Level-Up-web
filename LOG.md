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
