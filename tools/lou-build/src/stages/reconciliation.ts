import { reconcile, normalizeScope } from "../../lib/reconcile.js";
import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { fail, ok, requireWorkspace, setWorkspace } from "../utils/stage-result.js";

/**
 * Stage D — Réconciliation de couverture — doc 19 §2, contrat 01 §5.
 *
 * Migrated from lib/reconciliation.js — behavior must remain identical.
 */
export function runReconciliation(ctx: BuildContext): StageResult {
  const paths = requireWorkspace<{ reconciliation: string }>(ctx, "paths");
  const packageConfig = requireWorkspace<{
    reconciliation?: {
      scope_expected?: unknown;
      slice_scope_expected?: unknown;
    };
  }>(ctx, "packageConfig");
  const invVal = requireWorkspace<{ ids?: string[] }>(
    ctx,
    "inventoryValidation",
  );

  const scopeExpected =
    packageConfig?.reconciliation?.scope_expected ||
    packageConfig?.reconciliation?.slice_scope_expected ||
    null;

  const recon = reconcile({
    reconciliationPath: paths.reconciliation,
    scopeExpected: scopeExpected ? normalizeScope(scopeExpected) : null,
    inventoryKpIds: new Set(invVal.ids || []),
  } as Parameters<typeof reconcile>[0]);

  setWorkspace(ctx, "reconciliation", recon);

  return recon.ok
    ? ok(recon)
    : fail(recon.errors || ["reconciliation failed"], recon);
}

/** Stage D — Réconciliation de couverture (généré, gate bloquante). */
export const reconciliationStage: Stage = {
  id: "reconciliation",
  label: "Coverage reconciliation",
  dependsOn: ["inventory"],
  run(ctx) {
    return runReconciliation(ctx);
  },
};
