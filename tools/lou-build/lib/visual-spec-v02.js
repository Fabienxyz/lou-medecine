/**
 * visualSpec v0.2 — comparison-matrix, enumeration-set, quantity-model.
 * Semantic validation only; no geometry or CSS in specs.
 */

import { CLAIM_CLASSES, FORBIDDEN_GEOMETRY_KEYS, semanticDigest } from "./visual-spec.js";
import {
  validateDecisionAlgorithm,
  validateThresholdScale,
  visualSpecClaimUnitsLotB,
} from "./visual-spec-v02-lotb.js";

export const VISUAL_SPEC_VERSION_V02 = "0.2";

export const V02_PRIMITIVES = new Set([
  "comparison-matrix",
  "enumeration-set",
  "quantity-model",
  "decision-algorithm",
  "threshold-scale",
]);

export const POLE_TYPES = new Set(["entity", "context", "source-anchor"]);
export const CELL_ORDERING = new Set(["none", "ordered"]);
export const MEMBERSHIP_LOGIC = new Set(["all-of", "any-of", "concurrent-set"]);
export const ORDERING_SEMANTICS = new Set(["none", "priority", "frequency"]);
export const COVERAGE_TYPES = new Set(["exhaustive", "examples"]);
export const IDENTITY_RELATIONS = new Set([
  "identity-product",
  "identity-difference",
  "identity-ratio",
  "depends-on",
]);

const V02_BASE_KEYS = new Set([
  "spec_version",
  "primitive",
  "chapter",
  "element",
  "question",
  "technology",
  "provenance",
]);

const MATRIX_KEYS = new Set([...V02_BASE_KEYS, "poles", "dimensions"]);
const POLE_KEYS = new Set(["id", "label", "pole_type", "class", "kp"]);
const DIMENSION_KEYS = new Set(["id", "label", "class", "kp", "cells"]);
const CELL_KEYS = new Set(["pole", "items", "ordering"]);
const ITEM_KEYS = new Set(["id", "label", "class", "kp"]);

const ENUM_KEYS = new Set([...V02_BASE_KEYS, "set", "groups"]);
const SET_KEYS = new Set([
  "id",
  "label",
  "membership_logic",
  "ordering_semantics",
  "expected_cardinality",
  "class",
  "kp",
]);
const GROUP_KEYS = new Set([
  "id",
  "label",
  "purpose",
  "coverage",
  "condition",
  "items",
  "class",
  "kp",
  "membership_logic",
  "ordering_semantics",
  "expected_cardinality",
  "subsection_of",
  "subsection_label",
  "coverage_hint",
]);
const ENUM_ITEM_KEYS = new Set(["id", "label", "class", "kp", "condition"]);

const QUANTITY_KEYS = new Set([
  ...V02_BASE_KEYS,
  "target",
  "identities",
  "states",
  "insights",
]);
const TARGET_KEYS = new Set(["id", "label", "unit", "class", "kp"]);
const IDENTITY_KEYS = new Set(["id", "expression", "relation_type", "class", "kp"]);
const STATE_KEYS = new Set(["id", "label", "values"]);
const VALUE_KEYS = new Set(["quantity", "value", "unit", "class", "kp"]);
const INSIGHT_KEYS = new Set(["id", "label", "class", "kp"]);

const PROVENANCE_KEYS_V02 = new Set([
  "source_edition",
  "walkthrough",
  "methodology_version",
]);

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

function checkKeys(obj, allowed, where, errors) {
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) continue;
    if (FORBIDDEN_GEOMETRY_KEYS.has(key)) {
      errors.push(`${where}: forbidden geometry/style field "${key}" (contract I3)`);
    } else {
      errors.push(`${where}: unknown field "${key}"`);
    }
  }
}

function validateGrounding(unit, where, kpMap, errors) {
  if (!unit.class) {
    errors.push(`${where}: missing class`);
    return;
  }
  if (!CLAIM_CLASSES.has(unit.class)) {
    errors.push(`${where}: unknown class "${unit.class}"`);
    return;
  }
  const kp = unit.kp;
  if (unit.class === "scaffolding") {
    if (Array.isArray(kp) && kp.length > 0) {
      errors.push(`${where}: scaffolding must not claim KP grounding`);
    }
    return;
  }
  if (!Array.isArray(kp) || kp.length === 0) {
    errors.push(`${where}: class "${unit.class}" requires at least one KP reference`);
    return;
  }
  if (kpMap) {
    for (const kpId of kp) {
      if (!kpMap.has(kpId)) errors.push(`${where}: unknown KP reference ${kpId}`);
    }
  }
}

