/**
 * visualSpec v0.2 — decision-algorithm & threshold-scale (Lot B).
 */

import { CLAIM_CLASSES, FORBIDDEN_GEOMETRY_KEYS, semanticDigest } from "./visual-spec.js";

export const DECISION_VARIANTS = new Set(["diagnostic", "compact"]);
export const DECISION_NODE_KINDS = new Set([
  "entry",
  "decision",
  "test",
  "dead-end",
  "conclusion",
]);
export const ANNOTATION_PLACEMENTS = new Set(["out-of-flow", "scope-note"]);
export const COMPARATORS = new Set(["<", "<=", ">", ">="]);
export const THRESHOLD_VARIANTS = new Set(["numeric-contextual", "numeric", "ordinal", "fragment"]);
export const CONFOUNDER_DIRECTIONS = new Set(["increase", "decrease"]);

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

function rejectCausalEdges(spec, errors) {
  if (Array.isArray(spec.edges) && spec.edges.length > 0) {
    errors.push("spec: edges forbidden — use branches for decision-algorithm/threshold-scale");
  }
}

const BASE = new Set([
  "spec_version",
  "primitive",
  "chapter",
  "element",
  "question",
  "technology",
  "variant",
  "provenance",
]);

const DECISION_KEYS = new Set([...BASE, "nodes", "branches", "annotations"]);
const NODE_KEYS = new Set(["id", "kind", "label", "class", "kp", "subitems"]);
const SUBITEM_KEYS = new Set(["id", "label", "class", "kp"]);
const BRANCH_KEYS = new Set([
  "id",
  "from",
  "to",
  "condition",
  "class",
  "kp",
  "threshold_fragment",
]);
const FRAGMENT_KEYS = new Set(["context", "scales", "low_band_meaning"]);
const FRAG_SCALE_KEYS = new Set([
  "id",
  "analyte",
  "cutoff_label",
  "comparator",
  "value",
  "unit",
  "class",
  "kp",
]);
const ANNOTATION_KEYS = new Set(["id", "label", "placement", "class", "kp"]);

const THRESHOLD_KEYS = new Set([
  ...BASE,
  "contexts",
  "interpretations",
  "confounders",
]);
const CONTEXT_KEYS = new Set(["id", "label", "class", "kp", "scales"]);
const SCALE_KEYS = new Set([
  "id",
  "analyte",
  "cutoff_label",
  "comparator",
  "value",
  "unit",
  "low_band_label",
  "not_low_band_label",
  "class",
  "kp",
]);
const INTERPRETATION_KEYS = new Set(["id", "label", "class", "kp", "attach_to"]);
const CONFOUNDER_GROUP_KEYS = new Set(["direction", "items"]);
const CONFOUNDER_ITEM_KEYS = new Set(["id", "label", "class", "kp"]);

export function validateThresholdFragment(fragment, where, kpMap, errors, options = {}) {
  if (!fragment || typeof fragment !== "object") {
    errors.push(`${where}: threshold_fragment required`);
    return;
  }
  checkKeys(fragment, FRAGMENT_KEYS, where, errors);
  if (!fragment.context?.trim()) errors.push(`${where}: missing context`);
  if (!fragment.low_band_meaning?.trim()) errors.push(`${where}: missing low_band_meaning`);
  const scales = Array.isArray(fragment.scales) ? fragment.scales : [];
  if (scales.length === 0) errors.push(`${where}: scales must be non-empty`);
  scales.forEach((scale, i) => {
    const sw = `${where}.scale[${i}]`;
    checkKeys(scale, FRAG_SCALE_KEYS, sw, errors);
    validateCutoffVerbatim(scale, sw, errors, options);
    validateGrounding(scale, sw, kpMap, errors);
  });
}

function validateCutoffVerbatim(scale, where, errors, options = {}) {
  if (!scale.cutoff_label?.trim()) errors.push(`${where}: missing cutoff_label`);
  if (!scale.comparator || !COMPARATORS.has(scale.comparator)) {
    errors.push(`${where}: invalid comparator "${scale.comparator}"`);
  }
  if (scale.value == null || scale.value === "") errors.push(`${where}: missing value`);
  if (!scale.unit?.trim()) errors.push(`${where}: missing unit`);
  if (scale.cutoff_label && scale.comparator && scale.value != null && scale.unit) {
    const expected = `${scale.comparator} ${scale.value} ${scale.unit}`;
    if (!String(scale.cutoff_label).includes(String(scale.value))) {
      errors.push(`${where}: cutoff_label must contain value verbatim`);
    }
    if (!String(scale.cutoff_label).includes(scale.unit)) {
      errors.push(`${where}: cutoff_label must contain unit verbatim`);
    }
    if (options.forbidAcute && (scale.value === 100 || scale.value === 300)) {
      errors.push(`${where}: acute threshold values forbidden in this spec`);
    }
  }
}

