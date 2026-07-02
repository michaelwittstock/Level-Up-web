import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  notionVersion: "2022-06-28",
});

// ---- Database IDs (Personal Level Up hub) ----
export const DB = {
  todo:     "19525df701d14d278163fb6954278917", // ✅ To-Do & Brain Dump
  routines: "1035973dfe3143faa11b86298a0032fb", // 🔁 Routines & Habits
  quotes:   "e1147eed857b48d0a2a7be03bfd2668a", // 💬 Quotes
  h75:      "7c2ee1019e85489fb24ee3385bc0b1c7", // 🔥 75 Hard Tracker
  goals:    "d395ac413db14be2b55f16909e219427", // 🎯 Goals & Dreams
  grat:     "b4aa46dcb40f46408f124980b6d67f9e", // 🙏 Gratitude & Wins
  courses:  "8d662e89dddb479596d83dfe1316fed8", // 📚 Courses
  library:  "9c4b369ee79b46e49f328869cd679c2d", // 📖 Library
};

// The 7 daily 75 Hard checkboxes: [notion property, display label]
export const H75 = [
  ["✅ Diet", "Diet on point"],
  ["💪 Workout 1", "Workout 1 (45m)"],
  ["🌳 Workout 2 (outdoors)", "Workout 2 outdoors"],
  ["💧 Water 4.5L", "Water 4.5L"],
  ["📖 Read 10 pages", "Read 10 pages"],
  ["📸 Progress photo", "Progress photo"],
  ["🚫 No alcohol/cheats", "No alcohol / cheats"],
];

// ---- Property readers ----
export function titleText(page) {
  const props = page.properties || {};
  for (const k in props) {
    const p = props[k];
    if (p && p.type === "title") return (p.title || []).map((t) => t.plain_text).join("");
  }
  return "";
}
export function text(page, name) {
  const p = page.properties?.[name];
  if (!p) return "";
  if (p.type === "rich_text") return (p.rich_text || []).map((t) => t.plain_text).join("");
  if (p.type === "title") return (p.title || []).map((t) => t.plain_text).join("");
  return "";
}
export function sel(page, name) {
  return page.properties?.[name]?.select?.name || "";
}
export function num(page, name) {
  const v = page.properties?.[name]?.number;
  return typeof v === "number" ? v : 0;
}
export function check(page, name) {
  return !!page.properties?.[name]?.checkbox;
}

// His Fitness page (under the "Michael Wittstock" page — the integration must be
// connected to that page too, or /api/workouts will 404).
export const FITNESS_PAGE = "37912bda5ed24775b570b66222c1661a";

// List a block's children, following pagination.
export async function blockChildren(block_id, cap = 300) {
  let results = [];
  let cursor = undefined;
  do {
    const r = await notion.blocks.children.list({ block_id, page_size: 100, start_cursor: cursor });
    results = results.concat(r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor && results.length < cap);
  return results;
}

export function plainText(rich) {
  return (rich || []).map((t) => t.plain_text).join("");
}

// Query a database, following pagination (Notion caps page_size at 100).
export async function queryAll(database_id, body = {}, cap = 500) {
  let results = [];
  let cursor = undefined;
  do {
    const r = await notion.databases.query({
      database_id,
      page_size: 100,
      start_cursor: cursor,
      ...body,
    });
    results = results.concat(r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor && results.length < cap);
  return results;
}
