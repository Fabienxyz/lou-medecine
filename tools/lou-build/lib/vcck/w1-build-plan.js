/**
 * Build CompositionPlan for W1 families — deterministic, no author coordinates.
 */

import { measureText, wrapText } from "../text-fit.js";
import { createPlanShell } from "./w1-composition-plan.js";
import { W1_VERTICAL_LAYOUT, W1_DECISION_LAYOUT, W1_VIEWPORT_WIDTHS } from "./w1-constants.js";
import { layoutTwoPoleSvgPlan } from "./w1-two-pole-svg.js";
import { layoutFlatConcurrentSvgPlan } from "./w1-flat-concurrent-svg.js";
import { checkBudgets } from "./budgets.js";

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function maxLabelWords(spec) {
  const labels = [];
  const push = (s) => {
    if (s?.trim()) labels.push(s);
  };
  push(spec.question);
  for (const n of spec.nodes || []) push(n.label);
  for (const p of spec.poles || []) push(p.label);
  for (const d of spec.dimensions || []) {
    push(d.label);
    for (const c of d.cells || []) for (const item of c.items || []) push(item.label);
  }
  for (const g of spec.groups || []) for (const item of g.items || []) push(item.label);
  if (spec.set?.label) push(spec.set.label);
  let max = 0;
  for (const l of labels) max = Math.max(max, countWords(l));
  return max;
}

function sizeTextBox(label, cfg) {
  const wrapped = wrapText(label, cfg.nodeMaxWidth - 2 * cfg.nodePaddingX, cfg.fontSize, cfg.fontWeight, {
    maxLines: cfg.nodeMaxLines,
  });
  if (!wrapped.ok) return { ok: false, errors: ["UNSUPPORTED_TEXT_LOAD"] };
  const width = Math.min(
    cfg.nodeMaxWidth,
    Math.max(cfg.nodeMinWidth, Math.ceil(wrapped.width + 2 * cfg.nodePaddingX)),
  );
  const height = Math.ceil(2 * cfg.nodePaddingY + wrapped.lines.length * cfg.lineHeight);
  return { ok: true, width, height, lines: wrapped.lines };
}

function wrapTitle(question, cfg, innerWidth) {
  const wrapped = wrapText(question, innerWidth, cfg.titleFontSize, cfg.titleFontWeight, {
    maxLines: cfg.titleMaxLines || 3,
  });
  if (!wrapped.ok) return { ok: false, errors: ["UNSUPPORTED_TEXT_LOAD"] };
  return { ok: true, lines: wrapped.lines, width: wrapped.width };
}

function buildVerticalSvgPlan(spec, contract, options) {
  const cfg = options.layout || W1_VERTICAL_LAYOUT;
  const family = options.family;
  const nodes = options.nodes || spec.nodes || [];
  const edges = options.edges || [];
  const order = contract.canonicalOrder;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const sized = [];
  for (const id of order) {
    const node = nodeById.get(id);
    const box = sizeTextBox(node.label, cfg);
    if (!box.ok) return { ok: false, errors: box.errors };
    sized.push({ id, node, ...box });
  }

  const maxNodeWidth = Math.max(...sized.map((s) => s.width));
  const titleProbe = wrapTitle(spec.question, cfg, cfg.nodeMaxWidth);
  if (!titleProbe.ok) return { ok: false, errors: titleProbe.errors };
  const innerWidth = Math.max(maxNodeWidth, Math.ceil(titleProbe.width));
  const title = wrapTitle(spec.question, cfg, innerWidth);
  if (!title.ok) return { ok: false, errors: title.errors };

  const titlePaddingTop = cfg.titlePaddingTop ?? 8;
  const titlePaddingBottom = cfg.titlePaddingBottom ?? 12;
  const titleBlockHeight =
    titlePaddingTop + title.lines.length * cfg.titleLineHeight + titlePaddingBottom;

  const canvasWidth = innerWidth + 2 * cfg.margin;
  const centreX = cfg.margin + innerWidth / 2;
  const titleStartY = cfg.margin + titlePaddingTop + cfg.titleFontSize;
  let y = cfg.margin + titleBlockHeight;

  const plan = createPlanShell(family, "svg");
  plan.titleLines = title.lines;
  plan.titleBox = {
    centreX,
    startY: titleStartY,
    innerWidth,
    blockHeight: titleBlockHeight,
    lineCount: title.lines.length,
    role: "title",
  };
  plan.canonicalOrder = [...order];

  const elements = [];
  const slots = [];
  for (let i = 0; i < sized.length; i++) {
    const s = sized[i];
    const x = Math.round(centreX - s.width / 2);
    const box = { x, y, width: s.width, height: s.height };
    const ports = {
      north: { x: x + s.width / 2, y },
      south: { x: x + s.width / 2, y: y + s.height },
    };
    elements.push({
      id: s.id,
      kind: s.node.kind,
      label: s.node.label,
      textLines: s.lines,
      box,
      ports,
      terminal: options.terminalId === s.id,
    });
    slots.push({ id: `slot-${i}`, level: i, centreX, y, width: innerWidth });
    plan.levels.push({ level: i, slot: i, elementId: s.id });
    y += s.height + cfg.rowGap;
  }

  plan.elements = [
    {
      id: "__title__",
      role: "title",
      kind: "title",
      box: {
        x: centreX - innerWidth / 2,
        y: cfg.margin,
        width: innerWidth,
        height: titleBlockHeight,
      },
      textLines: title.lines,
    },
    ...elements,
  ];
  plan.slots = slots;

  const routes = [];
  for (let i = 0; i < order.length - 1; i++) {
    const from = elements[i];
    const to = elements[i + 1];
    const edgeMeta = edges.find((e) => e.from === from.id && e.to === to.id) || {};
    routes.push({
      from: from.id,
      to: to.id,
      fromPort: "south",
      toPort: "north",
      relation: edgeMeta.relation || edgeMeta.condition || "sequence",
      segments: [
        { x1: from.ports.south.x, y1: from.ports.south.y, x2: to.ports.north.x, y2: to.ports.north.y },
      ],
    });
  }
  plan.routes = routes;

  const height = Math.ceil(y - cfg.rowGap + cfg.margin);
  plan.dimensions = { width: canvasWidth, height };

  const budget = checkBudgets(spec, { familyId: family });
  plan.budgetConsumed = {
    ...(budget.detail || {}),
    maxLabelWords: maxLabelWords(spec),
    nodeCount: order.length,
    edgeCount: routes.length,
  };

  plan.typography = {
    fontSize: cfg.fontSize,
    fontWeight: cfg.fontWeight,
    lineHeight: cfg.lineHeight,
    titleFontSize: cfg.titleFontSize,
    titleFontWeight: cfg.titleFontWeight,
    titleLineHeight: cfg.titleLineHeight,
    cornerRadius: cfg.cornerRadius,
    textBaselineFactor: cfg.textBaselineFactor ?? 0.75,
  };

  return { ok: true, plan };
}

