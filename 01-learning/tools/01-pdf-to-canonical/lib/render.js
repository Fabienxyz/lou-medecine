/**
 * Render internal document blocks to canonical Markdown.
 */

import { BlockType } from "./blocks.js";
import { formatWarningsAsComments } from "./warnings.js";

/**
 * @param {import('./blocks.js').Block[]} blocks
 * @param {{ warnings?: ReturnType<import('./warnings.js').createWarningCollector> }} [ctx]
 */
export function renderDocument(blocks, ctx = {}) {
  /** @type {string[]} */
  const out = [];
  /** @type {string[]} */
  const headingTexts = [];

  for (const b of blocks) {
    switch (b.type) {
      case BlockType.Heading: {
        const marks = "#".repeat(Math.min(6, Math.max(1, b.level || 1)));
        const heading = `${marks} ${b.text}`;
        out.push("", heading, "");
        headingTexts.push(heading);
        break;
      }
      case BlockType.Paragraph:
        out.push(b.text || "");
        break;
      case BlockType.List: {
        const indent = b.indent ? "  ".repeat(b.indent) : "";
        for (const item of b.items || []) {
          if (b.ordered) out.push(`${indent}${item}`);
          else out.push(`${indent}- ${item}`);
        }
        break;
      }
      case BlockType.Caption:
        out.push("", `*${b.text}*`, "");
        break;
      case BlockType.Figure:
        out.push("", `*${b.caption || b.text || ""}*`, "");
        break;
      case BlockType.Box: {
        const title = [b.id, b.title].filter(Boolean).join(" ").trim();
        out.push("", `> **${title}**`, "");
        for (const line of b.body || []) {
          out.push(`> ${line}`);
        }
        out.push("");
        break;
      }
      case BlockType.HierarchyTable:
      case BlockType.DataTable:
        if (b.markdown) out.push("", b.markdown, "");
        break;
      default:
        if (b.text) out.push(b.text);
        break;
    }
  }

  let markdown = finalizeMarkdown(out);
  if (ctx.warnings) {
    markdown += formatWarningsAsComments(ctx.warnings.list());
  }
  return { markdown, headingTexts };
}

function finalizeMarkdown(parts) {
  let md = parts.join("\n");
  md = md.replace(/[ \t]+\n/g, "\n");
  md = md.replace(/\n{3,}/g, "\n\n");
  md = md.replace(/^\n+/, "");
  if (!md.endsWith("\n")) md += "\n";
  return md;
}
