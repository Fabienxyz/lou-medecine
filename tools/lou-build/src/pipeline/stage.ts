/** Pipeline stage identifiers — aligned with doc 19 (A–K). */
export type StageId =
  | "acquisition"
  | "package-input"
  | "inventory"
  | "reconciliation"
  | "blueprint"
  | "projections"
  | "visuals"
  | "grounding"
  | "validation"
  | "packaging"
  | "publication";

/** Doc 19 letter codes for logging and reports. */
export const STAGE_LETTER: Record<StageId, string> = {
  acquisition: "A",
  "package-input": "B",
  inventory: "C",
  reconciliation: "D",
  blueprint: "E",
  projections: "F",
  visuals: "G",
  grounding: "H",
  validation: "I",
  packaging: "J",
  publication: "K",
};

export interface StageResult {
  ok: boolean;
  errors: string[];
  /** Stage-specific payload (validation details, withheld visuals, etc.). */
  data?: unknown;
}

export interface Stage {
  id: StageId;
  label: string;
  /** Hard dependencies — must complete successfully before this stage runs. */
  dependsOn: StageId[];
  /**
   * Stages that may run concurrently with this one (same dependency frontier).
   * Doc 19: F ∥ G after E.
   */
  parallelWith?: StageId[];
  /** Curative stages are never modified by downstream generation (doc 19 §5). */
  curative?: boolean;
  /** When false, failure does not block the pipeline (doc 19: visuals withheld). */
  blocking?: boolean;
  run(ctx: import("./context.js").BuildContext): Promise<StageResult> | StageResult;
}
