/**
 * CompositionPlan validation — computed composition decisions only.
 */

import { W1_CONTRACT_VERSION } from "./w1-constants.js";
import { segmentIntersectsRectPlan } from "./svg-geom-independent.js";
import { GEOM_AXIS_EPS } from "./geom-segments.js";

export function createPlanShell(family, technology) {
  return {
    family,
    contractVersion: W1_CONTRACT_VERSION[family] || "W1-unknown",
    technology,
    canonicalOrder: [],
    levels: [],
    slots: [],
    elements: [],
    ports: [],
    routes: [],
    dimensions: { width: 0, height: 0 },
    titleLines: [],
    budgetConsumed: {},
    reflowByWidth: {},
    diagnostics: [],
  };
}

function boxesOverlap(a, b, eps = 0.5) {
  return !(
    a.x + a.width <= b.x + eps ||
    b.x + b.width <= a.x + eps ||
    a.y + a.height <= b.y + eps ||
    b.y + b.height <= a.y + eps
  );
}

function segmentIntersectsRect(seg, rect, eps = GEOM_AXIS_EPS) {
  return segmentIntersectsRectPlan(seg, rect, eps);
}

export function validateCompositionPlan(plan) {
  const errors = [];
  const tech = plan?.technology;
  if (!tech) {
    errors.push("plan: missing technology");
  } else if (tech !== "svg") {
    errors.push(`plan: unknown technology "${tech}"`);
  }
  const isSvg = tech === "svg";

  if (!plan?.family || !plan?.contractVersion) {
    errors.push("plan: missing family or contractVersion");
  }
  if (isSvg) {
    if (!Number.isFinite(plan.dimensions?.width) || !Number.isFinite(plan.dimensions?.height)) {
      errors.push("plan: dimensions must be finite");
    }
    if ((plan.dimensions?.width ?? 0) <= 0 || (plan.dimensions?.height ?? 0) <= 0) {
      errors.push("plan: dimensions must be positive");
    }
  }

  const expectedSlots = plan.levels?.length ?? plan.canonicalOrder?.length ?? 0;
  if (isSvg && plan.slots?.length !== expectedSlots) {
    errors.push(`plan: expected ${expectedSlots} slots, found ${plan.slots?.length ?? 0}`);
  }

  const placed = new Set();
  for (const el of plan.elements || []) {
    if (placed.has(el.id)) errors.push(`plan: duplicate element ${el.id}`);
    placed.add(el.id);
    if (isSvg && (!el.box || !Number.isFinite(el.box.width) || !Number.isFinite(el.box.height))) {
      errors.push(`plan: element ${el.id} has invalid box`);
    }
  }
  for (const id of plan.canonicalOrder || []) {
    if (!placed.has(id)) errors.push(`plan: canonical element ${id} not placed`);
  }

  for (const route of plan.routes || []) {
    const fromEl = plan.elements.find((e) => e.id === route.from);
    const toEl = plan.elements.find((e) => e.id === route.to);
    if (!fromEl?.ports?.[route.fromPort]) {
      errors.push(`plan: route ${route.from}->${route.to} missing fromPort`);
    }
    if (!toEl?.ports?.[route.toPort]) {
      errors.push(`plan: route ${route.from}->${route.to} missing toPort`);
    }
  }

  if (isSvg) {
    const boxes = (plan.elements || []).map((e) => ({ id: e.id, ...e.box }));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (boxesOverlap(boxes[i], boxes[j])) {
          errors.push(`plan: box collision ${boxes[i].id} vs ${boxes[j].id}`);
        }
      }
    }

    for (const route of plan.routes || []) {
      for (const seg of route.segments || []) {
        for (const box of boxes) {
          if (box.id === route.from || box.id === route.to) continue;
          if (segmentIntersectsRect(seg, box)) {
            errors.push(`plan: route crosses box ${box.id}`);
          }
        }
      }
    }
  }

  if (!plan.budgetConsumed) errors.push("plan: budgetConsumed missing");

  if (isSvg && plan.titleBox) {
    const tb = plan.titleBox;
    const canvasW = plan.dimensions?.width ?? 0;
    const canvasH = plan.dimensions?.height ?? 0;
    const titleEl = (plan.elements || []).find((e) => e.role === "title" || e.id === "__title__");
    const titleRect = titleEl?.box
      ? { x: titleEl.box.x, y: titleEl.box.y, width: titleEl.box.width, height: titleEl.box.height }
      : {
          x: (tb.centreX ?? canvasW / 2) - (tb.innerWidth ?? 0) / 2,
          y: Math.max(0, (tb.startY ?? 0) - (tb.blockHeight ?? tb.lineCount * 24)),
          width: tb.innerWidth ?? 0,
          height: tb.blockHeight ?? tb.lineCount * 24,
        };
    if (
      titleRect.y < 0 ||
      titleRect.x < 0 ||
      titleRect.y + titleRect.height > canvasH ||
      titleRect.x + titleRect.width > canvasW
    ) {
      errors.push("plan: title outside canvas");
    }
    if (titleRect.width > canvasW) errors.push("plan: title exceeds canvas width");
    const firstNode = (plan.elements || []).find((e) => e.role !== "title" && e.id !== "__title__" && e.box);
    if (firstNode?.box && boxesOverlap(titleRect, firstNode.box)) {
      errors.push("plan: title overlaps first node");
    }
    for (const route of plan.routes || []) {
      for (const seg of route.segments || []) {
        if (segmentIntersectsRect(seg, titleRect)) {
          errors.push("plan: title crosses route");
        }
      }
    }
    const titleElement = (plan.elements || []).find((e) => e.role === "title" || e.id === "__title__");
    if (titleElement && (!titleElement.textLines?.length && plan.titleLines?.length)) {
      errors.push("plan: title element missing textLines");
    }
    if (titleElement?.textLines?.length && tb.lineCount != null && titleElement.textLines.length > tb.lineCount) {
      errors.push("plan: title lines overflow titleBox");
    }
  } else if (isSvg && (plan.titleLines?.length || plan.family)) {
    errors.push("plan: titleBox missing");
  }

  return { ok: errors.length === 0, errors };
}

