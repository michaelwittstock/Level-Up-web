# Level Up: rules for Claude Code

Read these first, in order: `docs/WIKI.md` (what this is), `AGENTS.md` (who does what), the **Building** and **Up Next** sections of `docs/BOARD.md` (what to do), and the last ~10 entries of `LOG.md`. Read `docs/DESIGN.md` before touching any UI.

## Commands

Run inside `phase2b-levelup-web/`:

```
npm install
vercel link && vercel env pull .env.local   # first time on a machine (team contact-michaelwitts-projects, project level-up)
npm run dev                                 # http://localhost:3000
npm run build                               # must pass before every push
npm run board                               # refresh docs/BOARD.md from Notion
```

## Rules that prevent breakage

1. **Notion property names must match exactly, emoji included.** If a section errors, a column was probably renamed in Notion. Check the name there before changing code.
2. **Don't change database IDs** in `lib/notion.js` unless Michael says a database moved. A new database only works after the "Level Up App" integration is connected to it in Notion.
3. **Never commit secrets.** No tokens in code, commits or docs. `GOOGLE_CAL_ICS` is a secret too. Keep the repo private.
8. **Every new page and `/api/*` route is behind the login** (`middleware.js`). Only add a path to its public list if Michael asks for that page to be public.
4. **`npm run build` before pushing app code.** A push to `main` deploys production; a failed build leaves the old version up silently. Use a branch and a Vercel preview for anything risky.
5. **Don't move the app out of `phase2b-levelup-web/`** without changing Vercel's Root Directory in the same change.
6. **Bump `VERSION`** in `pages/index.js` on every user-visible release.
7. **The plan lives in Notion.** Move cards there (Up Next → Building → Shipped). Never hand-edit `docs/BOARD.md`.

## How to work with Michael

- He has ADHD and works best in single-focus, time-boxed sprints with one clear deliverable. One board card at a time.
- Short replies, result first, no filler.
- When something breaks, say what caused it and give the exact fix (or what you already did). Never just report the error.
- Give full file paths and direct Notion links.
- He's not a career developer: do the git, npm and Vercel steps yourself and explain choices in plain words.
- End of each card: commit, push, confirm the deploy, move the card in Notion, add a `LOG.md` line, and tell him the one thing to look at on his phone.
