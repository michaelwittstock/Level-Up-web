#!/usr/bin/env node
// Notion "🛠️ Level Up Build Board" -> docs/BOARD.md
//
// Notion is the source of truth. This file only mirrors it so Claude Code and
// Grok can read the plan straight from the repo.
//
//   NOTION_TOKEN=... node scripts/sync-board.mjs          # pull from Notion
//   node scripts/sync-board.mjs --from-json rows.json     # render from saved rows
//
// Writes docs/BOARD.md only when a card changed (the timestamp alone never
// counts as a change), so the hourly GitHub Action doesn't make empty commits.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DB_ID = "c703f3206a1f4481a80f2450d390f569";
const NOTION_URL = "https://app.notion.com/p/c703f3206a1f4481a80f2450d390f569";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "BOARD.md");

const STATUS_ORDER = ["Building", "Up Next", "Idea", "Shipped"];
const AREA_ORDER = ["Platform", "Tasks", "Design", "Today", "Body", "Labs", "Mind", "Spirit", "Identity", "Money"];

function plain(rich) {
  return (rich || []).map((t) => t.plain_text).join("");
}

// Notion API page -> flat row
function fromApi(page) {
  const p = page.properties || {};
  const id = p.ID?.unique_id;
  return {
    id: id ? id.number : null,
    feature: plain(p.Feature?.title),
    status: p.Status?.status?.name || "Idea",
    owner: p.Owner?.select?.name || "",
    area: p.Area?.select?.name || (p.Phase?.select ? "Money" : ""),
    phase: p.Phase?.select?.name || "",
    notes: plain(p.Notes?.rich_text),
    url: page.url || "",
  };
}

async function pullFromNotion(token) {
  let rows = [];
  let cursor;
  do {
    const r = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
    });
    const j = await r.json();
    if (!r.ok) {
      const hint =
        j.code === "object_not_found"
          ? " The 'Level Up App' integration is not connected to the Build Board. In Notion open the board, ••• menu > Connections > add Level Up App."
          : j.code === "unauthorized"
          ? " NOTION_TOKEN is missing or wrong. Add it in GitHub > Settings > Secrets and variables > Actions."
          : "";
      throw new Error(`Notion ${r.status} ${j.code}: ${j.message}.${hint}`);
    }
    rows = rows.concat(j.results.map(fromApi));
    cursor = j.has_more ? j.next_cursor : undefined;
  } while (cursor);
  return rows;
}

const esc = (s) => String(s || "").replace(/\|/g, "\\|").replace(/\n/g, " ");

function render(rows) {
  rows = rows.filter((r) => r.feature);
  const byStatus = (s) =>
    rows
      .filter((r) => r.status === s)
      .sort(
        (a, b) =>
          (AREA_ORDER.indexOf(a.area) + 1 || 99) - (AREA_ORDER.indexOf(b.area) + 1 || 99) ||
          (a.id || 0) - (b.id || 0)
      );

  const counts = STATUS_ORDER.map((s) => `${s} ${byStatus(s).length}`).join(" · ");
  let md = "";
  md += "# Level Up Build Board\n\n";
  md += `Mirror of the Notion board ([open in Notion](${NOTION_URL})). **Edit cards in Notion, not here.** This file is rewritten from Notion every hour by \`.github/workflows/sync-board.yml\`.\n\n`;
  md += `${counts}\n\n`;
  md += "Owners: **Claude** builds the app · **Grok** data feeds and exports · **Michael** decisions and anything only he can do.\n";

  for (const s of STATUS_ORDER) {
    const list = byStatus(s);
    if (!list.length) continue;
    md += `\n## ${s}\n\n`;
    md += "| # | Area | Card | Owner | Notes |\n|---|---|---|---|---|\n";
    for (const r of list) {
      md += `| ${r.id ?? ""} | ${esc(r.area)} | ${esc(r.feature)} | ${esc(r.owner)} | ${esc(r.notes)} |\n`;
    }
  }
  return md;
}

const SYNC_LINE = /^_Last synced from Notion: .*_\n\n/m;

async function main() {
  const i = process.argv.indexOf("--from-json");
  let rows;
  if (i > -1) {
    rows = JSON.parse(readFileSync(process.argv[i + 1], "utf8"));
  } else {
    const envFile = join(ROOT, "phase2b-levelup-web", ".env.local");
    if (!process.env.NOTION_TOKEN && existsSync(envFile)) {
      const m = readFileSync(envFile, "utf8").match(/^NOTION_TOKEN=["']?([^"'\r\n]+)/m);
      if (m) process.env.NOTION_TOKEN = m[1];
    }
    const token = process.env.NOTION_TOKEN;
    if (!token) throw new Error("NOTION_TOKEN is not set. Locally: run `vercel env pull .env.local` in phase2b-levelup-web, then `npm run board`.");
    rows = await pullFromNotion(token);
  }

  const body = render(rows);
  const old = existsSync(OUT) ? readFileSync(OUT, "utf8").replace(SYNC_LINE, "") : "";
  if (old === body) {
    console.log(`BOARD.md unchanged (${rows.length} cards)`);
    return;
  }
  const stamp = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" });
  const [title, ...rest] = body.split("\n\n");
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${title}\n\n_Last synced from Notion: ${stamp} PT_\n\n${rest.join("\n\n")}`);
  console.log(`wrote docs/BOARD.md (${rows.length} cards)`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
