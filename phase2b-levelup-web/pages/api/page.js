import { notion, blockChildren, plainText, titleText } from "../../lib/notion";

// GET  /api/page?id=<pageId>                  -> { title, blocks: [...] } (in-app reader)
// POST /api/page { pageId, note }             -> appends a dated note paragraph
// POST /api/page { blockId, checked }         -> toggles a to-do block
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { pageId, note, blockId, checked } = req.body || {};
      if (blockId !== undefined) {
        await notion.blocks.update({ block_id: blockId, to_do: { checked: !!checked } });
        return res.status(200).json({ ok: true });
      }
      if (!pageId || !note) return res.status(400).json({ error: "missing pageId/note" });
      const stamp = new Date().toISOString().slice(0, 10);
      await notion.blocks.children.append({
        block_id: pageId,
        children: [
          {
            paragraph: {
              rich_text: [{ text: { content: `📝 ${stamp} — ${note}` } }],
            },
          },
        ],
      });
      return res.status(200).json({ ok: true });
    }

    const id = String(req.query.id || "");
    if (!id) return res.status(400).json({ error: "missing id" });

    const page = await notion.pages.retrieve({ page_id: id }).catch(() => null);
    const title = page ? titleText(page) : "";
    const raw = await blockChildren(id);

    // Flatten to simple blocks; pull one level of children for toggles/lists.
    const blocks = [];
    for (const b of raw) {
      const simple = simplify(b);
      if (simple) blocks.push(simple);
      if (b.has_children && ["toggle", "bulleted_list_item", "numbered_list_item", "heading_1", "heading_2", "heading_3"].includes(b.type)) {
        const kids = await blockChildren(b.id, 100);
        for (const k of kids) {
          const s = simplify(k);
          if (s) blocks.push({ ...s, indent: 1 });
        }
      }
      if (blocks.length > 220) break; // keep payload sane
    }
    res.status(200).json({ title, blocks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function simplify(b) {
  const t = b.type;
  const d = b[t];
  switch (t) {
    case "paragraph":
    case "quote":
    case "callout":
      return textBlock(t === "paragraph" ? "p" : t, d.rich_text);
    case "heading_1": return textBlock("h1", d.rich_text);
    case "heading_2": return textBlock("h2", d.rich_text);
    case "heading_3": return textBlock("h3", d.rich_text);
    case "bulleted_list_item": return textBlock("li", d.rich_text);
    case "numbered_list_item": return textBlock("nli", d.rich_text);
    case "toggle": return textBlock("h3", d.rich_text);
    case "to_do": {
      const s = textBlock("todo", d.rich_text);
      return s ? { ...s, id: b.id, checked: !!d.checked } : null;
    }
    case "divider": return { kind: "hr" };
    case "child_page": return { kind: "h3", text: "📄 " + b.child_page.title };
    default: return null;
  }
}
function textBlock(kind, rich) {
  const text = plainText(rich);
  return text ? { kind, text } : null;
}
