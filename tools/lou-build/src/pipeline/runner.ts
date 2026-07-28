import type { BuildContext } from "./context.js";
import type { Stage, StageId, StageResult } from "./stage.js";
import { STAGE_LETTER } from "./stage.js";
import { validatePipelineConfig } from "./validate-config.js";

export interface RunOptions {
  /** Only run stages from this id onward (inclusive). */
  from?: StageId;
  /** Stop after this stage (inclusive). */
  to?: StageId;
}

export interface RunReport {
  ok: boolean;
  /** Stage ids executed, in invocation order (parallel batches preserve queue order). */
  ran: StageId[];
  /** Stage ids not executed because a dependency failed or the pipeline was blocked. */
  skipped: StageId[];
  /** Execution batches — each inner array ran concurrently. */
  batches: StageId[][];
  results: Map<StageId, StageResult>;
}

function indexOfStage(stages: Stage[], id: StageId): number {
  const idx = stages.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error(`Unknown stage: ${id}`);
  return idx;
}

function sliceStages(stages: Stage[], options: RunOptions = {}): Stage[] {
  let start = 0;
  let end = stages.length;

  if (options.from) start = indexOfStage(stages, options.from);
  if (options.to) end = indexOfStage(stages, options.to) + 1;

  return stages.slice(start, end);
}

function depsSatisfied(
  stage: Stage,
  ctx: BuildContext,
  activeIds: Set<StageId>,
  stageIndex: Map<StageId, Stage>,
): boolean {
  return stage.dependsOn.every((dep) => {
    if (!activeIds.has(dep)) return true;
    const result = ctx.results.get(dep);
    if (result === undefined) return false;
    if (result.ok) return true;
    const depStage = stageIndex.get(dep);
    // Doc 19 §3.4 / contrat 04 §11: a non-blocking stage may fail without
    // withholding downstream stages that depend on it having run.
    return depStage !== undefined && !isBlocking(depStage);
  });
}

function depsFailed(
  stage: Stage,
  ctx: BuildContext,
  activeIds: Set<StageId>,
  stageIndex: Map<StageId, Stage>,
): boolean {
  return stage.dependsOn.some((dep) => {
    if (!activeIds.has(dep)) return false;
    const result = ctx.results.get(dep);
    if (result === undefined || result.ok) return false;
    const depStage = stageIndex.get(dep);
    return depStage === undefined || isBlocking(depStage);
  });
}

function isBlocking(stage: Stage): boolean {
  return stage.blocking !== false;
}

function recordSkipped(
  ctx: BuildContext,
  stage: Stage,
  reason: string,
  skipped: StageId[],
): void {
  skipped.push(stage.id);
  ctx.results.set(stage.id, { ok: false, errors: [reason] });
}

function skipRemaining(
  queue: Stage[],
  ctx: BuildContext,
  skipped: StageId[],
  reason: string,
): void {
  for (const stage of queue) {
    if (ctx.results.has(stage.id)) continue;
    recordSkipped(ctx, stage, reason, skipped);
  }
  queue.length = 0;
}

/**
 * Select the largest ready subset whose members declare pairwise parallelism.
 * Order within the batch follows the pipeline configuration order.
 */
export function pickParallelBatch(ready: Stage[]): Stage[] {
  if (ready.length <= 1) return ready;

  const batch: Stage[] = [ready[0]];

  for (const stage of ready.slice(1)) {
    const parallelToBatch = batch.some(
      (member) =>
        member.parallelWith?.includes(stage.id) ||
        stage.parallelWith?.includes(member.id),
    );
    if (parallelToBatch) batch.push(stage);
  }

  return batch.length > 1 ? batch : [ready[0]];
}

/**
 * Execute stages respecting declared dependencies.
 * Parallel batches are limited to stages that mutually declare `parallelWith`.
 *
 * Pipeline Engine v1 — frozen (Phase 3.1). Do not extend.
 */
export async function runPipeline(
  stages: Stage[],
  ctx: BuildContext,
  options: RunOptions = {},
): Promise<RunReport> {
  validatePipelineConfig(stages);

  const stageIndex = new Map(stages.map((s) => [s.id, s]));
  const queue = sliceStages(stages, options);
  const ran: StageId[] = [];
  const skipped: StageId[] = [];
  const batches: StageId[][] = [];
  const activeIds = new Set(queue.map((s) => s.id));

  while (queue.length > 0) {
    const ready = queue.filter(
      (stage) =>
        !ctx.results.has(stage.id) &&
        depsSatisfied(stage, ctx, activeIds, stageIndex),
    );

    if (ready.length === 0) {
      for (const stage of queue) {
        if (ctx.results.has(stage.id)) continue;
        if (depsFailed(stage, ctx, activeIds, stageIndex)) {
          recordSkipped(
            ctx,
            stage,
            `Skipped — upstream dependency failed (${stage.dependsOn.join(", ")})`,
            skipped,
          );
        }
      }
      break;
    }

    const parallelBatch = pickParallelBatch(ready);
    batches.push(parallelBatch.map((s) => s.id));

    const outcomes = await Promise.all(
      parallelBatch.map(async (stage) => {
        const result = await stage.run(ctx);
        ctx.results.set(stage.id, result);
        ran.push(stage.id);
        return { stage, result };
      }),
    );

    let blocked = false;
    for (const { stage, result } of outcomes) {
      const idx = queue.findIndex((s) => s.id === stage.id);
      if (idx !== -1) queue.splice(idx, 1);

      if (!result.ok && isBlocking(stage)) {
        blocked = true;
      }
    }

    if (blocked) {
      skipRemaining(
        queue,
        ctx,
        skipped,
        "Skipped — pipeline blocked by upstream failure",
      );
      break;
    }
  }

  const ok = [...ctx.results.entries()].every(([id, result]) => {
    if (result.ok) return true;
    const stage = stageIndex.get(id);
    return stage !== undefined && !isBlocking(stage);
  });
  return { ok, ran, skipped, batches, results: ctx.results };
}

export function formatRunReport(report: RunReport): string {
  const lines: string[] = [];
  for (const [id, result] of report.results) {
    const letter = STAGE_LETTER[id];
    const status = result.ok ? "PASS" : "FAIL";
    lines.push(`[${letter}] ${id}: ${status}`);
    for (const err of result.errors) lines.push(`  - ${err}`);
  }
  return lines.join("\n");
}
