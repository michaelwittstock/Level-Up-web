# Rules for AI agents working on Level Up (Claude + Grok)

Level Up is Michael's all-in-one life app (Today, 75 Hard, Focus, Learn, Reflect, Money…).
Live: https://levelup.michaelwittstock.com — Vercel project `level-up`, auto-deploys from `main`.

## Repo layout
```
phase2b-levelup-web/   The Next.js app (Vercel root). pages/index.js = UI, pages/api/* = Notion APIs
finance/               Finance module: data contracts, Grok drop zone, payoff calculator
AGENTS.md              This file
LOG.md                 Shared Claude ⇄ Grok handoff log
```

## Roles
- **Claude** — builds the app (UI, APIs, calculators, alerts), reviews Grok's pushes.
- **Grok** — data feeds only. Writes ONLY to `finance/feeds/` (see `finance/README.md`). Never edits app code.
- **Michael** — answers questions in Notion (Personal Level Up → Finance HQ → Questions for Michael).

## Workflow
1. Pull first. Read the last ~10 `LOG.md` entries.
2. Stay in your lane (above). Need something outside it? Ask in `LOG.md`.
3. After every push, append to `LOG.md`: `## YYYY-MM-DD HH:MM PT — Claude|Grok` + what changed + anything the other agent must do.
4. Pushing to `main` deploys production — app code changes must build cleanly.

## Hard rules
- NEVER commit full card/account numbers, SSN, passwords, seed phrases/private keys, API tokens. Last 4 digits only.
- Read-only money access. No agent pays, transfers, or applies for credit.
- USD as plain numbers (`1234.56`), APR as percent (`27.99`), dates `YYYY-MM-DD`, times ISO 8601.
- JSON must be valid (`python3 -m json.tool file.json`).
- UI work follows the Taste rules: no emojis in new UI, Satoshi + JetBrains Mono, one accent, hairline dividers over boxed cards.
