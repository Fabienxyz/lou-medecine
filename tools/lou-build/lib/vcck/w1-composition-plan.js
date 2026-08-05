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
  } else if (tech !== "svg" && tech !== "html") {
    errors.push(`plan: unknown technology "${tech}"`);
  }
  const isHtml = tech === "html";
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
      if (copy.elements[0]?.ports) delete copy.elements[0].ports.south;
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
      if (copy.elements.length >= 2) {
        copy.elements[1].box.x = copy.elements[0].box.x;
        copy.elements[1].box.y = copy.elements[0].box.y;
      }
      break;
    case "missing-budget":
      delete copy.budgetConsumed;
      break;
    default:
      throw new Error(`unknown plan mutant: ${mutantId}`);
  }
  return copy;
}

export const PLAN_MUTANT_IDS = [
  "infinite-width",
  "missing-slot",
  "duplicate-element",
  "missing-port",
  "route-through-box",
  "box-collision",
  "missing-budget",
];
