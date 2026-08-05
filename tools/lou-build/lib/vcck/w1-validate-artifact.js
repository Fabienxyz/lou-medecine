/**
 * Independent artifact validation after W1 serialization — no plan dependency for verdict.
 */

import { validateSvgSerialized } from "../svg-dimension-validate.js";
import {
  extractNodeBoxesFromSvg,
  validateSvgGeometryIndependent,
} from "./svg-geom-independent.js";

/** Edge paths that carry data-edge-id directly on the path element — W1 strict mode. */
export function extractIdentifiedEdgePaths(svgText) {
  const edges = [];
  const re = /<path\b[^>]*>/g;
  let m;
  while ((m = re.exec(svgText)) !== null) {
    const tag = m[0];
    if (!tag.includes("data-edge-id=")) continue;
    const id = tag.match(/data-edge-id="([^"]+)"/)?.[1];
    const path = tag.match(/\bd="([^"]+)"/)?.[1];
    if (id && path) edges.push({ id, path });
  }
  return edges;
}

function countHtmlItems(html, selector) {
  const re = new RegExp(selector, "g");
  let count = 0;
  while (re.exec(html)) count++;
  return count;
}

/** Independent artifact check — title clipped by shrunk viewBox. */
export function validateW1ArtifactTitleClip(artifact) {
  const errors = [];
  const vb = artifact.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (!vb) return { ok: false, errors: ["artifact: missing viewBox"] };
  const canvasH = parseFloat(vb[2]);
  const titleTag = artifact.match(/<text\b[^>]*class="vg-title"[^>]*>/);
  if (!titleTag) return { ok: false, errors: ["artifact: title missing in serialized SVG"] };
  const yMatch =
    titleTag[0].match(/\by="(\d+(?:\.\d+)?)"/) ||
    artifact.match(/<text\b[^>]*\by="(\d+(?:\.\d+)?)"[^>]*class="vg-title"/);
  if (!yMatch) return { ok: false, errors: ["artifact: title missing y coordinate in serialized SVG"] };
  const titleBlock = artifact.match(/<text\b[^>]*class="vg-title"[^>]*>[\s\S]*?<\/text>/);
  let estHeight = parseFloat(yMatch[1]);
  if (titleBlock) {
    for (const t of titleBlock[0].matchAll(/<tspan[^>]*dy="(\d+(?:\.\d+)?)"/g)) {
      estHeight += parseFloat(t[1]);
    }
  }
  if (parseFloat(yMatch[1]) > canvasH) errors.push("artifact: title clipped outside viewBox");
  if (estHeight > canvasH + 4) errors.push("artifact: title lines overflow viewBox height");
  return { ok: errors.length === 0, errors };
}

export function mutateArtifactTitleClip(artifact) {
  return artifact.replace(/viewBox="0 0 (\d+) (\d+)"/, 'viewBox="0 0 $1 40"');
}

export function validateW1Artifact(spec, artifact, kind, expectedCounts = {}) {
  const errors = [];

  if (kind === "svg") {
    const ser = validateSvgSerialized(artifact);
    if (!ser.ok) errors.push(...ser.errors);

    const nodes = extractNodeBoxesFromSvg(artifact);
    const edges = extractIdentifiedEdgePaths(artifact);

    if (expectedCounts.nodes != null && nodes.length !== expectedCounts.nodes) {
      errors.push(`artifact: expected ${expectedCounts.nodes} nodes, observed ${nodes.length}`);
    }
    if (expectedCounts.edges != null && edges.length !== expectedCounts.edges) {
      errors.push(`artifact: expected ${expectedCounts.edges} edges, observed ${edges.length}`);
    }
    if (nodes.length === 0) errors.push("artifact: zero nodes observed");
    if (expectedCounts.edges != null && expectedCounts.edges > 0 && edges.length === 0) {
      errors.push("artifact: relation paths missing data-edge-id");
    }

    for (const edge of edges) {
      if (/[QqCcAa]/.test(edge.path)) {
        errors.push(`artifact: curved edge detected in ${edge.id}`);
      }
    }

    const geom = validateSvgGeometryIndependent(artifact);
    if (!geom.ok) errors.push(...geom.errors);
  }

  if (kind === "html") {
    if (!artifact.includes("vg-question")) errors.push("artifact: missing vg-question");
    if (spec.primitive === "comparison-matrix") {
      const tableCells = countHtmlItems(artifact, 'data-item-id="');
      const mobileCells = countHtmlItems(artifact, 'class="vg-matrix-card"');
      if (expectedCounts.items != null && tableCells !== expectedCounts.items * 2) {
        errors.push(`artifact: table/mobile item parity mismatch (${tableCells} li, expected ${expectedCounts.items * 2})`);
      }
      if (mobileCells !== expectedCounts.dimensions) {
        errors.push(`artifact: expected ${expectedCounts.dimensions} mobile cards, found ${mobileCells}`);
      }
    }
    if (spec.primitive === "enumeration-set") {
      const items = countHtmlItems(artifact, 'data-item-id="');
      if (expectedCounts.items != null && items !== expectedCounts.items) {
        errors.push(`artifact: expected ${expectedCounts.items} items, observed ${items}`);
      }
      if (items === 0) errors.push("artifact: zero list items observed");
    }
  }

  return { ok: errors.length === 0, errors };
}

export function expectedCountsFromSpec(spec, family) {
  switch (family) {
    case "chain":
      return {
        nodes: (spec.nodes || []).length,
        edges: (spec.edges || []).filter((e) => e.relation !== "feeds_back").length,
      };
    case "dependent-sequence": {
      const connected = new Set();
      for (const b of spec.branches || []) {
        connected.add(b.from);
        connected.add(b.to);
      }
      return { nodes: connected.size, edges: (spec.branches || []).length };
    }
    case "two-pole": {
      const dims = (spec.dimensions || []).length;
      const poles = (spec.poles || []).length;
      let items = 0;
      for (const d of spec.dimensions || []) {
        for (const c of d.cells || []) items += (c.items || []).length;
      }
      return { dimensions: dims * poles, items };
    }
    case "flat-concurrent": {
      const g = spec.groups || [];
      const items = g.length === 1 ? (g[0].items || []).length : 0;
      return { items };
    }
    default:
      return {};
  }
}
