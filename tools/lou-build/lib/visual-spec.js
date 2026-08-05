import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import YAML from "yaml";
import { inventoryById } from "./inventory.js";
import { validateVisualSpecV02, visualSpecClaimUnitsV02 } from "./visual-spec-v02.js";

/**
 * visualSpec v0.1 — EXPERIMENTAL.
 *
 * Semantic intermediate representation between Blueprint and renderer.
 * Governed by VISUAL_GRAMMAR_CONTRACT.md. The schema is deliberately NOT frozen:
 * it must survive a first vertical slice before it can become normative.
 *
 * This module validates meaning and traceability only. It renders nothing and
 * knows nothing about geometry.
 */

export const VISUAL_SPEC_VERSION = "0.1";

export const SUPPORTED_PRIMITIVES = new Set(["causal-graph"]);

/** Reused verbatim from the existing claim-block vocabulary (claims.js / ground.js). */
export const CLAIM_CLASSES = new Set(["sourced", "bridging", "scaffolding"]);

export const NODE_KINDS = new Set(["state", "event", "response"]);

export const EDGE_RELATIONS = new Set([
  "causes",
  "transmits",
  "feeds_back",
  "contributes_to",
  "triggers_response",
]);

/** Relations that require a learner-visible relation_label on the edge. */
export const RELATION_LABEL_REQUIRED = new Set(["contributes_to", "triggers_response"]);

/**
 * Structural budgets belong to the primitive contract, never to the instance,
 * so that a spec cannot raise its own limits.
 */
export const PRIMITIVE_CONTRACTS = {
  "causal-graph": {
    maxNodes: 8,
    maxEdges: 12,
    maxLabelWords: 6,
    maxCycles: 1,
  },
};

const SPEC_KEYS = new Set([
  "spec_version",
  "primitive",
  "chapter",
  "element",
  "question",
  "provenance",
  "nodes",
  "edges",
]);

const NODE_KEYS = new Set(["id", "kind", "label", "class", "kp"]);

const EDGE_KEYS = new Set(["from", "to", "relation", "relation_label", "class", "kp"]);

const PROVENANCE_KEYS = new Set([
  "source_edition",
  "blueprint_revision",
  "methodology_version",
]);

/**
 * Contract invariant I3: a visualSpec carries zero geometry.
 * Any key here is rejected with a specific message rather than a generic one,
 * because this is the invariant most likely to be violated by habit.
 */
export const FORBIDDEN_GEOMETRY_KEYS = new Set([
  "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "dx", "dy", "rx", "ry", "r",
  "width", "height", "w", "h", "size", "scale", "viewbox", "viewBox",
  "top", "left", "right", "bottom", "row", "column", "col", "grid",
  "position", "coordinates", "coords", "point", "points", "path", "d",
  "layout", "align", "anchor", "offset", "margin", "padding", "spacing", "gap",
  "fill", "stroke", "color", "colour", "background", "opacity",
  "font", "font_size", "fontSize", "font_family", "fontFamily",
  "style", "css", "class_name", "className", "theme", "token",
  "svg", "markup", "template", "shape", "icon", "marker", "arrowhead",
  "transform", "rotate", "z_index", "zIndex", "order_x", "order_y",
]);

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export function parseVisualSpec(text) {
  const doc = YAML.parse(text);
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error("visualSpec must be a YAML mapping");
  }
  return doc;
}

export function loadVisualSpec(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`visualSpec not found: ${filePath}`);
  }
  return parseVisualSpec(fs.readFileSync(filePath, "utf8"));
}

/**
 * Canonical on-disk path for a chapter visualSpec file.
 * @param {string} buildDir
 * @param {string} elementId
 */
export function visualSpecFilePath(buildDir, elementId) {
  return path.join(
    buildDir,
    "visual-specs",
    `${String(elementId).toLowerCase()}.yaml`,
  );
}

// ---------------------------------------------------------------------------
// Graph helpers
// ---------------------------------------------------------------------------

