/**
 * W1 end-to-end pipeline:
 * visualSpec → recognizeFamily → enforceFamilyContract → buildCompositionPlan
 * → validateCompositionPlan → serializeArtifact
 */

import { validateVisualSpec } from "../visual-spec.js";
import { loadVcckInventory } from "./inventory.js";
import { loadFamilyRegistry } from "./registry.js";
import { isW1Family } from "./w1-constants.js";
import { enforceFamilyContract } from "./w1-contracts.js";
import { buildCompositionPlan } from "./w1-build-plan.js";
import { validateCompositionPlan } from "./w1-composition-plan.js";
import { serializeArtifact, wrapHtmlDocument } from "./w1-serialize.js";

function w1PrimitiveContractOverride(spec, expectedFamily) {
  if (!String(spec.chapter || "").includes("vcck/w1") || !expectedFamily) return {};
  const family = loadFamilyRegistry().families.find((f) => f.id === expectedFamily);
  if (!family?.budgets) return {};
  const b = family.budgets;
  return {
    ...(b.maxNodes != null ? { maxNodes: b.maxNodes } : {}),
    ...(b.maxEdges != null ? { maxEdges: b.maxEdges } : {}),
    ...(b.maxLabelWords != null ? { maxLabelWords: b.maxLabelWords } : {}),
  };
}

export function runW1Pipeline(spec, options = {}) {
  const inventory = options.inventory || loadVcckInventory();
  const expectedFamily = options.expectedFamily || null;

  const validation = validateVisualSpec(spec, {
    inventory,
    primitiveContractOverride: w1PrimitiveContractOverride(spec, expectedFamily),
  });
  if (!validation.ok) {
    return { ok: false, stage: "validation", errors: validation.errors, plan: null, artifact: null };
  }

  const contract = enforceFamilyContract(spec, expectedFamily);
  if (!contract.ok) {
    return {
      ok: false,
      stage: "contract",
      code: contract.code,
      errors: [`${contract.code}: W1 family contract rejected`],
      analysis: contract.analysis,
      plan: null,
      artifact: null,
    };
  }

  const family = contract.family;
  if (!isW1Family(family)) {
    return { ok: false, stage: "contract", errors: ["not a W1 family"], plan: null, artifact: null };
  }

  const built = buildCompositionPlan(spec, family, contract.contract);
  if (!built.ok) {
    return { ok: false, stage: "plan-build", errors: built.errors, plan: null, artifact: null };
  }

  const planCheck = validateCompositionPlan(built.plan);
  if (!planCheck.ok) {
    return { ok: false, stage: "plan-validate", errors: planCheck.errors, plan: built.plan, artifact: null };
  }

  const serialized = serializeArtifact(spec, built.plan);
  if (!serialized.ok) {
    return { ok: false, stage: "serialize", errors: serialized.errors, plan: built.plan, artifact: null };
  }

  let artifact = serialized.artifact;
  if (serialized.kind === "html") {
    artifact = wrapHtmlDocument(spec, artifact);
  }

  return {
    ok: true,
    stage: "rendered",
    errors: [],
    family,
    analysis: contract.analysis,
    contract: contract.contract,
    plan: built.plan,
    artifact,
    kind: serialized.kind,
  };
}

export function renderW1Spec(spec, analysis, options = {}) {
  const expectedFamily = analysis?.family || options.expectedFamily;
  const result = runW1Pipeline(spec, { ...options, expectedFamily });
  if (!result.ok) {
    return {
      ok: false,
      stage: result.stage,
      errors: result.errors,
      artifact: null,
      layout: null,
      gate: { allowed: false, code: result.code, analysis: result.analysis },
      plan: result.plan,
    };
  }
  return {
    ok: true,
    stage: "rendered",
    errors: [],
    artifact: result.artifact,
    layout: result.plan,
    kind: result.kind,
    plan: result.plan,
    gate: { allowed: true, analysis: result.analysis },
  };
}

export { isW1Family };
