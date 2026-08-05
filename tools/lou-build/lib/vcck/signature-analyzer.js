/**
 * VCCK structural signature analyzer.
 *
 * Computes composition family from visualSpec topology — never from author-declared
 * family hints. Declarative `composition_intent` (if present) is ignored.
 */

import { detectK32Subgraph, findSimpleCycles } from "../visual-spec.js";
import { checkBudgets } from "./budgets.js";

export const REJECT_CODES = new Set([
  "UNSUPPORTED_TOPOLOGY",
  "NON_PLANAR_REQUIRED_CROSSING",
  "BUDGET_EXCEEDED",
  "AMBIGUOUS_EDGE_ORIGIN",
  "UNSUPPORTED_NESTING",
  "TEMPORAL_AS_CAUSAL",
  "UNLABELLED_DECISION_BRANCH",
  "MISSING_TERMINAL",
  "UNSUPPORTED_TEXT_LOAD",
]);

/** Fields that must never influence family selection (contract §2.2). */
const IGNORED_INTENT_FIELDS = ["composition_intent", "composition_family", "family_hint"];

function detectUnsupportedNesting(spec) {
  if (spec.nested_primitive || spec.nested_spec || spec.child_primitive) {
    return true;
  }
  for (const n of spec.nodes || []) {
    if (n.nested_spec || n.embedded_primitive) return true;
  }
  return false;
}