/**
 * Enumerate simple cycles, each exactly once, rooted at its lowest-index node.
 * The graph is tiny by contract (maxNodes), so exhaustive DFS is appropriate.
 * `cap` guards against a malformed spec that slipped past the budget check.
 */
export function findSimpleCycles(nodeIds, edges, cap = 200) {
  const index = new Map(nodeIds.map((id, i) => [id, i]));
  const adj = new Map(nodeIds.map((id) => [id, []]));
  for (const e of edges) {
    if (adj.has(e.from) && index.has(e.to)) adj.get(e.from).push(e.to);
  }

  const cycles = [];
  let truncated = false;

  for (const start of nodeIds) {
    if (truncated) break;
    const startIdx = index.get(start);
    const stack = [];
    const onStack = new Set();

    const walk = (u) => {
      if (truncated) return;
      stack.push(u);
      onStack.add(u);
      for (const v of adj.get(u) || []) {
        if (index.get(v) < startIdx) continue;
        if (v === start) {
          cycles.push([...stack, start]);
          if (cycles.length >= cap) {
            truncated = true;
            break;
          }
        } else if (!onStack.has(v)) {
          walk(v);
          if (truncated) break;
        }
      }
      stack.pop();
      onStack.delete(u);
    };

    walk(start);
  }

  return { cycles, truncated };
}

function countWords(label) {
  return String(label).trim().split(/\s+/).filter(Boolean).length;
}

