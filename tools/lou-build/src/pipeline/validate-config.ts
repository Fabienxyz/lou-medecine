import type { Stage, StageId } from "./stage.js";

export class PipelineConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PipelineConfigurationError";
  }
}

/**
 * Validate a pipeline configuration before execution.
 * Pipeline Engine v1 — frozen after Phase 3.1.
 */
export function validatePipelineConfig(stages: Stage[]): void {
  const index = new Map<StageId, Stage>();
  for (const stage of stages) {
    if (index.has(stage.id)) {
      throw new PipelineConfigurationError(
        `Duplicate stage id "${stage.id}" in pipeline configuration`,
      );
    }
    index.set(stage.id, stage);
  }

  validateUnknownDependencies(stages, index);
  validateParallelWith(stages, index);
  validateDependencyCycles(stages, index);
}

function validateUnknownDependencies(
  stages: Stage[],
  index: Map<StageId, Stage>,
): void {
  for (const stage of stages) {
    for (const dep of stage.dependsOn) {
      if (!index.has(dep)) {
        throw new PipelineConfigurationError(
          `Stage "${stage.id}" depends on unknown stage "${dep}"`,
        );
      }
    }
  }
}

function validateParallelWith(
  stages: Stage[],
  index: Map<StageId, Stage>,
): void {
  for (const stage of stages) {
    for (const partnerId of stage.parallelWith ?? []) {
      if (partnerId === stage.id) {
        throw new PipelineConfigurationError(
          `Stage "${stage.id}" must not declare parallelWith itself`,
        );
      }

      const partner = index.get(partnerId);
      if (!partner) {
        throw new PipelineConfigurationError(
          `Stage "${stage.id}" parallelWith references unknown stage "${partnerId}"`,
        );
      }

      if (!partner.parallelWith?.includes(stage.id)) {
        throw new PipelineConfigurationError(
          `Stage "${stage.id}" parallelWith "${partnerId}" is not reciprocated by "${partnerId}"`,
        );
      }
    }
  }

  // Parallel groups must be equivalence classes (symmetric + transitive).
  for (const stage of stages) {
    const group = new Set(stage.parallelWith ?? []);
    for (const partnerId of group) {
      const partner = index.get(partnerId)!;
      for (const transitiveId of partner.parallelWith ?? []) {
        if (transitiveId === stage.id) continue;
        if (!group.has(transitiveId)) {
          throw new PipelineConfigurationError(
            `Stage "${stage.id}" parallelWith must include "${transitiveId}" (transitive partner via "${partnerId}")`,
          );
        }
      }
    }
  }
}

function validateDependencyCycles(
  stages: Stage[],
  index: Map<StageId, Stage>,
): void {
  const visiting = new Set<StageId>();
  const visited = new Set<StageId>();
  const path: StageId[] = [];

  function dfs(id: StageId): StageId[] | null {
    if (visiting.has(id)) {
      const start = path.indexOf(id);
      return [...path.slice(start), id];
    }
    if (visited.has(id)) return null;

    visiting.add(id);
    path.push(id);

    const stage = index.get(id);
    for (const dep of stage?.dependsOn ?? []) {
      if (!index.has(dep)) continue;
      const cycle = dfs(dep);
      if (cycle) return cycle;
    }

    path.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  }

  for (const stage of stages) {
    const cycle = dfs(stage.id);
    if (cycle) {
      throw new PipelineConfigurationError(
        `Dependency cycle detected: ${cycle.join(" → ")}`,
      );
    }
  }
}