function rejectEdges(spec, errors) {
  if (Array.isArray(spec.edges) && spec.edges.length > 0) {
    errors.push("spec: edges forbidden for this primitive");
  }
  if (Array.isArray(spec.nodes) && spec.nodes.length > 0) {
    errors.push("spec: nodes forbidden for this primitive (use primitive schema)");
  }
}

export function validateComparisonMatrix(spec, kpMap, errors) {
  checkKeys(spec, MATRIX_KEYS, "spec", errors);
  rejectEdges(spec, errors);

  if (spec.technology !== "semantic-html") {
    errors.push(`spec: technology must be semantic-html for comparison-matrix`);
  }

  const poles = Array.isArray(spec.poles) ? spec.poles : [];
  if (poles.length < 2 || poles.length > 4) {
    errors.push(`spec: comparison-matrix requires 2–4 poles (found ${poles.length})`);
  }

  const poleIds = new Set();
  poles.forEach((pole, i) => {
    const where = `pole[${i}]`;
    checkKeys(pole, POLE_KEYS, where, errors);
    if (!pole.id || !ID_RE.test(pole.id)) errors.push(`${where}: invalid id`);
    else if (poleIds.has(pole.id)) errors.push(`${where}: duplicate id`);
    else poleIds.add(pole.id);
    if (!pole.label?.trim()) errors.push(`${where}: missing label`);
    if (!POLE_TYPES.has(pole.pole_type)) errors.push(`${where}: invalid pole_type`);
    validateGrounding(pole, where, kpMap, errors);
  });

  const dimensions = Array.isArray(spec.dimensions) ? spec.dimensions : [];
  if (dimensions.length === 0) errors.push("spec: dimensions must be non-empty");

  dimensions.forEach((dim, di) => {
    const dwhere = `dimension[${di}]`;
    checkKeys(dim, DIMENSION_KEYS, dwhere, errors);
    if (!dim.id || !ID_RE.test(dim.id)) errors.push(`${dwhere}: invalid id`);
    if (!dim.label?.trim()) errors.push(`${dwhere}: missing label`);
    if (dim.class) validateGrounding(dim, dwhere, kpMap, errors);

    const cells = Array.isArray(dim.cells) ? dim.cells : [];
    if (cells.length !== poleIds.size) {
      errors.push(`${dwhere}: expected ${poleIds.size} cells, found ${cells.length}`);
    }

    const seenPoles = new Set();
    cells.forEach((cell, ci) => {
      const cwhere = `${dwhere}.cell[${ci}]`;
      checkKeys(cell, CELL_KEYS, cwhere, errors);
      if (!poleIds.has(cell.pole)) errors.push(`${cwhere}: unknown pole "${cell.pole}"`);
      seenPoles.add(cell.pole);
      if (cell.ordering && !CELL_ORDERING.has(cell.ordering)) {
        errors.push(`${cwhere}: invalid ordering "${cell.ordering}"`);
      }
      const items = Array.isArray(cell.items) ? cell.items : [];
      if (items.length === 0) errors.push(`${cwhere}: cell must not be empty`);
      items.forEach((item, ii) => {
        const iwhere = `${cwhere}.item[${ii}]`;
        checkKeys(item, ITEM_KEYS, iwhere, errors);
        if (!item.id || !ID_RE.test(item.id)) errors.push(`${iwhere}: invalid id`);
        if (!item.label?.trim()) errors.push(`${iwhere}: missing label`);
        validateGrounding(item, iwhere, kpMap, errors);
      });
    });

    for (const pid of poleIds) {
      if (!seenPoles.has(pid)) {
        errors.push(`${dwhere}: missing cell for pole "${pid}"`);
      }
    }
  });
}