function checkKeys(obj, allowed, where, errors) {
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) continue;
    if (FORBIDDEN_GEOMETRY_KEYS.has(key)) {
      errors.push(
        `${where}: forbidden geometry/style field "${key}" — visualSpec carries no layout (contract I3)`
      );
    } else {
      errors.push(`${where}: unknown field "${key}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Deterministic validation of a visualSpec.
 *
 * Referential checks against the canonical Inventory and Blueprint run only when
 * those are supplied, so unit tests stay fast and structural checks stay pure.
 */
export function validateVisualSpec(spec, options = {}) {
  const errors = [];
  const { inventory = null, blueprintElementIds = null } = options;

  if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
    return { ok: false, errors: ["visualSpec must be a mapping"], stats: null };
  }

  if (String(spec.spec_version) === "0.2") {
    const inv = inventory?.kps ? inventory.kps : inventory;
    return validateVisualSpecV02(spec, {
      inventory: inv,
      n09Reference: options.n09Reference || null,
    });
  }

  // --- A. schema shape + H. forbidden geometry (top level) -----------------
  checkKeys(spec, SPEC_KEYS, "spec", errors);

  if (spec.spec_version == null) {
    errors.push("spec: missing spec_version");
  } else if (String(spec.spec_version) !== VISUAL_SPEC_VERSION) {
    errors.push(
      `spec: unsupported spec_version ${spec.spec_version} (this build understands ${VISUAL_SPEC_VERSION})`
    );
  }

  // --- B. primitive discriminator ------------------------------------------
  if (!spec.primitive) {
    errors.push("spec: missing primitive discriminator");
  } else if (!SUPPORTED_PRIMITIVES.has(spec.primitive)) {
    errors.push(`spec: unsupported primitive "${spec.primitive}"`);
  }

  if (!spec.chapter) errors.push("spec: missing chapter");
  if (!spec.element) errors.push("spec: missing element");
  if (!spec.question || !String(spec.question).trim()) {
    errors.push("spec: missing question");
  }

  if (spec.provenance != null) {
    if (typeof spec.provenance !== "object" || Array.isArray(spec.provenance)) {
      errors.push("spec: provenance must be a mapping");
    } else {
      checkKeys(spec.provenance, PROVENANCE_KEYS, "spec.provenance", errors);
    }
  }

  if (
    blueprintElementIds &&
    spec.element &&
    !blueprintElementIds.has(spec.element)
  ) {
    errors.push(`spec: element ${spec.element} is not a Blueprint element`);
  }

  const nodes = Array.isArray(spec.nodes) ? spec.nodes : null;
  const edges = Array.isArray(spec.edges) ? spec.edges : null;
  if (!nodes || nodes.length === 0) errors.push("spec: nodes must be a non-empty array");
  if (!edges || edges.length === 0) errors.push("spec: edges must be a non-empty array");

  if (!nodes || !edges) {
    return { ok: false, errors, stats: null };
  }

  const contract =
    PRIMITIVE_CONTRACTS[spec.primitive] || PRIMITIVE_CONTRACTS["causal-graph"];
  const kpMap = inventory ? inventoryById(inventory) : null;

  // --- nodes ---------------------------------------------------------------
  const nodeIds = [];
  const seen = new Set();

  nodes.forEach((node, i) => {
    const where = `node[${i}]${node?.id ? ` (${node.id})` : ""}`;
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      errors.push(`${where}: must be a mapping`);
      return;
    }
    checkKeys(node, NODE_KEYS, where, errors);

    // C. unique node IDs
    if (!node.id) {
      errors.push(`${where}: missing id`);
    } else if (!ID_RE.test(node.id)) {
      errors.push(`${where}: id must be lowercase kebab-case`);
    } else if (seen.has(node.id)) {
      errors.push(`${where}: duplicate node id "${node.id}"`);
    } else {
      seen.add(node.id);
      nodeIds.push(node.id);
    }

    if (!node.kind) {
      errors.push(`${where}: missing kind`);
    } else if (!NODE_KINDS.has(node.kind)) {
      errors.push(`${where}: unknown kind "${node.kind}"`);
    }

    if (!node.label || !String(node.label).trim()) {
      errors.push(`${where}: missing label`);
    } else if (countWords(node.label) > contract.maxLabelWords) {
      // I. structural budget — label compactness is semantic, not cosmetic:
      // a paragraph in a node means the relationship was not actually modelled.
      errors.push(
        `${where}: label exceeds ${contract.maxLabelWords} words (${countWords(node.label)})`
      );
    }

    validateGrounding(node, where, "node", kpMap, errors);
  });

  // --- edges ---------------------------------------------------------------
  const nodeIdSet = new Set(nodeIds);
  const edgeKeys = new Set();

  edges.forEach((edge, i) => {
    const where = `edge[${i}]${edge?.from && edge?.to ? ` (${edge.from}->${edge.to})` : ""}`;
    if (!edge || typeof edge !== "object" || Array.isArray(edge)) {
      errors.push(`${where}: must be a mapping`);
      return;
    }
    checkKeys(edge, EDGE_KEYS, where, errors);

    // D. edge endpoints must exist
    if (!edge.from) errors.push(`${where}: missing from`);
    else if (!nodeIdSet.has(edge.from)) {
      errors.push(`${where}: dangling edge endpoint "from: ${edge.from}"`);
    }
    if (!edge.to) errors.push(`${where}: missing to`);
    else if (!nodeIdSet.has(edge.to)) {
      errors.push(`${where}: dangling edge endpoint "to: ${edge.to}"`);
    }
    if (edge.from && edge.from === edge.to) {
      errors.push(`${where}: self-loop is not a modellable relationship`);
    }

    const key = `${edge.from}->${edge.to}`;
    if (edgeKeys.has(key)) errors.push(`${where}: duplicate edge ${key}`);
    edgeKeys.add(key);

    if (!edge.relation) {
      errors.push(`${where}: missing relation`);
    } else if (!EDGE_RELATIONS.has(edge.relation)) {
      errors.push(`${where}: unknown relation "${edge.relation}"`);
    }

    if (RELATION_LABEL_REQUIRED.has(edge.relation)) {
      if (!edge.relation_label || !String(edge.relation_label).trim()) {
        errors.push(`${where}: relation "${edge.relation}" requires relation_label`);
      } else if (countWords(edge.relation_label) > contract.maxLabelWords) {
        errors.push(
          `${where}: relation_label exceeds ${contract.maxLabelWords} words (${countWords(edge.relation_label)})`,
        );
      }
    } else if (edge.relation_label) {
      errors.push(`${where}: relation_label is only allowed on contributes_to or triggers_response`);
    }

    validateGrounding(edge, where, "edge", kpMap, errors);
  });

  const k32 = detectK32Subgraph(nodeIds, edges);
  if (k32.found) {
    errors.push(
      `spec: topology contains K3,2 subgraph (${k32.sources.join(", ")} → ${k32.targets.join(", ")}) — ` +
        `forces edge crossings or exceeds allowed readability`,
    );
  }

  // --- I. structural budget -------------------------------------------------
  if (nodes.length > contract.maxNodes) {
    errors.push(
      `spec: ${nodes.length} nodes exceeds ${spec.primitive} budget of ${contract.maxNodes}`
    );
  }
  if (edges.length > contract.maxEdges) {
    errors.push(
      `spec: ${edges.length} edges exceeds ${spec.primitive} budget of ${contract.maxEdges}`
    );
  }

  // --- K. no silent orphan semantic content --------------------------------
  const touched = new Set();
  for (const edge of edges) {
    if (edge?.from) touched.add(edge.from);
    if (edge?.to) touched.add(edge.to);
  }
  for (const id of nodeIds) {
    if (!touched.has(id)) {
      errors.push(`node ${id}: orphan — participates in no edge`);
    }
  }

  // --- J. cycle discipline --------------------------------------------------
  const { cycles, truncated } = findSimpleCycles(nodeIds, edges);
  if (truncated) {
    errors.push("spec: cycle enumeration exceeded safe bound — graph too complex");
  }
  // The budget is on declared feedback relations, not on enumerated simple cycles.
  // A single back edge closing over a fan-out/fan-in produces several simple
  // cycles while asserting one feedback relationship, and counting paths there
  // would reject a shape the grammar is meant to express.
  const feedbackRelations = edges.filter((e) => e?.relation === "feeds_back").length;
  if (feedbackRelations > contract.maxCycles) {
    errors.push(
      `spec: ${feedbackRelations} feedback relations exceeds ${spec.primitive} budget of ${contract.maxCycles}`
    );
  }
  // A cycle that is not declared as feedback is an accidental cycle, which would
  // teach reinforcement the author never asserted.
  for (const cycle of cycles) {
    const members = cycleEdges(cycle, edges);
    if (!members.some((e) => e.relation === "feeds_back")) {
      errors.push(
        `spec: cycle ${cycle.join(" -> ")} contains no feeds_back relation — undeclared feedback`
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      primitive: spec.primitive,
      element: spec.element,
      nodes: nodes.length,
      edges: edges.length,
      cycles: cycles.length,
      cyclePaths: cycles.map((c) => c.join(" -> ")),
      feedbackRelations,
      classes: countClasses(nodes, edges),
    },
  };
}

function cycleEdges(cyclePath, edges) {
  const out = [];
  for (let i = 0; i < cyclePath.length - 1; i++) {
    const e = edges.find(
      (x) => x?.from === cyclePath[i] && x?.to === cyclePath[i + 1]
    );
    if (e) out.push(e);
  }
  return out;
}

function countClasses(nodes, edges) {
  const tally = { sourced: 0, bridging: 0, scaffolding: 0 };
  for (const unit of [...nodes, ...edges]) {
    if (unit && tally[unit.class] != null) tally[unit.class] += 1;
  }
  return tally;
}

/**
 * Detect a K3,2 complete bipartite subgraph: three sources each linked to the
 * same two targets. Such topologies are non-planar in layered layout and force
 * crossings or illegible edge density.
 */
export function detectK32Subgraph(nodeIds, edges) {
  const forward = (edges || []).filter((e) => e?.relation !== "feeds_back");
  const hasEdge = (from, to) => forward.some((e) => e.from === from && e.to === to);

  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const t1 = nodeIds[i];
      const t2 = nodeIds[j];
      const sources = nodeIds.filter(
        (s) => s !== t1 && s !== t2 && hasEdge(s, t1) && hasEdge(s, t2),
      );
      if (sources.length >= 3) {
        return {
          found: true,
          sources: sources.slice(0, 3),
          targets: [t1, t2],
        };
      }
    }
  }
  return { found: false };
}

/**
 * Contract invariant I2: every learner-visible semantic unit is traced to
 * Knowledge Points or explicitly classified as scaffolding. There is no third
 * state, and absence is a failure rather than a default.
 *
 * Rules F (nodes) and G (edges) share this check because an edge is a claim:
 * A and B each being supported does not make "A causes B" supported.
 */
function validateGrounding(unit, where, unitKind, kpMap, errors) {
  if (!unit.class) {
    errors.push(`${where}: missing class (sourced | bridging | scaffolding)`);
    return;
  }
  if (!CLAIM_CLASSES.has(unit.class)) {
    errors.push(`${where}: unknown class "${unit.class}"`);
    return;
  }

  const kp = unit.kp;
  if (unit.class === "scaffolding") {
    if (Array.isArray(kp) && kp.length > 0) {
      errors.push(`${where}: scaffolding ${unitKind} must not claim KP grounding`);
    }
    return;
  }

  if (!Array.isArray(kp) || kp.length === 0) {
    errors.push(
      `${where}: ungrounded ${unitKind} — class "${unit.class}" requires at least one KP reference`
    );
    return;
  }

  // E. every KP reference resolves in the canonical inventory
  if (kpMap) {
    for (const kpId of kp) {
      if (!kpMap.has(kpId)) {
        errors.push(`${where}: unknown KP reference ${kpId}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Grounding integration adapter
// ---------------------------------------------------------------------------

/**
 * Stable content digest of a semantic unit.
 *
 * A grounding verdict is a judgement about specific wording, a specific relation,
 * and a specific KP set. Binding the verdict to this digest is what stops a
 * review record from decaying into a permanent auto-pass allowlist: edit the
 * unit and its verdict stops applying.
 */
export function semanticDigest(parts) {
  return crypto
    .createHash("sha256")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, 16);
}

/**
 * Project a visualSpec onto the EXISTING claim-block shape, so visual semantics
 * flow through the same traceability and grounding machinery as prose rather
 * than a parallel visual-only system.
 *
 * The returned objects are accepted as-is by assembleTraceability() and by the
 * class handling in mergeSemanticGrounding(). Nothing here writes or renders.
 */
export function visualSpecClaimUnits(spec) {
  if (String(spec?.spec_version) === "0.2") {
    return visualSpecClaimUnitsV02(spec);
  }
  const slug = String(spec.element).toLowerCase();
  const units = [];

  for (const node of spec.nodes || []) {
    const kp = node.kp || [];
    units.push({
      id: `cb-vis-${slug}-n-${node.id}`,
      class: node.class,
      kp,
      element: spec.element,
      unit: "node",
      ref: node.id,
      text: node.label,
      digest: semanticDigest([
        "node",
        node.id,
        node.kind,
        node.label,
        node.class,
        [...kp].join(","),
      ]),
    });
  }

  for (const edge of spec.edges || []) {
    const kp = edge.kp || [];
    units.push({
      id: `cb-vis-${slug}-e-${edge.from}-to-${edge.to}`,
      class: edge.class,
      kp,
      element: spec.element,
      unit: "edge",
      ref: `${edge.from}->${edge.to}`,
      text: `${edge.from} ${edge.relation} ${edge.to}`,
      digest: semanticDigest([
        "edge",
        edge.from,
        edge.to,
        edge.relation,
        edge.class,
        edge.relation_label || "",
        [...kp].join(","),
      ]),
    });

    if (edge.relation_label) {
      units.push({
        id: `cb-vis-${slug}-rl-${edge.from}-to-${edge.to}`,
        class: edge.class,
        kp,
        element: spec.element,
        unit: "relation-label",
        ref: `${edge.from}->${edge.to}`,
        text: edge.relation_label,
        digest: semanticDigest([
          "relation-label",
          edge.from,
          edge.to,
          edge.relation,
          edge.relation_label,
          edge.class,
          [...kp].join(","),
        ]),
      });
    }
  }

  return units;
}