export function mutatePlan(plan, mutantId) {
  const copy = structuredClone(plan);
  switch (mutantId) {
    case "infinite-width":
      copy.dimensions.width = Infinity;
      break;
    case "missing-slot":
      copy.slots = copy.slots.slice(0, -1);
      break;
    case "duplicate-element":
      if (copy.elements.length) copy.elements.push({ ...copy.elements[0] });
      break;
    case "missing-port":
      {
        const nodeEl = copy.elements.find((e) => e.ports);
        if (nodeEl?.ports) delete nodeEl.ports.south;
      }
      break;
    case "route-through-box":
      if (copy.routes.length >= 3 && copy.elements.length > 3) {
        const obstacle = copy.elements[1];
        copy.routes[2].segments.push({
          x1: obstacle.box.x,
          y1: obstacle.box.y + obstacle.box.height / 2,
          x2: obstacle.box.x + obstacle.box.width,
          y2: obstacle.box.y + obstacle.box.height / 2,
        });
      }
      break;
    case "box-collision":
      {
        const nodes = copy.elements.filter((e) => e.role !== "title" && e.id !== "__title__");
        if (nodes.length >= 2) {
          nodes[1].box.x = nodes[0].box.x;
          nodes[1].box.y = nodes[0].box.y;
        }
      }
      break;
    case "missing-budget":
      delete copy.budgetConsumed;
      break;
    case "title-overlaps-node":
      {
        const titleEl = copy.elements.find((e) => e.role === "title" || e.id === "__title__");
        const nodeEl = copy.elements.find((e) => e.role !== "title" && e.id !== "__title__" && e.box);
        if (titleEl?.box && nodeEl?.box) {
          nodeEl.box.y = titleEl.box.y;
          nodeEl.box.x = titleEl.box.x;
        }
      }
      break;
    case "title-outside-canvas":
      {
        const titleEl = copy.elements.find((e) => e.role === "title" || e.id === "__title__");
        if (titleEl?.box) titleEl.box.y = -50;
        if (copy.titleBox) copy.titleBox.startY = -40;
      }
      break;
    case "title-crosses-route":
      if (copy.routes.length && copy.titleBox) {
        const tb = copy.titleBox;
        const midY = (copy.elements.find((e) => e.role !== "title")?.box?.y ?? tb.startY) - 10;
        copy.routes[0].segments.push({
          x1: 0,
          y1: midY,
          x2: copy.dimensions.width,
          y2: midY,
        });
      }
      break;
    case "title-missing":
      copy.elements = copy.elements.filter((e) => e.role !== "title" && e.id !== "__title__");
      delete copy.titleBox;
      copy.titleLines = [];
      break;
    case "title-lines-overflow":
      {
        const titleEl = copy.elements.find((e) => e.role === "title" || e.id === "__title__");
        if (titleEl) {
          titleEl.textLines = [...(titleEl.textLines || []), "overflow line one", "overflow line two", "overflow line three"];
        }
        if (copy.titleBox) copy.titleBox.lineCount = 1;
      }
      break;
    default:
      throw new Error(`unknown plan mutant: ${mutantId}`);
  }
  return copy;
}

export const TITLE_MUTANT_IDS = Object.freeze([
  "title-overlaps-node",
  "title-outside-canvas",
  "title-crosses-route",
  "title-missing",
  "title-lines-overflow",
]);

export const PLAN_MUTANT_IDS = [
  "infinite-width",
  "missing-slot",
  "duplicate-element",
  "missing-port",
  "route-through-box",
  "box-collision",
  "missing-budget",
];