export function validateEnumerationSet(spec, kpMap, errors) {
  checkKeys(spec, ENUM_KEYS, "spec", errors);
  rejectEdges(spec, errors);

  if (spec.technology !== "semantic-html") {
    errors.push(`spec: technology must be semantic-html for enumeration-set`);
  }

  const set = spec.set;
  if (!set || typeof set !== "object") {
    errors.push("spec: missing set");
    return;
  }
  checkKeys(set, SET_KEYS, "spec.set", errors);
  if (!set.id || !ID_RE.test(set.id)) errors.push("spec.set: invalid id");
  if (!set.label?.trim()) errors.push("spec.set: missing label");
  if (!MEMBERSHIP_LOGIC.has(set.membership_logic)) {
    errors.push(`spec.set: invalid membership_logic "${set.membership_logic}"`);
  }
  if (!ORDERING_SEMANTICS.has(set.ordering_semantics)) {
    errors.push(`spec.set: invalid ordering_semantics "${set.ordering_semantics}"`);
  }
  if (set.class) validateGrounding(set, "spec.set", kpMap, errors);

  const groups = Array.isArray(spec.groups) ? spec.groups : [];
  if (groups.length === 0) errors.push("spec: groups must be non-empty");

  groups.forEach((group, gi) => {
    const gwhere = `group[${gi}]`;
    checkKeys(group, GROUP_KEYS, gwhere, errors);
    if (!group.id || !ID_RE.test(group.id)) errors.push(`${gwhere}: invalid id`);
    if (!group.label?.trim()) errors.push(`${gwhere}: missing label`);
    if (group.coverage && !COVERAGE_TYPES.has(group.coverage)) {
      errors.push(`${gwhere}: invalid coverage "${group.coverage}"`);
    }
    if (group.class) validateGrounding(group, gwhere, kpMap, errors);

    const items = Array.isArray(group.items) ? group.items : [];
    if (items.length === 0) errors.push(`${gwhere}: items must be non-empty`);

    if (
      set.expected_cardinality != null &&
      group.membership_logic === "concurrent-set" &&
      group.expected_cardinality == null
    ) {
      if (items.length !== set.expected_cardinality) {
        errors.push(
          `${gwhere}: concurrent-set group expected ${set.expected_cardinality} items, found ${items.length}`,
        );
      }
    }

    if (group.expected_cardinality != null && items.length !== group.expected_cardinality) {
      errors.push(
        `${gwhere}: expected cardinality ${group.expected_cardinality}, found ${items.length}`,
      );
    }

    if (group.membership_logic && !MEMBERSHIP_LOGIC.has(group.membership_logic)) {
      errors.push(`${gwhere}: invalid membership_logic "${group.membership_logic}"`);
    }
    if (group.ordering_semantics && !ORDERING_SEMANTICS.has(group.ordering_semantics)) {
      errors.push(`${gwhere}: invalid ordering_semantics "${group.ordering_semantics}"`);
    }
    if (
      group.membership_logic === "concurrent-set" &&
      group.ordering_semantics &&
      group.ordering_semantics !== "none"
    ) {
      errors.push(`${gwhere}: concurrent-set must use ordering_semantics none`);
    }

    items.forEach((item, ii) => {
      const iwhere = `${gwhere}.item[${ii}]`;
      checkKeys(item, ENUM_ITEM_KEYS, iwhere, errors);
      if (!item.id || !ID_RE.test(item.id)) errors.push(`${iwhere}: invalid id`);
      if (!item.label?.trim()) errors.push(`${iwhere}: missing label`);
      validateGrounding(item, iwhere, kpMap, errors);
    });
  });

  // No edges at spec level (already checked by rejectEdges)
}

