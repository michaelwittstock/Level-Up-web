import { Client } from "@notionhq/client";

// Notion client. The token comes from an environment variable — never hard-code it.
export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  notionVersion: "2022-06-28",
});

// ---- Your database IDs (already filled in for the Personal Level Up hub) ----
export const DB = {
  todo:     "19525df701d14d278163fb6954278917", // ✅ To-Do & Brain Dump
  quotes:   "e1147eed857b48d0a2a7be03bfd2668a", // 💬 Quotes
  routines: "1035973dfe3143faa11b86298a0032fb", // 🔁 Routines & Habits
  h75:      "7c2ee1019e85489fb24ee3385bc0b1c7", // 🔥 75 Hard Tracker
};

// ---- Property names. If a query returns nothing, open the DB in Notion and
// ---- confirm these match exactly (emoji included), then adjust here. --------
export const PROP = {
  todoStatus: "Status",      // select property on the To-Do DB
  doneValue:  "✅ Done",      // the "done" option label
  quote:      "Quote",       // title property on the Quotes DB
  author:     "Author",      // text property on the Quotes DB
  favorite:   "⭐ Favorite",  // checkbox property on the Quotes DB
};

// Get the title property's plain text on any page (schema-agnostic).
export function titleText(page) {
  const props = page.properties || {};
  for (const k in props) {
    const p = props[k];
    if (p && p.type === "title") return (p.title || []).map((t) => t.plain_text).join("");
  }
  return "(untitled)";
}

// Get plain text from a rich_text or title property.
export function richText(prop) {
  if (!prop) return "";
  if (prop.type === "rich_text") return (prop.rich_text || []).map((t) => t.plain_text).join("");
  if (prop.type === "title") return (prop.title || []).map((t) => t.plain_text).join("");
  return "";
}