function detectAmbiguousEdgeOrigin(spec) {
  if (spec.primitive === "causal-graph") {
    const seen = new Set();
    for (const e of spec.edges || []) {
      const key = `${e.from}|${e.to}|${e.relation || ""}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
  }
  if (spec.primitive === "decision-algorithm") {
    const seen = new Set();
    for (const b of spec.branches || []) {
      const key = `${b.from}|${b.to}|${b.condition || ""}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
  }
  return false;
}

function preGateChecks(spec) {
  if (detectUnsupportedNesting(spec)) {
    return reject("UNSUPPORTED_NESTING", { reason: "nested primitive or fragment" });
  }
  if (detectAmbiguousEdgeOrigin(spec)) {
    return reject("AMBIGUOUS_EDGE_ORIGIN", { reason: "duplicate edge origin routing" });
  }
  const budget = checkBudgets(spec);
  if (!budget.ok) {
    return reject(budget.code, budget.detail);
  }
  return null;
}

function buildAdjacency(nodeIds, edges, directed = true) {
  const out = new Map(nodeIds.map((id) => [id, []]));
  const inc = new Map(nodeIds.map((id) => [id, []]));
  for (const e of edges) {
    if (!out.has(e.from) || !inc.has(e.to)) continue;
    out.get(e.from).push(e.to);
    inc.get(e.to).push(e.from);
    if (!directed) {
      out.get(e.to).push(e.from);
      inc.get(e.from).push(e.to);
    }
  }
  return { out, inc };
}

function maxDegree(map) {
  let m = 0;
  for (const ids of map.values()) m = Math.max(m, ids.length);
  return m;
}

function sources(inc, nodeIds) {
  return nodeIds.filter((id) => inc.get(id).length === 0);
}

function sinks(out, nodeIds) {
  return nodeIds.filter((id) => out.get(id).length === 0);
}

function isSimpleChain(nodeIds, out, inc) {
  if (nodeIds.length < 2) return false;
  for (const id of nodeIds) {
    if (out.get(id).length > 1 || inc.get(id).length > 1) return false;
  }
  return sources(inc, nodeIds).length === 1 && sinks(out, nodeIds).length === 1;
}

function hasDiamond(nodeIds, out, inc) {
  const split = nodeIds.find((id) => out.get(id).length >= 2);
  const join = nodeIds.find((id) => inc.get(id).length >= 2);
  if (!split || !join || split === join) return false;
  // Reachability from split to join through at least two disjoint intermediate paths
  const mid = out.get(split).filter((m) => m !== join);
  if (mid.length < 2) return false;
  return mid.every((m) => {
    const seen = new Set([split]);
    const stack = [m];
    while (stack.length) {
      const u = stack.pop();
      if (u === join) return true;
      if (seen.has(u)) continue;
      seen.add(u);
      for (const v of out.get(u) || []) stack.push(v);
    }
    return false;
  });
}

function isFanOut(nodeIds, out, inc) {
  const src = sources(inc, nodeIds);
  if (src.length !== 1) return false;
  if (out.get(src[0]).length < 2) return false;
  return !nodeIds.some((id) => inc.get(id).length >= 2);
}

function isFanIn(nodeIds, out, inc) {
  const snk = sinks(out, nodeIds);
  if (snk.length !== 1) return false;
  if (inc.get(snk[0]).length < 2) return false;
  return !nodeIds.some((id) => out.get(id).length >= 2);
}

function analyzeCausalGraph(spec) {
  const nodeIds = (spec.nodes || []).map((n) => n.id);
  const edges = spec.edges || [];
  const forward = edges.filter((e) => e.relation !== "feeds_back");
  const feedback = edges.filter((e) => e.relation === "feeds_back");

  const k32 = detectK32Subgraph(nodeIds, forward);
  if (k32.found) {
    return reject("NON_PLANAR_REQUIRED_CROSSING", {
      sources: k32.sources,
      targets: k32.targets,
    });
  }

  const { cycles } = findSimpleCycles(nodeIds, edges);
  for (const cycle of cycles) {
    const members = [];
    for (let i = 0; i < cycle.length - 1; i++) {
      const e = edges.find((x) => x.from === cycle[i] && x.to === cycle[i + 1]);
      if (e) members.push(e);
    }
    if (!members.some((e) => e.relation === "feeds_back")) {
      return reject("TEMPORAL_AS_CAUSAL", { cycle: cycle.join(" -> ") });
    }
  }

  const { out, inc } = buildAdjacency(nodeIds, forward);

  const candidates = [];
  if (feedback.length > 0) candidates.push("lateral-feedback");
  if (hasDiamond(nodeIds, out, inc)) candidates.push("diamond");
  if (isFanOut(nodeIds, out, inc)) candidates.push("fan-out");
  if (isFanIn(nodeIds, out, inc)) candidates.push("fan-in");
  if (isSimpleChain(nodeIds, out, inc) && feedback.length === 0) candidates.push("chain");

  // Feedback graphs may also match diamond/fan patterns — prefer lateral-feedback when declared
  if (feedback.length > 0 && candidates.includes("lateral-feedback")) {
    return recognize("lateral-feedback", signatureCausal(spec, "lateral-feedback", { feedback: feedback.length }));
  }

  if (candidates.length === 0) {
    return reject("UNSUPPORTED_TOPOLOGY", { nodeCount: nodeIds.length, edgeCount: edges.length });
  }
  if (candidates.length > 1 && !feedback.length) {
    // Resolve common overlaps deterministically by priority
    const priority = ["diamond", "fan-out", "fan-in", "chain"];
    for (const p of priority) {
      if (candidates.includes(p)) {
        return recognize(p, signatureCausal(spec, p));
      }
    }
    return ambiguous(candidates, signatureCausal(spec, candidates.join("|")));
  }

  return recognize(candidates[0], signatureCausal(spec, candidates[0]));
}

function signatureCausal(spec, family, extra = {}) {
  const nodeIds = (spec.nodes || []).map((n) => n.id);
  const edges = spec.edges || [];
  const { out, inc } = buildAdjacency(
    nodeIds,
    edges.filter((e) => e.relation !== "feeds_back"),
  );
  return {
    primitive: "causal-graph",
    family,
    nodeCount: nodeIds.length,
    edgeCount: edges.length,
    maxInDegree: maxDegree(inc),
    maxOutDegree: maxDegree(out),
    feedbackEdges: edges.filter((e) => e.relation === "feeds_back").length,
    ...extra,
  };
}

function decisionLevels(spec) {
  const nodeIds = (spec.nodes || []).map((n) => n.id);
  const branches = spec.branches || [];
  const { out, inc } = buildAdjacency(nodeIds, branches);
  const entries = (spec.nodes || []).filter((n) => n.kind === "entry").map((n) => n.id);
  const starts = entries.length ? entries : sources(inc, nodeIds);

  const level = new Map();
  const queue = starts.map((id) => ({ id, lv: 0 }));
  while (queue.length) {
    const { id, lv } = queue.shift();
    if (level.has(id) && level.get(id) <= lv) continue;
    level.set(id, lv);
    for (const v of out.get(id) || []) queue.push({ id: v, lv: lv + 1 });
  }
  return { level, out, inc, branches, nodeIds };
}

function hasDecisionCycle(spec) {
  const { nodeIds, branches } = decisionLevels(spec);
  const { out } = buildAdjacency(nodeIds, branches);
  const visited = new Set();
  const stack = new Set();

  const dfs = (u) => {
    visited.add(u);
    stack.add(u);
    for (const v of out.get(u) || []) {
      if (!visited.has(v)) {
        if (dfs(v)) return true;
      } else if (stack.has(v)) return true;
    }
    stack.delete(u);
    return false;
  };

  for (const id of nodeIds) {
    if (!visited.has(id) && dfs(id)) return true;
  }
  return false;
}

function hasSkipLevelBranch(spec) {
  const nodeIds = (spec.nodes || []).map((n) => n.id);
  const branches = spec.branches || [];

  const hasAltPath = (from, to, skipBranchId) => {
    const adj = new Map(nodeIds.map((id) => [id, []]));
    for (const b of branches) {
      if (b.id === skipBranchId) continue;
      if (adj.has(b.from)) adj.get(b.from).push(b.to);
    }
    const seen = new Set();
    const queue = [from];
    while (queue.length) {
      const u = queue.shift();
      if (u === to) return true;
      if (seen.has(u)) continue;
      seen.add(u);
      for (const v of adj.get(u) || []) queue.push(v);
    }
    return false;
  };

  return branches.some((b) => hasAltPath(b.from, b.to, b.id));
}

function hasBinaryRuleOut(spec) {
  const dead = new Set((spec.nodes || []).filter((n) => n.kind === "dead-end").map((n) => n.id));
  const { out } = buildAdjacency(
    (spec.nodes || []).map((n) => n.id),
    spec.branches || [],
  );
  for (const [from, targets] of out) {
    if (targets.length === 2 && targets.some((t) => dead.has(t))) return true;
  }
  return false;
}

function isLinearDecision(spec) {
  const nodeIds = (spec.nodes || []).map((n) => n.id);
  const branches = spec.branches || [];
  const connected = new Set();
  for (const b of branches) {
    connected.add(b.from);
    connected.add(b.to);
  }

  const { out, inc } = buildAdjacency(nodeIds, branches);
  for (const id of connected) {
    if (out.get(id).length > 1 || inc.get(id).length > 1) return false;
  }

  return branches.length === connected.size - 1;
}

function hasThresholdFragment(spec) {
  return (spec.branches || []).some((b) => b.threshold_fragment);
}

function analyzeDecisionAlgorithm(spec) {
  const branches = spec.branches || [];
  for (const b of branches) {
    if (!b.condition?.trim()) {
      return reject("UNLABELLED_DECISION_BRANCH", { branch: b.id || `${b.from}->${b.to}` });
    }
  }

  const deadEnds = (spec.nodes || []).filter((n) => n.kind === "dead-end");
  const conclusions = (spec.nodes || []).filter((n) => n.kind === "conclusion");

  const candidates = [];
  if (hasThresholdFragment(spec)) candidates.push("embedded-fragment");
  if (hasDecisionCycle(spec)) candidates.push("monitoring-loop");
  if (hasSkipLevelBranch(spec)) candidates.push("skip-level-branch");
  if (isLinearDecision(spec)) candidates.push("dependent-sequence");
  if (hasBinaryRuleOut(spec)) candidates.push("binary-rule-out");

  if (candidates.includes("embedded-fragment")) {
    return recognize("embedded-fragment", {
      primitive: "decision-algorithm",
      family: "embedded-fragment",
      branchCount: branches.length,
      fragmentBranches: branches.filter((b) => b.threshold_fragment).length,
    });
  }

  if (candidates.includes("monitoring-loop")) {
    return recognize("monitoring-loop", {
      primitive: "decision-algorithm",
      family: "monitoring-loop",
      cyclic: true,
      branchCount: branches.length,
    });
  }

  if (candidates.includes("skip-level-branch")) {
    return recognize("skip-level-branch", {
      primitive: "decision-algorithm",
      family: "skip-level-branch",
      branchCount: branches.length,
    });
  }

  if (candidates.includes("binary-rule-out")) {
    return recognize("binary-rule-out", {
      primitive: "decision-algorithm",
      family: "binary-rule-out",
      deadEnds: deadEnds.length,
      conclusions: conclusions.length,
    });
  }

  const linear = isLinearDecision(spec);
  const nodeIds = (spec.nodes || []).map((n) => n.id);
  const { out } = buildAdjacency(nodeIds, branches);
  if (!linear && nodeIds.some((id) => out.get(id).length > 1)) {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "decision branch" });
  }

  if (linear || candidates.includes("dependent-sequence")) {
    if (deadEnds.length === 0 && conclusions.length === 0) {
      return reject("MISSING_TERMINAL", { deadEnds: 0 });
    }
    return recognize("dependent-sequence", {
      primitive: "decision-algorithm",
      family: "dependent-sequence",
      nodeCount: (spec.nodes || []).length,
    });
  }

  if (deadEnds.length === 0) {
    return reject("MISSING_TERMINAL", { deadEnds: 0 });
  }

  return reject("UNSUPPORTED_TOPOLOGY", { candidates });
}

