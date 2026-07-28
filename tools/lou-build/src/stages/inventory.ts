import { loadYamlFile } from "../../lib/anchors.js";
import { validateInventory } from "../../lib/inventory.js";
import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { fail, ok, requireWorkspace, setWorkspace } from "../utils/stage-result.js";

/**
 * Stage C — Knowledge Inventory (curatif) — doc 19 §2, contrat 04 §4.
 *
 * Migrated from lib/inventory-stage.js — behavior must remain identical.
 */
export function runInventory(ctx: BuildContext): StageResult {
  const paths = requireWorkspace<{ inventory: string }>(ctx, "paths");
  const packageConfig = requireWorkspace<{ mode?: string }>(
    ctx,
    "packageConfig",
  );

  const inventory = loadYamlFile(paths.inventory) as {
    inventory_scope?: string;
    kps?: unknown[];
  };

  const invVal = validateInventory(inventory, {
    requireSlice:
      packageConfig?.mode === "slice" &&
      inventory.inventory_scope !== "full-chapter",
  });

  setWorkspace(ctx, "inventory", inventory);
  setWorkspace(ctx, "inventoryValidation", invVal);

  return invVal.ok
    ? ok(invVal)
    : fail(invVal.errors || ["inventory validation failed"], invVal);
}

/** Stage C — Knowledge Inventory (curatif). */
export const inventoryStage: Stage = {
  id: "inventory",
  label: "Knowledge Inventory",
  dependsOn: ["package-input"],
  curative: true,
  run(ctx) {
    return runInventory(ctx);
  },
};
