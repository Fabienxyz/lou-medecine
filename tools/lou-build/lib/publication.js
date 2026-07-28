/**
 * Stage K — Publication (legacy reference implementation).
 *
 * Migrated implementation lives in src/stages/publication.ts.
 */

import fs from "node:fs";

function requireWorkspace(ctx, key) {
  const value = ctx.workspace[key];
  if (value === undefined) {
    throw new Error(`Pipeline workspace missing required key: ${key}`);
  }
  return value;
}

/**
 * @param {{ chapterDir: string, command: string, mutate: boolean, workspace: Record<string, unknown>, results: Map<string, { ok: boolean, errors: string[] }> }} ctx
 * @returns {{ ok: boolean, errors: string[], data?: unknown }}
 */
export function runPublication(ctx) {
  const paths = requireWorkspace(ctx, "paths");
  const packaging = ctx.results.get("packaging");

  if (!ctx.mutate) {
    const validation = ctx.results.get("validation");
    if (validation?.ok) {
      return {
        ok: true,
        errors: [],
        data: { state: "ready", note: "validate mode — publication not emitted" },
      };
    }
    return { ok: false, errors: ["validation failed — publication withheld"] };
  }

  if (!packaging?.ok) {
    if (fs.existsSync(paths.manifest)) {
      fs.unlinkSync(paths.manifest);
    }
    return { ok: false, errors: ["publication withheld — packaging failed"] };
  }

  if (!fs.existsSync(paths.manifest)) {
    return {
      ok: false,
      errors: ["publication withheld — manifest missing after packaging"],
    };
  }

  return {
    ok: true,
    errors: [],
    data: { state: "published", manifestPath: paths.manifest },
  };
}