export function buildCompositionPlan(spec, family, contract) {
  switch (family) {
    case "chain": {
      const edges = (spec.edges || []).filter((e) => e.relation !== "feeds_back");
      return buildVerticalSvgPlan(spec, contract, {
        family: "chain",
        layout: W1_VERTICAL_LAYOUT,
        nodes: spec.nodes,
        edges,
      });
    }
    case "dependent-sequence": {
      const branches = spec.branches || [];
      const pseudoEdges = branches.map((b) => ({ from: b.from, to: b.to, relation: "sequence" }));
      return buildVerticalSvgPlan(spec, contract, {
        family: "dependent-sequence",
        layout: W1_DECISION_LAYOUT,
        nodes: spec.nodes,
        edges: pseudoEdges,
        terminalId: contract.terminalId,
      });
    }
    case "two-pole":
      return buildTwoPolePlan(spec, contract);
    case "flat-concurrent":
      return buildFlatConcurrentPlan(spec, contract);
    default:
      return { ok: false, errors: [`unsupported W1 family ${family}`] };
  }
}

function buildTwoPolePlan(spec, contract) {
  const poles = spec.poles || [];
  const dimensions = spec.dimensions || [];
  const plan = createPlanShell("two-pole", "svg");
  plan.canonicalOrder = [...contract.poleOrder, ...contract.dimensionOrder];
  plan.titleLines = [spec.question];

  const elements = [];
  for (const poleId of contract.poleOrder) {
    const pole = poles.find((p) => p.id === poleId);
    if (pole) elements.push({ id: pole.id, role: "pole", label: pole.label, pole_type: pole.pole_type });
  }
  for (const dimId of contract.dimensionOrder) {
    const dim = dimensions.find((d) => d.id === dimId);
    if (!dim) continue;
    const cells = {};
    for (const cell of dim.cells || []) {
      cells[cell.pole] = (cell.items || []).map((item) => ({
        id: item.id,
        label: item.label,
        class: item.class,
      }));
    }
    elements.push({
      id: dim.id,
      role: "dimension",
      label: dim.label,
      cells,
    });
  }
  plan.elements = elements;

  const reflow = {};
  for (const w of W1_VIEWPORT_WIDTHS) {
    reflow[w] = { mode: "comparison-bands", columns: poles.length };
  }
  plan.reflowByWidth = reflow;

  const budget = checkBudgets(spec, { familyId: "two-pole" });
  plan.budgetConsumed = {
    ...(budget.detail || {}),
    maxLabelWords: maxLabelWords(spec),
    poleCount: poles.length,
    dimensionCount: dimensions.length,
  };

  return layoutTwoPoleSvgPlan(spec, plan);
}

function buildFlatConcurrentPlan(spec, contract) {
  const groups = spec.groups || [];
  const items = groups.length === 1 ? groups[0].items || [] : [];
  const orderedIds = contract.canonicalOrder;
  const itemById = new Map(items.map((i) => [i.id, i]));

  const plan = createPlanShell("flat-concurrent", "svg");
  plan.canonicalOrder = orderedIds;
  plan.titleLines = [spec.question];
  plan.elements = orderedIds.map((id) => {
    const item = itemById.get(id);
    return { id, role: "item", label: item.label, class: item.class };
  });

  const reflow = {};
  for (const w of W1_VIEWPORT_WIDTHS) {
    const textHeavy = maxLabelWords(spec) > 8;
    const cols = w < 530 || textHeavy ? 1 : w < 768 ? 2 : w < 1280 ? 3 : 4;
    reflow[w] = { mode: "grid", columns: Math.min(cols, items.length || 1) };
  }
  plan.reflowByWidth = reflow;

  const budget = checkBudgets(spec, { familyId: "flat-concurrent" });
  plan.budgetConsumed = {
    ...(budget.detail || {}),
    maxLabelWords: maxLabelWords(spec),
    itemCount: items.length,
  };

  return layoutFlatConcurrentSvgPlan(spec, plan);
}