function analyzeThresholdScale(spec) {
  const contexts = spec.contexts || [];
  const hasFragment = spec.variant === "fragment" || branchesHaveFragment(spec);

  if (contexts.length === 0 && !hasFragment) {
    return reject("UNSUPPORTED_TOPOLOGY", { contexts: 0 });
  }

  if (contexts.length === 1) {
    return recognize("single-context", {
      primitive: "threshold-scale",
      family: "single-context",
      contextCount: 1,
      scaleCount: (contexts[0]?.scales || []).length,
    });
  }

  if (contexts.length >= 2) {
    return recognize("dual-context", {
      primitive: "threshold-scale",
      family: "dual-context",
      contextCount: contexts.length,
    });
  }

  return reject("UNSUPPORTED_TOPOLOGY", { variant: spec.variant });
}

function branchesHaveFragment(spec) {
  return false;
}

function analyzeComparisonMatrix(spec) {
  const poles = spec.poles || [];
  if (poles.length === 2) {
    return recognize("two-pole", {
      primitive: "comparison-matrix",
      family: "two-pole",
      poleCount: 2,
      dimensionCount: (spec.dimensions || []).length,
    });
  }
  if (poles.length === 3) {
    return recognize("three-pole-reflow", {
      primitive: "comparison-matrix",
      family: "three-pole-reflow",
      poleCount: 3,
      dimensionCount: (spec.dimensions || []).length,
    });
  }
  return reject("UNSUPPORTED_TOPOLOGY", { poleCount: poles.length });
}

