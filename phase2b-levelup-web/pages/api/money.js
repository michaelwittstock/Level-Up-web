import { notion, titleText, sel, num, text, queryAll } from "../../lib/notion";

const NETWORTH_DB = "081ec9b7fbaf434f8d32c6509d4e3ee1"; // 💰 Net Worth

// GET  /api/money            -> { items, assets, liabilities, net }
// POST /api/money {id,value} -> update an item's Value
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { id, value } = req.body || {};
      if (!id || typeof value !== "number") return res.status(400).json({ error: "bad request" });
      await notion.pages.update({ page_id: id, properties: { Value: { number: value } } });
      return res.status(200).json({ ok: true });
    }
    const pages = await queryAll(NETWORTH_DB);
    const items = pages.map((p) => ({
      id: p.id,
      item: titleText(p),
      type: sel(p, "Type"),
      category: sel(p, "Category"),
      value: num(p, "Value"),
      notes: text(p, "Notes"),
    }));
    const assets = items.filter((i) => i.type.includes("Asset")).reduce((s, i) => s + i.value, 0);
    const liabilities = items.filter((i) => i.type.includes("Liability")).reduce((s, i) => s + i.value, 0);
    res.status(200).json({ items, assets, liabilities, net: assets - liabilities });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
