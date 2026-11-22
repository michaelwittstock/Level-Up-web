# Rules for AI agents working on Level Up (Claude + Grok)

Level Up is Michael's all-in-one life app (Today, 75 Hard, Focus, Learn, Reflect, Money…).
Live: https://levelup.michaelwittstock.com — Vercel project `level-up`, auto-deploys from `main`.

## Repo layout
```
phase2b-levelup-web/   The Next.js app (Vercel root). pages/index.js = UI, pages/api/* = Notion APIs
finance/               Finance module: data contracts, Grok drop zone, payoff calculator
imports/grok/          Grok's exports of Michael's notes from Grok chats (markdown)
docs/WIKI.md           What Level Up is and how it's built. READ FIRST.
docs/BOARD.md          The build plan, synced hourly from the Notion build board (read-only)
docs/DESIGN.md         Design rules for all UI
scripts/               sync-board.mjs (Notion board -> docs/BOARD.md)
AGENTS.md              This file
LOG.md                 Shared Claude ⇄ Grok handoff log
```

## Roles
- **Claude** — builds the app (UI, APIs, calculators, alerts), reviews Grok's pushes.
- **Grok** — reads everything (code, docs, board). Writes ONLY to `finance/feeds/` (see `finance/README.md`) and `imports/grok/` (see `imports/grok/README.md`). Never edits app code or docs.
- **Michael** — decides and approves. Answers questions in Notion (Personal Level Up → Finance HQ → Questions for Michael).

## Workflow
1. Pull first. Read `docs/WIKI.md` once, then each session the last ~10 `LOG.md` entries and the Building + Up Next sections of `docs/BOARD.md`.
2. Stay in your lane (above). Need something outside it? Ask in `LOG.md`.
3. After every push, append to `LOG.md`: `## YYYY-MM-DD HH:MM PT — Claude|Grok` + what changed + anything the other agent must do.
4. Pushing to `main` deploys production when `phase2b-levelup-web/` or `finance/` changed — app code changes must build cleanly.
5. The plan lives in Notion (🛠️ Level Up Build Board). Never hand-edit `docs/BOARD.md`; to propose a card, ask in `LOG.md`.
6. To-dos live in ONE Notion database (Tasks): `Life` = 🏠 Personal or 💼 Business. Never create another to-do list.

## Hard rules
- NEVER commit full card/account numbers, SSN, passwords, seed phrases/private keys, API tokens. Last 4 digits only.
- Read-only money access. No agent pays, transfers, or applies for credit.
- USD as plain numbers (`1234.56`), APR as percent (`27.99`), dates `YYYY-MM-DD`, times ISO 8601.
- JSON must be valid (`python3 -m json.tool file.json`).
- UI work follows the Taste rules: no emojis in new UI, Satoshi + JetBrains Mono, one accent, hairline dividers over boxed cards.