function analyzeEnumerationSet(spec) {
  const groups = spec.groups || [];
  const setLogic = spec.set?.membership_logic;

  if (groups.length >= 2) {
    return recognize("grouped-concurrent", {
      primitive: "enumeration-set",
      family: "grouped-concurrent",
      groupCount: groups.length,
    });
  }

  if (groups.length <= 1 && (setLogic === "concurrent-set" || groups.length === 0)) {
    return recognize("flat-concurrent", {
      primitive: "enumeration-set",
      family: "flat-concurrent",
      groupCount: groups.length,
      itemCount: countEnumItems(spec),
    });
  }

  return reject("UNSUPPORTED_TOPOLOGY", { groupCount: groups.length });
}

function countEnumItems(spec) {
  let n = 0;
  for (const g of spec.groups || []) n += (g.items || []).length;
  if (spec.set && !spec.groups?.length) n += spec.set.expected_cardinality || 0;
  return n;
}

function analyzeQuantityModel(spec) {
  const states = spec.states || [];
  const identities = spec.identities || [];

  if (states.length === 2) {
    return recognize("two-state", {
      primitive: "quantity-model",
      family: "two-state",
      stateCount: 2,
      insightCount: (spec.insights || []).length,
    });
  }

  if (identities.length >= 1 && states.length <= 1) {
    return recognize("identity", {
      primitive: "quantity-model",
      family: "identity",
      identityCount: identities.length,
      stateCount: states.length,
    });
  }

  return reject("UNSUPPORTED_TOPOLOGY", { states: states.length, identities: identities.length });
}

