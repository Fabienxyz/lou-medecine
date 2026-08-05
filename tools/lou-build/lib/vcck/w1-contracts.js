/**
 * W1 family contracts — strict admission beyond signature recognition.
 */

import { analyzeSignature } from "./signature-analyzer.js";
import { checkBudgets } from "./budgets.js";
import { W1_FAMILIES } from "./w1-constants.js";

function reject(code, detail = {}) {
  return { ok: false, code, detail, family: null };
}

function accept(family, detail = {}) {
  return { ok: true, code: null, family, detail };
}

function buildAdjacency(nodeIds, edges) {
  const out = new Map(nodeIds.map((id) => [id, []]));
  const inc = new Map(nodeIds.map((id) => [id, []]));
  for (const e of edges) {
    if (!out.has(e.from) || !inc.has(e.to)) continue;
    out.get(e.from).push(e.to);
    inc.get(e.to).push(e.from);
  }
  return { out, inc };
}

function sources(inc, nodeIds) {
  return nodeIds.filter((id) => inc.get(id).length === 0);
}

function sinks(out, nodeIds) {
  return nodeIds.filter((id) => out.get(id).length === 0);
}

export function linearPathOrder(nodeIds, edges, entryIds = null) {
  const { out, inc } = buildAdjacency(nodeIds, edges);
  const starts = entryIds?.length ? entryIds.filter((id) => nodeIds.includes(id)) : sources(inc, nodeIds);
  if (starts.length !== 1) return null;
  const order = [starts[0]];
  const visited = new Set(order);
  while (order.length < nodeIds.length) {
    const nxt = out.get(order[order.length - 1]);
    if (nxt.length !== 1) return null;
    const next = nxt[0];
    if (visited.has(next)) return null;
    order.push(next);
    visited.add(next);
  }
  if (order.length !== nodeIds.length) return null;
  if (edges.length !== nodeIds.length - 1) return null;
  for (let i = 0; i < order.length - 1; i++) {
    if (!edges.some((e) => e.from === order[i] && e.to === order[i + 1])) return null;
  }
  return order;
}

function enforceChain(spec) {
  const nodeIds = (spec.nodes || []).map((n) => n.id);
  const edges = (spec.edges || []).filter((e) => e.relation !== "feeds_back");
  const feedback = (spec.edges || []).filter((e) => e.relation === "feeds_back");

  if (feedback.length) return reject("UNSUPPORTED_TOPOLOGY", { reason: "feedback edge" });
  if (edges.length !== nodeIds.length - 1) {
    return reject("UNSUPPORTED_TOPOLOGY", { edgeCount: edges.length, nodeCount: nodeIds.length });
  }

  const { out, inc } = buildAdjacency(nodeIds, edges);
  if (sources(inc, nodeIds).length !== 1 || sinks(out, nodeIds).length !== 1) {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "not single source/sink" });
  }
  for (const id of nodeIds) {
    if (out.get(id).length > 1 || inc.get(id).length > 1) {
      return reject("UNSUPPORTED_TOPOLOGY", { reason: "branch or convergence", node: id });
    }
  }

  const order = linearPathOrder(nodeIds, edges);
  if (!order) return reject("TEMPORAL_AS_CAUSAL", { reason: "cycle" });

  const budget = checkBudgets(spec, { familyId: "chain" });
  if (!budget.ok) return reject(budget.code, budget.detail);

  return accept("chain", { canonicalOrder: order });
}

function enforceDependentSequence(spec) {
  const nodeIds = (spec.nodes || []).map((n) => n.id);
  const branches = spec.branches || [];
  const nodeById = new Map((spec.nodes || []).map((n) => [n.id, n]));

  if ((spec.nodes || []).some((n) => n.kind === "decision")) {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "binary decision node" });
  }
  if (branches.some((b) => b.threshold_fragment)) {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "nested fragment" });
  }

  const { out, inc } = buildAdjacency(nodeIds, branches);
  const connected = new Set();
  for (const b of branches) {
    connected.add(b.from);
    connected.add(b.to);
  }
  for (const id of nodeIds) {
    if (!connected.has(id)) {
      return reject("UNSUPPORTED_TOPOLOGY", { reason: "isolated node", node: id });
    }
    if (out.get(id).length > 1 || inc.get(id).length > 1) {
      return reject("UNSUPPORTED_TOPOLOGY", { reason: "branch or convergence", node: id });
    }
  }

  const entries = (spec.nodes || []).filter((n) => n.kind === "entry").map((n) => n.id);
  if (entries.length !== 1) {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "entry count", count: entries.length });
  }

  const terminals = nodeIds.filter((id) => out.get(id).length === 0);
  const terminalNodes = terminals.map((id) => nodeById.get(id));
  const hasConclusion = terminalNodes.some((n) => n?.kind === "conclusion");
  const deadEnds = (spec.nodes || []).filter((n) => n.kind === "dead-end");
  if (deadEnds.length === 0 && !hasConclusion) {
    return reject("MISSING_TERMINAL", { deadEnds: 0 });
  }
  if (terminals.length !== 1) {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "multiple terminals", count: terminals.length });
  }

  if (branches.length !== connected.size - 1) {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "non-linear structure" });
  }

  const order = linearPathOrder([...connected], branches, entries);
  if (!order) return reject("UNSUPPORTED_TOPOLOGY", { reason: "loop detected" });

  for (let i = 0; i < order.length - 1; i++) {
    const from = order[i];
    const to = order[i + 1];
    if (!branches.some((b) => b.from === from && b.to === to)) {
      return reject("UNSUPPORTED_TOPOLOGY", { reason: "level skip", from, to });
    }
  }

  const budget = checkBudgets(spec, { familyId: "dependent-sequence" });
  if (!budget.ok) return reject(budget.code, budget.detail);

  return accept("dependent-sequence", { canonicalOrder: order, terminalId: terminals[0] });
}