export function validateDecisionAlgorithm(spec, kpMap, errors, options = {}) {
  checkKeys(spec, DECISION_KEYS, "spec", errors);
  rejectCausalEdges(spec, errors);

  if (spec.technology !== "svg") {
    errors.push(`spec: technology must be svg for decision-algorithm`);
  }
  if (!DECISION_VARIANTS.has(spec.variant)) {
    errors.push(`spec: invalid variant "${spec.variant}"`);
  }

  const nodes = Array.isArray(spec.nodes) ? spec.nodes : [];
  const branches = Array.isArray(spec.branches) ? spec.branches : [];
  if (nodes.length === 0) errors.push("spec: nodes must be non-empty");
  if (branches.length === 0) errors.push("spec: branches must be non-empty");

  const nodeIds = new Set();
  let hasDeadEnd = false;

  nodes.forEach((node, i) => {
    const nw = `node[${i}]`;
    checkKeys(node, NODE_KEYS, nw, errors);
    if (!node.id || !ID_RE.test(node.id)) errors.push(`${nw}: invalid id`);
    else if (nodeIds.has(node.id)) errors.push(`${nw}: duplicate id`);
    else nodeIds.add(node.id);
    if (!DECISION_NODE_KINDS.has(node.kind)) errors.push(`${nw}: invalid kind`);
    if (!node.label?.trim()) errors.push(`${nw}: missing label`);
    if (node.kind === "dead-end") hasDeadEnd = true;
    validateGrounding(node, nw, kpMap, errors);
    (node.subitems || []).forEach((sub, si) => {
      const sw = `${nw}.subitem[${si}]`;
      checkKeys(sub, SUBITEM_KEYS, sw, errors);
      validateGrounding(sub, sw, kpMap, errors);
    });
  });

  if (!hasDeadEnd && !nodes.some((n) => n.kind === "conclusion")) {
    errors.push("spec: decision-algorithm requires at least one dead-end or conclusion node");
  }

  const branchKeys = new Set();
  branches.forEach((branch, i) => {
    const bw = `branch[${i}]`;
    checkKeys(branch, BRANCH_KEYS, bw, errors);
    if (!branch.from || !nodeIds.has(branch.from)) errors.push(`${bw}: invalid from`);
    if (!branch.to || !nodeIds.has(branch.to)) errors.push(`${bw}: invalid to`);
    if (!branch.condition?.trim()) errors.push(`${bw}: missing condition (every branch must be labelled)`);
    validateGrounding(branch, bw, kpMap, errors);
    const key = `${branch.from}->${branch.to}:${branch.condition}`;
    if (branchKeys.has(key)) errors.push(`${bw}: duplicate branch ${key}`);
    branchKeys.add(key);

    if (branch.threshold_fragment) {
      if (spec.variant === "compact") {
        errors.push(`${bw}: compact variant must not embed numeric threshold_fragment`);
      } else {
        validateThresholdFragment(branch.threshold_fragment, `${bw}.threshold_fragment`, kpMap, errors, {
          forbidAcute: true,
        });
      }
    }
  });

  if (options.requireUrgencyAnnotation) {
    const anns = spec.annotations || [];
    const urgency = anns.find((a) => a.placement === "out-of-flow");
    if (!urgency) errors.push("spec: urgency annotation (out-of-flow) required");
  }
}

export function validateThresholdScale(spec, kpMap, errors) {
  checkKeys(spec, THRESHOLD_KEYS, "spec", errors);
  rejectCausalEdges(spec, errors);

  if (spec.technology !== "svg") {
    errors.push(`spec: technology must be svg for threshold-scale`);
  }
  if (!THRESHOLD_VARIANTS.has(spec.variant)) {
    errors.push(`spec: invalid variant "${spec.variant}"`);
  }

  const contexts = Array.isArray(spec.contexts) ? spec.contexts : [];
  if (contexts.length < 2) {
    errors.push("spec: numeric-contextual requires at least 2 separated contexts");
  }

  const contextLabels = new Set();
  contexts.forEach((ctx, ci) => {
    const cw = `context[${ci}]`;
    checkKeys(ctx, CONTEXT_KEYS, cw, errors);
    if (!ctx.id || !ID_RE.test(ctx.id)) errors.push(`${cw}: invalid id`);
    if (!ctx.label?.trim()) errors.push(`${cw}: missing label`);
    if (contextLabels.has(ctx.label)) errors.push(`${cw}: duplicate context label`);
    contextLabels.add(ctx.label);
    validateGrounding(ctx, cw, kpMap, errors);

    const scales = Array.isArray(ctx.scales) ? ctx.scales : [];
    if (scales.length === 0) errors.push(`${cw}: scales must be non-empty`);
    scales.forEach((scale, si) => {
      const sw = `${cw}.scale[${si}]`;
      checkKeys(scale, SCALE_KEYS, sw, errors);
      validateCutoffVerbatim(scale, sw, errors);
      if (!scale.low_band_label?.trim()) errors.push(`${sw}: missing low_band_label`);
      if (!scale.not_low_band_label?.trim()) errors.push(`${sw}: missing not_low_band_label`);
      validateGrounding(scale, sw, kpMap, errors);
      if (scale.not_low_band_label?.toLowerCase().includes("confirm")) {
        errors.push(`${sw}: must not present elevated value as confirming IC`);
      }
    });
  });

  const interpretations = Array.isArray(spec.interpretations) ? spec.interpretations : [];
  if (interpretations.length === 0) errors.push("spec: interpretations must be non-empty");
  interpretations.forEach((ins, i) => {
    const iw = `interpretation[${i}]`;
    checkKeys(ins, INTERPRETATION_KEYS, iw, errors);
    validateGrounding(ins, iw, kpMap, errors);
  });

  const confounders = spec.confounders;
  if (!confounders || typeof confounders !== "object") {
    errors.push("spec: confounders required and must be attached to component");
  } else {
    checkKeys(confounders, new Set(["increase", "decrease"]), "spec.confounders", errors);
    for (const dir of ["increase", "decrease"]) {
      const items = confounders[dir];
      if (!Array.isArray(items) || items.length === 0) {
        errors.push(`spec.confounders.${dir}: must be non-empty`);
      }
      (items || []).forEach((item, i) => {
        const iw = `confounders.${dir}[${i}]`;
        checkKeys(item, CONFOUNDER_ITEM_KEYS, iw, errors);
        validateGrounding(item, iw, kpMap, errors);
      });
    }
  }
}

