import { notion, DB, titleText, text, sel, queryAll } from "../../lib/notion";

// GET  /api/today                  -> { tasks: [...], quote: {...}, source }
// POST /api/today {title, status}  -> creates a task (🔥 Today or 🧠 Brain Dump)
//
// To-dos live in ONE Notion database since Nov 22, 2026: Tasks (Master Command
// Center). "Today" = Lane Now or Today, personal and work together. If the
// Level Up App integration can't read Tasks yet (object_not_found), fall back
// to the old To-Do & Brain Dump list so the app never shows an error.

const MUST = new Set(["🔴 Urgent", "🟠 High"]);

async function tasksToday() {
  const pages = await queryAll(DB.tasks, {
    filter: {
      or: [
        { property: "Lane", select: { equals: "Now" } },
        { property: "Lane", select: { equals: "Today" } },
      ],
    },
  });
  const rank = (p) => (sel(p, "Lane") === "Now" ? 0 : 1);
  return pages
    .sort((a, b) => rank(a) - rank(b))
    .map((p) => {
      const pr = sel(p, "Priority");
      return {
        id: p.id,
        title: titleText(p),
        step: text(p, "Next action"),
        priority: MUST.has(pr) ? "⭐ Must" : pr,
        energy: sel(p, "Energy"),
        life: sel(p, "Life"),
        business: sel(p, "Business"),
      };
    });
}

async function oldToday() {
  const pages = await queryAll(DB.todo, {
    filter: { property: "Status", select: { equals: "🔥 Today" } },
  });
  return pages.map((p) => ({
    id: p.id,
    title: titleText(p),
    step: text(p, "Smallest Next Step"),
    priority: sel(p, "Priority"),
    energy: sel(p, "Energy"),
  }));
}

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { title, status } = req.body || {};
      if (!title?.trim()) return res.status(400).json({ error: "missing title" });
      const dump = status === "🧠 Brain Dump";
      const name = [{ text: { content: title.trim().slice(0, 200) } }];
      let page;
      try {
        page = await notion.pages.create({
          parent: { database_id: DB.tasks },
          properties: {
            Task: { title: name },
            Lane: { select: { name: dump ? "Brain dump" : "Today" } },
            Life: { select: { name: "🏠 Personal" } },
            Captured: { select: { name: "⌨️ Typed" } },
          },
        });
      } catch (e) {
        if (e.code !== "object_not_found") throw e;
        page = await notion.pages.create({
          parent: { database_id: DB.todo },
          properties: { Task: { title: name }, Status: { select: { name: dump ? "🧠 Brain Dump" : "🔥 Today" } } },
        });
      }
      return res.status(200).json({ ok: true, id: page.id });
    }

    let tasks;
    let source = "tasks";
    try {
      tasks = await tasksToday();
    } catch (e) {
      if (e.code !== "object_not_found") throw e;
      tasks = await oldToday();
      source = "old-todo (connect Level Up App to Tasks in Notion)";
    }

    const favs = await queryAll(DB.quotes, {
      filter: { property: "⭐ Favorite", checkbox: { equals: true } },
    });
    const pool = favs.length ? favs : await queryAll(DB.quotes, {}, 100);
    const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    const quote = pick ? { quote: titleText(pick), author: text(pick, "Author") } : null;

    res.status(200).json({ tasks, quote, source });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
