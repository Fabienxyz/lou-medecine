import type { BuildContext } from "../src/pipeline/context.js";
import { runBlueprint as runBlueprintLegacy } from "../lib/blueprint-stage.js";
import { runGrounding as runGroundingLegacy } from "../lib/grounding.js";
import { runInventory as runInventoryLegacy } from "../lib/inventory-stage.js";
import { runPackageInput as runPackageInputLegacy } from "../lib/package-input.js";
import { runPackaging as runPackagingLegacy } from "../lib/packaging-stage.js";
import { runProjections as runProjectionsLegacy } from "../lib/projections.js";
import { runReconciliation as runReconciliationLegacy } from "../lib/reconciliation.js";
import { runValidation as runValidationLegacy } from "../lib/validation.js";
import { runVisuals as runVisualsLegacy } from "../lib/visuals.js";
import { runBlueprint } from "../src/stages/blueprint.js";
import { runGrounding } from "../src/stages/grounding.js";
import { runInventory } from "../src/stages/inventory.js";
import { runPackageInput } from "../src/stages/package-input.js";
import { runPackaging } from "../src/stages/packaging.js";
import { runProjections } from "../src/stages/projections.js";
import { runReconciliation } from "../src/stages/reconciliation.js";
import { runValidation } from "../src/stages/validation.js";
import { runVisuals } from "../src/stages/visuals.js";

export type SeedMode = "legacy" | "migrated";

export type ThroughStage = "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

const LEGACY = {
  packageInput: runPackageInputLegacy,
  inventory: runInventoryLegacy,
  reconciliation: runReconciliationLegacy,
  blueprint: runBlueprintLegacy,
  projections: runProjectionsLegacy,
  visuals: runVisualsLegacy,
  grounding: runGroundingLegacy,
  validation: runValidationLegacy,
  packaging: runPackagingLegacy,
};

const MIGRATED = {
  packageInput: runPackageInput,
  inventory: runInventory,
  reconciliation: runReconciliation,
  blueprint: runBlueprint,
  projections: runProjections,
  visuals: runVisuals,
  grounding: runGrounding,
  validation: runValidation,
  packaging: runPackaging,
};

export function seedThrough(
  ctx: BuildContext,
  through: ThroughStage,
  mode: SeedMode,
): void {
  const f = mode === "legacy" ? LEGACY : MIGRATED;

  f.packageInput(ctx);
  if (through === "B") return;
  f.inventory(ctx);
  if (through === "C") return;
  f.reconciliation(ctx);
  if (through === "D") return;
  f.blueprint(ctx);
  if (through === "E") return;
  f.projections(ctx);
  if (through === "F") return;
  f.visuals(ctx);
  if (through === "G") return;
  f.grounding(ctx);
  if (through === "H") return;
  f.validation(ctx);
  if (through === "I") return;
  f.packaging(ctx);
}

export function pickSeedFns(mode: SeedMode) {
  return mode === "legacy" ? LEGACY : MIGRATED;
}
