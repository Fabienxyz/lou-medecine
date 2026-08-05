/**
 * Executable budgets — registry is the authoritative source.
 * Applied before family recognition in gateBeforeRender.
 */

import { familyById, loadFamilyRegistry } from "./registry.js";

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function collectLabels(spec) {
  const labels = [];
  const push = (s) => {
    if (s?.trim()) labels.push(s);
  };

  push(spec.question);
  for (const n of spec.nodes || []) push(n.label);
  for (const e of spec.edges || []) {
    push(e.relation_label);
  }
  for (const b of spec.branches || []) push(b.condition);
  for (const p of spec.poles || []) push(p.label);
  for (const d of spec.dimensions || []) {
    push(d.label);
    for (const c of d.cells || []) {
      for (const item of c.items || []) push(item.label);
    }
  }
  for (const g of spec.groups || []) {
    push(g.label);
    for (const item of g.items || []) push(item.label);
  }
  if (spec.set?.label) push(spec.set.label);
  for (const ctx of spec.contexts || []) {
    push(ctx.label);
    for (const sc of ctx.scales || []) {
      push(sc.analyte);
      push(sc.cutoff_label);
      push(sc.low_band_label);
      push(sc.not_low_band_label);
    }
  }
  if (spec.target?.label) push(spec.target.label);
  for (const idn of spec.identities || []) push(idn.expression);
  for (const st of spec.states || []) {
    push(st.label);
    for (const v of st.values || []) push(String(v.value));
  }
  for (const ins of spec.insights || []) push(ins.label);

  return labels;
}

function maxLabelWords(spec) {
  let max = 0;
  for (const label of collectLabels(spec)) {
    max = Math.max(max, countWords(label));
  }
  return max;
}

function graphDepth(nodeIds, edges) {
  const out = new Map(nodeIds.map((id) => [id, []]));
  for (const e of edges) {
    if (out.has(e.from)) out.get(e.from).push(e.to);
  }
  let maxDepth = 0;
  for (const start of nodeIds) {
    const stack = [{ id: start, depth: 0 }];
    const seen = new Set();
    while (stack.length) {
      const { id, depth } = stack.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      maxDepth = Math.max(maxDepth, depth);
      for (const v of out.get(id) || []) stack.push({ id: v, depth: depth + 1 });
    }
  }
  return maxDepth;
}

/**
 * Resolve executable budgets for a spec — merged maxima across all families
 * sharing the same primitive (applied before family recognition).
 */
export function resolveBudgets(spec, familyId = null) {
  const registry = loadFamilyRegistry();
  if (familyId) {
    const family = familyById(registry, familyId);
    if (family?.budgets) return { ...family.budgets };
  }

  const primitive = spec.primitive;
  const families = registry.families.filter((f) => f.primitive === primitive);
  if (families.length === 0) return {};

  const merged = {};
  for (const f of families) {
    const b = f.budgets || {};
    for (const [key, val] of Object.entries(b)) {
      if (typeof val === "number") {
        merged[key] = merged[key] == null ? val : Math.max(merged[key], val);
      }
    }
  }
  return merged;
}

/**
 * Check budgets before recognition.
 * @returns {{ ok: true } | { ok: false, code: 'BUDGET_EXCEEDED'|'UNSUPPORTED_TEXT_LOAD', detail: object }}
 */
export function checkBudgets(spec, options = {}) {
  const budgets = resolveBudgets(spec, options.familyId);
  const primitive = spec.primitive;
  const detail = { primitive, budgets: { ...budgets } };

  const labelWords = maxLabelWords(spec);
  detail.labelWords = labelWords;
  if (budgets.maxLabelWords != null && labelWords > budgets.maxLabelWords) {
    return { ok: false, code: "UNSUPPORTED_TEXT_LOAD", detail: { ...detail, field: "maxLabelWords" } };
  }

  switch (primitive) {
    case "causal-graph": {
      const nodes = spec.nodes || [];
      const edges = spec.edges || [];
      detail.nodeCount = nodes.length;
      detail.edgeCount = edges.length;
      detail.depth = graphDepth(
        nodes.map((n) => n.id),
        edges,
      );
      if (budgets.maxNodes != null && nodes.length > budgets.maxNodes) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxNodes" } };
      }
      if (budgets.maxEdges != null && edges.length > budgets.maxEdges) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxEdges" } };
      }
      if (budgets.maxDepth != null && detail.depth > budgets.maxDepth) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxDepth" } };
      }
      break;
    }
    case "decision-algorithm": {
      const nodes = spec.nodes || [];
      const branches = spec.branches || [];
      detail.nodeCount = nodes.length;
      detail.branchCount = branches.length;
      if (budgets.maxNodes != null && nodes.length > budgets.maxNodes) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxNodes" } };
      }
      if (budgets.maxBranches != null && branches.length > budgets.maxBranches) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxBranches" } };
      }
      break;
    }
    case "threshold-scale": {
      const contexts = spec.contexts || [];
      detail.contextCount = contexts.length;
      if (budgets.maxContexts != null && contexts.length > budgets.maxContexts) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxContexts" } };
      }
      for (const ctx of contexts) {
        const scales = ctx.scales || [];
        if (budgets.maxScalesPerContext != null && scales.length > budgets.maxScalesPerContext) {
          return {
            ok: false,
            code: "BUDGET_EXCEEDED",
            detail: { ...detail, field: "maxScalesPerContext", context: ctx.id },
          };
        }
      }
      break;
    }
    case "comparison-matrix": {
      const poles = spec.poles || [];
      const dimensions = spec.dimensions || [];
      detail.poleCount = poles.length;
      detail.dimensionCount = dimensions.length;
      if (budgets.maxPoles != null && poles.length > budgets.maxPoles) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxPoles" } };
      }
      if (budgets.maxDimensions != null && dimensions.length > budgets.maxDimensions) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxDimensions" } };
      }
      for (const dim of dimensions) {
        for (const cell of dim.cells || []) {
          const items = cell.items || [];
          if (budgets.maxItemsPerCell != null && items.length > budgets.maxItemsPerCell) {
            return {
              ok: false,
              code: "BUDGET_EXCEEDED",
              detail: { ...detail, field: "maxItemsPerCell", dimension: dim.id },
            };
          }
        }
      }
      break;
    }
    case "enumeration-set": {
      let itemCount = 0;
      const groups = spec.groups || [];
      detail.groupCount = groups.length;
      for (const g of groups) itemCount += (g.items || []).length;
      detail.itemCount = itemCount;
      if (budgets.maxGroups != null && groups.length > budgets.maxGroups) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxGroups" } };
      }
      if (budgets.maxItems != null && itemCount > budgets.maxItems) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxItems" } };
      }
      break;
    }
    case "quantity-model": {
      const identities = spec.identities || [];
      const states = spec.states || [];
      detail.identityCount = identities.length;
      detail.stateCount = states.length;
      if (budgets.maxIdentities != null && identities.length > budgets.maxIdentities) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxIdentities" } };
      }
      if (budgets.maxStates != null && states.length > budgets.maxStates) {
        return { ok: false, code: "BUDGET_EXCEEDED", detail: { ...detail, field: "maxStates" } };
      }
      for (const st of states) {
        const values = st.values || [];
        if (budgets.maxValuesPerState != null && values.length > budgets.maxValuesPerState) {
          return {
            ok: false,
            code: "BUDGET_EXCEEDED",
            detail: { ...detail, field: "maxValuesPerState", state: st.id },
          };
        }
      }
      break;
    }
    default:
      break;
  }

  return { ok: true, detail };
}