function enforceTwoPole(spec) {
  const poles = spec.poles || [];
  if (poles.length !== 2) {
    return reject("UNSUPPORTED_TOPOLOGY", { poleCount: poles.length });
  }

  const poleIds = new Set(poles.map((p) => p.id));
  const dimensions = spec.dimensions || [];
  if (!dimensions.length) return reject("UNSUPPORTED_TOPOLOGY", { reason: "no dimensions" });

  const dimOrder = [...dimensions].sort((a, b) => a.id.localeCompare(b.id)).map((d) => d.id);
  const poleOrder = [...poles].sort((a, b) => a.id.localeCompare(b.id)).map((p) => p.id);
  for (const dim of dimensions) {
    const cells = dim.cells || [];
    const seenPoles = new Set();
    for (const cell of cells) {
      if (!poleIds.has(cell.pole)) {
        return reject("UNSUPPORTED_TOPOLOGY", { reason: "unknown pole", dimension: dim.id });
      }
      if (seenPoles.has(cell.pole)) {
        return reject("UNSUPPORTED_TOPOLOGY", { reason: "duplicate cell", dimension: dim.id, pole: cell.pole });
      }
      seenPoles.add(cell.pole);
    }
    if (seenPoles.size !== 2) {
      return reject("UNSUPPORTED_TOPOLOGY", { reason: "incomplete dimension", dimension: dim.id });
    }
  }

  const budget = checkBudgets(spec, { familyId: "two-pole" });
  if (!budget.ok) return reject(budget.code, budget.detail);

  return accept("two-pole", { poleOrder, dimensionOrder: dimOrder });
}

function enforceFlatConcurrent(spec) {
  const groups = spec.groups || [];
  if (groups.length >= 2) {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "multiple groups", groupCount: groups.length });
  }
  if (groups.some((g) => g.subsection_of)) {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "nested subsection" });
  }

  const set = spec.set || {};
  if (set.ordering_semantics && set.ordering_semantics !== "none") {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "ordered set" });
  }
  if (set.membership_logic && set.membership_logic !== "concurrent-set") {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "non-concurrent logic" });
  }

  let items = [];
  if (groups.length === 1) {
    const g = groups[0];
    if (g.ordering_semantics && g.ordering_semantics !== "none") {
      return reject("UNSUPPORTED_TOPOLOGY", { reason: "ordered group" });
    }
    items = g.items || [];
  }

  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) return reject("UNSUPPORTED_TOPOLOGY", { reason: "duplicate item id" });
    ids.add(item.id);
  }

  if (set.expected_cardinality != null && items.length !== set.expected_cardinality) {
    return reject("UNSUPPORTED_TOPOLOGY", {
      reason: "cardinality mismatch",
      expected: set.expected_cardinality,
      actual: items.length,
    });
  }

  const budget = checkBudgets(spec, { familyId: "flat-concurrent" });
  if (!budget.ok) return reject(budget.code, budget.detail);

  const canonicalOrder = [...items].sort((a, b) => a.id.localeCompare(b.id)).map((i) => i.id);
  return accept("flat-concurrent", { canonicalOrder, itemCount: items.length });
}

const ENFORCERS = {
  chain: enforceChain,
  "dependent-sequence": enforceDependentSequence,
  "two-pole": enforceTwoPole,
  "flat-concurrent": enforceFlatConcurrent,
};

export function recognizeFamily(spec) {
  return analyzeSignature(spec);
}

export function enforceFamilyContract(spec, expectedFamily = null) {
  const analysis = analyzeSignature(spec);
  if (analysis.status === "rejected") {
    return { ok: false, code: analysis.code, analysis, contract: null };
  }
  if (analysis.status === "ambiguous") {
    return { ok: false, code: "UNSUPPORTED_TOPOLOGY", analysis, contract: null };
  }

  const family = analysis.family;
  if (expectedFamily && family !== expectedFamily) {
    return { ok: false, code: "UNSUPPORTED_TOPOLOGY", analysis, contract: null };
  }
  if (!W1_FAMILIES.includes(family)) {
    return { ok: false, code: "UNSUPPORTED_TOPOLOGY", analysis, contract: null };
  }

  const enforced = ENFORCERS[family](spec);
  if (!enforced.ok) {
    return { ok: false, code: enforced.code, analysis, contract: enforced.detail };
  }

  return { ok: true, code: null, analysis, contract: enforced.detail, family };
}

export function w1ExclusiveCandidates(spec) {
  const analysis = analyzeSignature(spec);
  return {
    status: analysis.status,
    family: analysis.family,
    candidates: analysis.candidates || [],
    code: analysis.code,
  };
}