export function validateQuantityModel(spec, kpMap, errors) {
  checkKeys(spec, QUANTITY_KEYS, "spec", errors);
  rejectEdges(spec, errors);

  if (spec.technology !== "semantic-html") {
    errors.push(`spec: technology must be semantic-html for quantity-model`);
  }

  const target = spec.target;
  if (!target || typeof target !== "object") {
    errors.push("spec: missing target");
    return;
  }
  checkKeys(target, TARGET_KEYS, "spec.target", errors);
  if (!target.unit?.trim()) errors.push("spec.target: missing unit");
  validateGrounding(target, "spec.target", kpMap, errors);

  const identities = Array.isArray(spec.identities) ? spec.identities : [];
  if (identities.length === 0) errors.push("spec: identities must be non-empty");
  identities.forEach((idn, i) => {
    const iwhere = `identity[${i}]`;
    checkKeys(idn, IDENTITY_KEYS, iwhere, errors);
    if (!idn.expression?.trim()) errors.push(`${iwhere}: missing expression`);
    if (!IDENTITY_RELATIONS.has(idn.relation_type)) {
      errors.push(`${iwhere}: invalid relation_type`);
    }
    validateGrounding(idn, iwhere, kpMap, errors);
  });

  const states = Array.isArray(spec.states) ? spec.states : [];
  if (states.length < 2) errors.push("spec: quantity-model two-state requires at least 2 states");

  const quantityIds = new Set();
  states.forEach((state, si) => {
    const swhere = `state[${si}]`;
    checkKeys(state, STATE_KEYS, swhere, errors);
    if (!state.id || !ID_RE.test(state.id)) errors.push(`${swhere}: invalid id`);
    const values = Array.isArray(state.values) ? state.values : [];
    if (values.length === 0) errors.push(`${swhere}: values must be non-empty`);
    values.forEach((val, vi) => {
      const vwhere = `${swhere}.value[${vi}]`;
      checkKeys(val, VALUE_KEYS, vwhere, errors);
      if (!val.quantity?.trim()) errors.push(`${vwhere}: missing quantity id`);
      if (val.value == null || val.value === "") errors.push(`${vwhere}: missing value`);
      if (!val.unit?.trim()) errors.push(`${vwhere}: missing unit`);
      quantityIds.add(val.quantity);
      validateGrounding(val, vwhere, kpMap, errors);
    });
  });

  if (states.length >= 2) {
    const qSets = states.map((s) =>
      new Set((s.values || []).map((v) => v.quantity).filter(Boolean))
    );
    const base = qSets[0];
    for (let i = 1; i < qSets.length; i++) {
      if (base.size !== qSets[i].size) {
        errors.push("spec: states must contain the same quantities");
      }
      for (const q of base) {
        if (!qSets[i].has(q)) errors.push(`spec: quantity "${q}" missing in state ${states[i].id}`);
      }
    }
  }

  const insights = Array.isArray(spec.insights) ? spec.insights : [];
  insights.forEach((ins, i) => {
    const iwhere = `insight[${i}]`;
    checkKeys(ins, INSIGHT_KEYS, iwhere, errors);
    validateGrounding(ins, iwhere, kpMap, errors);
  });
}

export function validateVisualSpecV02(spec, options = {}) {
  const errors = [];
  const { inventory = null, n09Reference = null } = options;
  const kpList = Array.isArray(inventory) ? inventory : inventory?.kps || null;
  const kpMap = kpList ? new Map(kpList.map((k) => [k.id, k])) : null;

  if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
    return { ok: false, errors: ["visualSpec must be a mapping"], stats: null };
  }

  if (String(spec.spec_version) !== VISUAL_SPEC_VERSION_V02) {
    errors.push(`spec: unsupported spec_version ${spec.spec_version} for v0.2 validator`);
  }

  if (!spec.primitive || !V02_PRIMITIVES.has(spec.primitive)) {
    errors.push(`spec: unsupported v0.2 primitive "${spec.primitive}"`);
  }

  if (!spec.chapter) errors.push("spec: missing chapter");
  if (!spec.element) errors.push("spec: missing element");
  if (!spec.question?.trim()) errors.push("spec: missing question");
  if (!spec.technology) errors.push("spec: missing technology");

  if (spec.provenance != null) {
    if (typeof spec.provenance !== "object" || Array.isArray(spec.provenance)) {
      errors.push("spec: provenance must be a mapping");
    } else {
      checkKeys(spec.provenance, PROVENANCE_KEYS_V02, "spec.provenance", errors);
    }
  }

  if (spec.primitive === "comparison-matrix") {
    validateComparisonMatrix(spec, kpMap, errors);
  } else if (spec.primitive === "enumeration-set") {
    validateEnumerationSet(spec, kpMap, errors);
  } else if (spec.primitive === "quantity-model") {
    validateQuantityModel(spec, kpMap, errors);
  } else if (spec.primitive === "decision-algorithm") {
    validateDecisionAlgorithm(spec, kpMap, errors, {
      requireUrgencyAnnotation: spec.variant === "diagnostic",
    });
  } else if (spec.primitive === "threshold-scale") {
    validateThresholdScale(spec, kpMap, errors);
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      primitive: spec.primitive,
      element: spec.element,
      spec_version: spec.spec_version,
    },
  };
}

