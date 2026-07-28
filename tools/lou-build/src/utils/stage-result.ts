import type { BuildContext } from "../pipeline/context.js";
import type { StageResult } from "../pipeline/stage.js";

export function ok(data?: unknown): StageResult {
  return { ok: true, errors: [], data };
}

export function fail(errors: string[], data?: unknown): StageResult {
  return { ok: false, errors, data };
}

export function workspace<T>(ctx: BuildContext, key: string): T | undefined {
  return ctx.workspace[key] as T | undefined;
}

export function setWorkspace(ctx: BuildContext, key: string, value: unknown): void {
  ctx.workspace[key] = value;
}

export function requireWorkspace<T>(ctx: BuildContext, key: string): T {
  const value = workspace<T>(ctx, key);
  if (value === undefined) {
    throw new Error(`Pipeline workspace missing required key: ${key}`);
  }
  return value;
}
