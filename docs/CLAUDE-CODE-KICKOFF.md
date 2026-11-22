# Level Up: Claude Code kickoff prompt

Paste everything below the line into Claude Code on Michael's Mac.

---

You're working on my Level Up app with me (Michael). The app is live and the repo already has your instructions in it. Do the steps below in order. Do every git, npm, Vercel and GitHub step yourself. Only stop for me when a login needs my browser or a step says to ask me.

## Where things are

- GitHub repo: `michaelwittstock/Level-Up-web`, branch `main`. The Next.js app is in the subfolder `phase2b-levelup-web/`.
- Vercel: project `level-up`, team `contact-michaelwitts-projects`. Live at https://levelup.michaelwittstock.com. A push to `main` that changes `phase2b-levelup-web/` or `finance/` deploys production. Docs-only pushes skip the build.
- Data: my Notion workspace. All secrets are already in Vercel. Never ask me to type one and never print one.
- The plan: the Notion board "Level Up Build Board" (https://app.notion.com/p/c703f3206a1f4481a80f2450d390f569), mirrored to `docs/BOARD.md`.

## Step 1: Get the code and read your instructions

1. If `~/Developer/Level-Up-web` exists, `cd` there and `git pull`. Otherwise run `gh repo clone michaelwittstock/Level-Up-web ~/Developer/Level-Up-web`. If `gh` isn't signed in, run `gh auth login` and walk me through it.
2. Read, in this order: `CLAUDE.md`, `docs/WIKI.md`, `AGENTS.md`, `docs/DESIGN.md`, the Building and Up Next sections of `docs/BOARD.md`, and the last 10 entries of `LOG.md`. Follow them for everything after this.

## Step 2: Make it run on this Mac

In `phase2b-levelup-web/`:

1. `npm install`
2. `vercel link` (team `contact-michaelwitts-projects`, project `level-up`), then `vercel env pull .env.local`. If the Vercel CLI is missing, `npm i -g vercel`. If it isn't signed in, `vercel login` and walk me through it.
3. `npm run build`, then `npm run dev`, and confirm `http://localhost:3000/api/today` returns JSON with `"source":"tasks"` and real tasks. If `source` starts with `old-todo`, the "Level Up App" Notion integration can't see my Tasks database: tell me to open https://app.notion.com/p/a8731f8a82504988bc6a10a77493557c, click ••• → Connections → add Level Up App, then re-check.

## Step 3: Turn on the hourly board sync

1. Copy `NOTION_TOKEN` from `.env.local` into the repo's GitHub Actions secrets without showing it: read the value in a subshell and pipe it to `gh secret set NOTION_TOKEN --repo michaelwittstock/Level-Up-web`. Never echo it.
2. Run `npm run board`. If it says Notion `object_not_found`, tell me to open https://app.notion.com/p/c703f3206a1f4481a80f2450d390f569, click ••• → Connections → add Level Up App, then run it again.
3. Run the workflow once: `gh workflow run sync-board.yml --repo michaelwittstock/Level-Up-web`, wait for it, and confirm it passed with `gh run list --workflow sync-board.yml --limit 1`.
4. In Notion, move card #24 ("Turn on the board sync") to Shipped. If you have no Notion access, tell me to drag it.

## Step 4: Ship the open pull request

Pull request #1 (https://github.com/michaelwittstock/Level-Up-web/pull/1) points the Today tab at my merged Tasks list (v1.01).

1. Check it out, run `npm run build`, and open the Vercel preview link from the PR.
2. Ask me yes or no: "Today shows your Now and Today tasks from the merged list. Merge to production?"
3. On yes: merge it, watch the Vercel production deploy reach Ready, confirm https://levelup.michaelwittstock.com/api/today returns `"source":"tasks"`, move card #26 to Shipped, and add a `LOG.md` entry.

## Step 5: Start the next card, then stop

The next card is #29, "Design system v2". Before writing any CSS:

1. Ask me for the approved mockup file `tile-mockup.html` and save it to `docs/reference/tile-mockup.html`.
2. Show me a short plan (what changes, in what order, how I'll check it on my phone) and wait for my OK.

Do only that card. Don't start a second one.

## Rules

- One board card at a time. Short replies, result first.
- If something fails, tell me what caused it and the exact fix, or what you already did to fix it. Never just show me the error.
- Give full file paths and direct links.
- Never commit secrets. The repo is public. Don't make it private without asking me; Grok reads it by link.
- Never hand-edit `docs/BOARD.md`. Change the card in Notion.
- End every card with: commit, push, deploy confirmed, card moved in Notion, one `LOG.md` line, and the one thing I should look at on my phone.