export function visualSpecClaimUnitsV02(spec) {
  const slug = String(spec.element).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const units = [];

  const push = (id, unit, ref, text, cls, kp, digestParts) => {
    units.push({
      id: `cb-vis-${slug}-${id}`,
      class: cls,
      kp: kp || [],
      element: spec.element,
      unit,
      ref,
      text,
      digest: semanticDigest(digestParts),
    });
  };

  if (spec.primitive === "comparison-matrix") {
    for (const pole of spec.poles || []) {
      push(`pole-${pole.id}`, "pole", pole.id, pole.label, pole.class || "scaffolding", pole.kp || [], [
        "pole", pole.id, pole.label, pole.pole_type, pole.class || "", (pole.kp || []).join(","),
      ]);
    }
    for (const dim of spec.dimensions || []) {
      push(`dim-${dim.id}`, "dimension", dim.id, dim.label, dim.class || "scaffolding", dim.kp || [], [
        "dimension", dim.id, dim.label, dim.class || "", (dim.kp || []).join(","),
      ]);
      for (const cell of dim.cells || []) {
        for (const item of cell.items || []) {
          push(`cell-${dim.id}-${item.id}`, "matrix-cell", `${dim.id}/${cell.pole}/${item.id}`, item.label, item.class, item.kp || [], [
            "cell", dim.id, cell.pole, item.id, item.label, item.class, (item.kp || []).join(","), cell.ordering || "none",
          ]);
        }
      }
    }
  }

  if (spec.primitive === "enumeration-set") {
    const set = spec.set || {};
    push(`set-${set.id}`, "set", set.id, set.label, set.class || "scaffolding", set.kp || [], [
      "set", set.id, set.label, set.membership_logic, set.ordering_semantics, String(set.expected_cardinality),
    ]);
    for (const group of spec.groups || []) {
      push(`group-${group.id}`, "group", group.id, group.label, group.class || "scaffolding", group.kp || [], [
        "group", group.id, group.label, group.purpose || "", group.coverage || "",
      ]);
      for (const item of group.items || []) {
        push(`item-${group.id}-${item.id}`, "enum-item", `${group.id}/${item.id}`, item.label, item.class, item.kp || [], [
          "item", group.id, item.id, item.label, item.class, (item.kp || []).join(","),
        ]);
      }
    }
  }

  if (spec.primitive === "quantity-model") {
    const t = spec.target || {};
    push(`target-${t.id}`, "target", t.id, t.label, t.class, t.kp || [], [
      "target", t.id, t.label, t.unit, t.class, (t.kp || []).join(","),
    ]);
    for (const idn of spec.identities || []) {
      push(`identity-${idn.id}`, "identity", idn.id, idn.expression, idn.class, idn.kp || [], [
        "identity", idn.id, idn.expression, idn.relation_type, idn.class, (idn.kp || []).join(","),
      ]);
    }
    for (const state of spec.states || []) {
      for (const val of state.values || []) {
        push(
          `val-${state.id}-${val.quantity}`,
          "quantity-value",
          `${state.id}/${val.quantity}`,
          `${val.quantity}=${val.value} ${val.unit}`,
          val.class,
          val.kp || [],
          ["value", state.id, val.quantity, String(val.value), val.unit, val.class, (val.kp || []).join(",")],
        );
      }
    }
    for (const ins of spec.insights || []) {
      push(`insight-${ins.id}`, "insight", ins.id, ins.label, ins.class, ins.kp || [], [
        "insight", ins.id, ins.label, ins.class, (ins.kp || []).join(","),
      ]);
    }
  }

  if (spec.primitive === "decision-algorithm" || spec.primitive === "threshold-scale") {
    return visualSpecClaimUnitsLotB(spec);
  }

  return units;
}