export function visualSpecClaimUnitsLotB(spec) {
  const slug = String(spec.element).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const units = [];
  const push = (id, unit, ref, text, cls, kp, parts) => {
    units.push({
      id: `cb-vis-${slug}-${id}`,
      class: cls,
      kp: kp || [],
      element: spec.element,
      unit,
      ref,
      text,
      digest: semanticDigest(parts),
    });
  };

  if (spec.primitive === "decision-algorithm") {
    for (const node of spec.nodes || []) {
      push(`node-${node.id}`, "node", node.id, node.label, node.class, node.kp || [], [
        "node", node.id, node.kind, node.label, node.class, (node.kp || []).join(","),
      ]);
      for (const sub of node.subitems || []) {
        push(`sub-${node.id}-${sub.id}`, "subitem", `${node.id}/${sub.id}`, sub.label, sub.class, sub.kp || [], [
          "subitem", node.id, sub.id, sub.label, sub.class, (sub.kp || []).join(","),
        ]);
      }
    }
    for (const branch of spec.branches || []) {
      push(
        `branch-${branch.id || `${branch.from}-to-${branch.to}`}`,
        "branch",
        `${branch.from}->${branch.to}`,
        branch.condition,
        branch.class,
        branch.kp || [],
        ["branch", branch.from, branch.to, branch.condition, branch.class, (branch.kp || []).join(",")],
      );
      const frag = branch.threshold_fragment;
      if (frag) {
        for (const scale of frag.scales || []) {
          push(
            `frag-${scale.id}`,
            "threshold-cutoff",
            scale.id,
            scale.cutoff_label,
            scale.class,
            scale.kp || [],
            ["cutoff", scale.analyte, scale.cutoff_label, scale.class, (scale.kp || []).join(",")],
          );
        }
      }
    }
    for (const ann of spec.annotations || []) {
      push(`ann-${ann.id}`, "annotation", ann.id, ann.label, ann.class, ann.kp || [], [
        "annotation", ann.id, ann.label, ann.placement, ann.class, (ann.kp || []).join(","),
      ]);
    }
  }

  if (spec.primitive === "threshold-scale") {
    for (const ctx of spec.contexts || []) {
      push(`ctx-${ctx.id}`, "context", ctx.id, ctx.label, ctx.class, ctx.kp || [], [
        "context", ctx.id, ctx.label, ctx.class, (ctx.kp || []).join(","),
      ]);
      for (const scale of ctx.scales || []) {
        push(`scale-${scale.id}`, "scale", scale.id, scale.cutoff_label, scale.class, scale.kp || [], [
          "scale", ctx.id, scale.analyte, scale.cutoff_label, scale.low_band_label, scale.not_low_band_label,
        ]);
      }
    }
    for (const ins of spec.interpretations || []) {
      push(`interp-${ins.id}`, "interpretation", ins.id, ins.label, ins.class, ins.kp || [], [
        "interpretation", ins.id, ins.label, ins.class, (ins.kp || []).join(","),
      ]);
    }
    for (const dir of ["increase", "decrease"]) {
      for (const item of spec.confounders?.[dir] || []) {
        push(`conf-${item.id}`, "confounder", item.id, item.label, item.class, item.kp || [], [
          "confounder", dir, item.id, item.label, item.class, (item.kp || []).join(","),
        ]);
      }
    }
  }

  return units;
}