function recognize(family, signature) {
  return { status: "recognized", family, signature, code: null, candidates: [family] };
}

function reject(code, signatureExtra = {}) {
  return {
    status: "rejected",
    family: null,
    code,
    signature: signatureExtra,
    candidates: [],
  };
}

function ambiguous(candidates, signature) {
  return { status: "ambiguous", family: null, code: "UNSUPPORTED_TOPOLOGY", signature, candidates };
}

/**
 * Compute structural family from a parsed visualSpec.
 * Ignores author-declared composition hints entirely.
 */
export function analyzeSignature(spec) {
  if (!spec || typeof spec !== "object") {
    return reject("UNSUPPORTED_TOPOLOGY", { reason: "invalid spec" });
  }

  for (const key of IGNORED_INTENT_FIELDS) {
    if (key in spec) {
      /* deliberately ignored */
    }
  }

  const pre = preGateChecks(spec);
  if (pre) return pre;

  const primitive = spec.primitive;
  switch (primitive) {
    case "causal-graph":
      return analyzeCausalGraph(spec);
    case "decision-algorithm":
      return analyzeDecisionAlgorithm(spec);
    case "threshold-scale":
      return analyzeThresholdScale(spec);
    case "comparison-matrix":
      return analyzeComparisonMatrix(spec);
    case "enumeration-set":
      return analyzeEnumerationSet(spec);
    case "quantity-model":
      return analyzeQuantityModel(spec);
    default:
      return reject("UNSUPPORTED_TOPOLOGY", { primitive });
  }
}

/** Gate before render: returns { allowed, code?, analysis } */
export function gateBeforeRender(spec) {
  const pre = preGateChecks(spec);
  if (pre) {
    return { allowed: false, code: pre.code, analysis: pre, stage: "budget-or-structure" };
  }

  const analysis = analyzeSignature(spec);

  if (analysis.status === "rejected") {
    return { allowed: false, code: analysis.code, analysis, stage: "signature" };
  }
  if (analysis.status === "ambiguous") {
    return { allowed: false, code: "UNSUPPORTED_TOPOLOGY", analysis, stage: "signature" };
  }

  // K3,2 must never reach renderer (also caught in causal analysis)
  if (spec.primitive === "causal-graph") {
    const nodeIds = (spec.nodes || []).map((n) => n.id);
    const forward = (spec.edges || []).filter((e) => e.relation !== "feeds_back");
    if (detectK32Subgraph(nodeIds, forward).found) {
      return {
        allowed: false,
        code: "NON_PLANAR_REQUIRED_CROSSING",
        analysis,
        stage: "signature",
      };
    }
  }

  return { allowed: true, code: null, analysis, stage: "signature" };
}

export function signatureMatchesFamily(analysis, expectedFamilyId) {
  return analysis.status === "recognized" && analysis.family === expectedFamilyId;
}
