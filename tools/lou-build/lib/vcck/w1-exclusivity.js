/**
 * W1 exclusivity matrix — one family per positive, documented boundaries.
 */

import { analyzeSignature } from "./signature-analyzer.js";
import { enforceFamilyContract } from "./w1-contracts.js";
import { W1_FAMILIES } from "./w1-constants.js";

export const W1_EXCLUSIVITY_POSITIVES = Object.freeze({
  chain: "chain-short.yaml",
  "dependent-sequence": "dependent-sequence-short.yaml",
  "two-pole": "two-pole-short.yaml",
  "flat-concurrent": "flat-concurrent-short.yaml",
});

/** Minimal boundary mutations — expected family or reject code. */
export const W1_BOUNDARY_MUTATIONS = Object.freeze([
  {
    id: "chain-add-branch",
    baseFamily: "chain",
    mutate: (spec) => {
      const copy = structuredClone(spec);
      copy.nodes.push({ id: "fork", kind: "state", label: "Embranchement", class: "scaffolding" });
      copy.edges.push({ from: copy.nodes[1].id, to: "fork", relation: "causes", class: "scaffolding" });
      return copy;
    },
    expect: { family: null, code: "UNSUPPORTED_TOPOLOGY" },
  },
  {
    id: "dependent-sequence-binary",
    baseFamily: "dependent-sequence",
    mutate: (spec) => {
      const copy = structuredClone(spec);
      copy.nodes.push({ id: "alt", kind: "conclusion", label: "Alt", class: "scaffolding" });
      copy.branches.push({ id: "b-alt", from: "check", to: "alt", condition: "Autre", class: "scaffolding" });
      return copy;
    },
    expect: { family: null, codes: ["UNSUPPORTED_TOPOLOGY", "MISSING_TERMINAL"] },
  },
  {
    id: "two-pole-third-pole",
    baseFamily: "two-pole",
    mutate: (spec) => {
      const copy = structuredClone(spec);
      copy.poles.push({ id: "air", label: "Avion", pole_type: "entity", class: "scaffolding" });
      return copy;
    },
    expect: { family: "three-pole-reflow", code: null },
  },
  {
    id: "flat-concurrent-second-group",
    baseFamily: "flat-concurrent",
    mutate: (spec) => {
      const copy = structuredClone(spec);
      copy.groups.push({
        id: "grp-b",
        label: "Groupe B",
        membership_logic: "concurrent-set",
        ordering_semantics: "none",
        expected_cardinality: 2,
        class: "scaffolding",
        items: [
          { id: "x1", label: "Alpha", class: "scaffolding" },
          { id: "x2", label: "Beta", class: "scaffolding" },
        ],
      });
      return copy;
    },
    expect: { family: "grouped-concurrent", code: null },
  },
]);

/** Evaluate W1 admission predicates independently — not from mechanical candidates array. */
export function listW1StructuralCandidates(spec) {
  const admitted = [];
  for (const familyId of W1_FAMILIES) {
    const enforced = enforceFamilyContract(spec, familyId);
    if (!enforced.ok) continue;
    const analysis = analyzeSignature(spec);
    if (analysis.status === "recognized" && analysis.family === familyId) {
      admitted.push(familyId);
    }
  }
  return admitted;
}

export function checkW1ExclusivityStrict(spec, expectedFamily) {
  const candidates = listW1StructuralCandidates(spec);
  const analysis = analyzeSignature(spec);
  const enforced = enforceFamilyContract(spec, expectedFamily);

  const exclusive =
    candidates.length === 1 &&
    candidates[0] === expectedFamily &&
    analysis.status === "recognized" &&
    analysis.family === expectedFamily &&
    enforced.ok;

  return {
    exclusive,
    candidates,
    analysis,
    enforced,
    expectedFamily,
    candidateCount: candidates.length,
  };
}

/** @deprecated use checkW1ExclusivityStrict */
export function checkW1Exclusivity(spec, expectedFamily) {
  return checkW1ExclusivityStrict(spec, expectedFamily);
}

export function evaluateBoundaryMutation(mutation, spec) {
  const mutated = mutation.mutate(spec);
  const analysis = analyzeSignature(mutated);
  const enforced = enforceFamilyContract(mutated);

  let pass = false;
  if (mutation.expect.codes) {
    pass =
      !enforced.ok &&
      (mutation.expect.codes.includes(enforced.code) || mutation.expect.codes.includes(analysis.code));
  } else if (mutation.expect.code) {
    pass = !enforced.ok && (enforced.code === mutation.expect.code || analysis.code === mutation.expect.code);
  } else if (mutation.expect.family) {
    pass = analysis.status === "recognized" && analysis.family === mutation.expect.family;
  }

  return {
    id: mutation.id,
    pass,
    observedFamily: analysis.family,
    observedCode: enforced.code || analysis.code,
    expected: mutation.expect,
  };
}

export function w1ExclusivityMatrixSummary() {
  return {
    families: [...W1_FAMILIES],
    positives: { ...W1_EXCLUSIVITY_POSITIVES },
    boundaries: W1_BOUNDARY_MUTATIONS.map((m) => ({ id: m.id, baseFamily: m.baseFamily, expect: m.expect })),
  };
}
