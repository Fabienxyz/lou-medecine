import { acquisitionStage } from "../stages/acquisition.js";
import { blueprintStage } from "../stages/blueprint.js";
import { groundingStage } from "../stages/grounding.js";
import { inventoryStage } from "../stages/inventory.js";
import { packageInputStage } from "../stages/package-input.js";
import { packagingStage } from "../stages/packaging.js";
import { projectionsStage } from "../stages/projections.js";
import { publicationStage } from "../stages/publication.js";
import { reconciliationStage } from "../stages/reconciliation.js";
import { validationStage } from "../stages/validation.js";
import { visualsStage } from "../stages/visuals.js";
import type { Stage } from "./stage.js";

/** Full pipeline including acquisition (A–K). */
export const FULL_PIPELINE: Stage[] = [
  acquisitionStage,
  packageInputStage,
  inventoryStage,
  reconciliationStage,
  blueprintStage,
  projectionsStage,
  visualsStage,
  groundingStage,
  validationStage,
  packagingStage,
  publicationStage,
];

/**
 * Chapter fabrication pipeline (B–K).
 * Acquisition (A) is handled by Tool 01/02 upstream.
 */
export const CHAPTER_PIPELINE: Stage[] = FULL_PIPELINE.filter(
  (s) => s.id !== "acquisition",
);

/** Validate: read-only gates through publication verdict (no manifest write). */
export const VALIDATE_PIPELINE: Stage[] = CHAPTER_PIPELINE.filter(
  (s) => s.id !== "packaging" && s.id !== "publication",
);

/** Build: full chapter pipeline including packaging and publication. */
export const BUILD_PIPELINE: Stage[] = CHAPTER_PIPELINE;
