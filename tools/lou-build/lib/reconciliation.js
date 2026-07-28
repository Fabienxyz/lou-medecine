/**
 * Stage D — Reconciliation (legacy reference implementation).
 *
 * Migrated implementation lives in src/stages/reconciliation.ts.
 * Reconciliation logic remains in lib/reconcile.js.
 */

import { reconcile, normalizeScope } from "./reconcile.js";

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
export function runReconciliation(ctx) {
  const paths = requireWorkspace(ctx, "paths");
  const packageConfig = requireWorkspace(ctx, "packageConfig");
  const invVal = requireWorkspace(ctx, "inventoryValidation");

  const scopeExpected =
    packageConfig?.reconciliation?.scope_expected ||
    packageConfig?.reconciliation?.slice_scope_expected ||
    null;

  const recon = reconcile({
    reconciliationPath: paths.reconciliation,
    scopeExpected: scopeExpected ? normalizeScope(scopeExpected) : null,
    inventoryKpIds: new Set(invVal.ids || []),
  });

  ctx.workspace.reconciliation = recon;

  if (recon.ok) {
    return { ok: true, errors: [], data: recon };
  }
  return {
    ok: false,
    errors: recon.errors || ["reconciliation failed"],
    data: recon,
  };
}
