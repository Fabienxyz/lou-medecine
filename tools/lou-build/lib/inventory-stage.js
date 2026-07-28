/**
 * Stage C — Knowledge Inventory (legacy reference implementation).
 *
 * Migrated implementation lives in src/stages/inventory.ts.
 * Validation logic remains in lib/inventory.js.
 */

import { loadYamlFile } from "./anchors.js";
import { validateInventory } from "./inventory.js";

function requireWorkspace(ctx, key) {
  const value = ctx.workspace[key];
  if (value === undefined) {
    throw new Error(`Pipeline workspace missing required key: ${key}`);
  }
  return value;
}

/**
 * @param {{ chapterDir: string, command: string, mutate: boolean, workspace: Record<string, unknown> }} ctx
 * @returns {{ ok: boolean, errors: string[], data?: unknown }}
 */
export function runInventory(ctx) {
  const paths = requireWorkspace(ctx, "paths");
  const packageConfig = requireWorkspace(ctx, "packageConfig");

  const inventory = loadYamlFile(paths.inventory);

  const invVal = validateInventory(inventory, {
    requireSlice:
      packageConfig?.mode === "slice" &&
      inventory.inventory_scope !== "full-chapter",
  });

  ctx.workspace.inventory = inventory;
  ctx.workspace.inventoryValidation = invVal;

  if (invVal.ok) {
    return { ok: true, errors: [], data: invVal };
  }
  return {
    ok: false,
    errors: invVal.errors || ["inventory validation failed"],
    data: invVal,
  };
}
