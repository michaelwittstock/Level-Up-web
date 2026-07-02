# Personal Level Up — Public Web App (Phase 2b)

A tiny Next.js app that shows your **Today** tasks + a favorite quote from your Notion hub,
on a real URL you can open from any phone browser (no Cowork needed). This is a starter you
can grow into the full app.

It already has your database IDs filled in. You just need to (1) create a Notion token,
(2) share your hub with it, and (3) deploy to Vercel.

---

## Step 1 — Create a Notion integration token (2 min)

1. Go to **https://www.notion.so/my-integrations** → **New integration**.
2. Name it "Level Up App", pick your workspace, type **Internal**. Create it.
3. Copy the **Internal Integration Secret** (starts with `secret_` or `ntn_`).

## Step 2 — Share your hub with the integration (1 min)

1. Open your **Personal Level Up** page in Notion.
2. Top-right **•••** menu → **Connections** → **Connect to** → pick "Level Up App".
3. This gives it read/write access to the page and every database inside it.

## Step 3 — Deploy to Vercel (5 min)

**Easiest path (no terminal):**
1. Put this folder in a GitHub repo (drag-and-drop upload works at github.com/new).
2. Go to **https://vercel.com** → sign in with GitHub → **Add New → Project** → import the repo.
3. Before deploying, open **Environment Variables** and add:
   - Name: `NOTION_TOKEN`  ·  Value: *(the secret from Step 1)*
4. Click **Deploy**. In ~1 minute you get a URL like `levelup-web.vercel.app`.
5. Open it on your phone → Share → **Add to Home Screen**. Done.

**Prefer the terminal?**
```bash
npm install
cp .env.local.example .env.local   # then paste your token into .env.local
npm run dev                          # test locally at http://localhost:3000
npx vercel                           # deploy (follow prompts; add NOTION_TOKEN when asked)
```

---

## If something doesn't load

- **Empty tasks or quote?** Open `lib/notion.js` and check the `PROP` names match your
  Notion columns exactly (emoji included). Adjust and redeploy.
- **401 / unauthorized?** The integration isn't connected to the page (redo Step 2), or the
  `NOTION_TOKEN` env var is missing/typo'd in Vercel.
- **Nothing at all?** Make sure `NOTION_TOKEN` has no quotes or spaces around it.

## What's here / what's next

- `pages/index.js` — the Today screen (tasks + quote, tap ○ to complete).
- `pages/api/today.js` — reads open tasks + a favorite quote from Notion.
- `pages/api/complete.js` — marks a task Done.
- `lib/notion.js` — Notion client, your DB IDs, and the property-name config.

Next additions (say the word and I'll build them): routines check-off, 75 Hard tracker,
the Learn tab with your ONE, XP/streak, and the full SF90 styling from the Cowork app.
