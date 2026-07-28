import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createContext } from "../src/pipeline/context.js";
import {
  PipelineConfigurationError,
  validatePipelineConfig,
} from "../src/pipeline/validate-config.js";
import { runPipeline } from "../src/pipeline/runner.js";
import type { Stage, StageId } from "../src/pipeline/stage.js";

function mockStage(
  id: StageId,
  options: {
    dependsOn?: StageId[];
    parallelWith?: StageId[];
    blocking?: boolean;
  } = {},
): Stage {
  return {
    id,
    label: id,
    dependsOn: options.dependsOn ?? [],
    parallelWith: options.parallelWith,
    blocking: options.blocking,
    run: () => ({ ok: true, errors: [] }),
  };
}

function assertConfigError(fn: () => void, pattern: RegExp): void {
  assert.throws(fn, (err: unknown) => {
    assert.ok(err instanceof PipelineConfigurationError);
    assert.match((err as Error).message, pattern);
    return true;
  });
}

describe("validatePipelineConfig — dependency cycles", () => {
  it("rejects a three-stage cycle", () => {
    const pipeline: Stage[] = [
      mockStage("package-input", { dependsOn: ["publication"] }),
      mockStage("inventory", { dependsOn: ["package-input"] }),
      mockStage("publication", { dependsOn: ["inventory"] }),
    ];

    assertConfigError(
      () => validatePipelineConfig(pipeline),
      /Dependency cycle detected: .* → .* → .* →/,
    );
  });

  it("rejects a direct two-stage cycle", () => {
    const pipeline: Stage[] = [
      mockStage("projections", { dependsOn: ["visuals"] }),
      mockStage("visuals", { dependsOn: ["projections"] }),
    ];

    assertConfigError(
      () => validatePipelineConfig(pipeline),
      /Dependency cycle detected: projections → visuals → projections/,
    );
  });

  it("rejects cycles when runPipeline is invoked", async () => {
    const pipeline: Stage[] = [
      mockStage("projections", { dependsOn: ["visuals"] }),
      mockStage("visuals", { dependsOn: ["projections"] }),
    ];
    const ctx = createContext("/tmp/chapter", "validate");

    await assert.rejects(
      () => runPipeline(pipeline, ctx),
      PipelineConfigurationError,
    );
  });
});

describe("validatePipelineConfig — unknown dependencies", () => {
  it("rejects a dependency that does not exist in the pipeline", () => {
    const pipeline: Stage[] = [
      mockStage("inventory", { dependsOn: ["UNKNOWN_STAGE" as StageId] }),
    ];

    assertConfigError(
      () => validatePipelineConfig(pipeline),
      /Stage "inventory" depends on unknown stage "UNKNOWN_STAGE"/,
    );
  });

  it("identifies both the offending stage and the missing dependency", () => {
    const pipeline: Stage[] = [
      mockStage("grounding", { dependsOn: ["MISSING" as StageId] }),
    ];

    assertConfigError(
      () => validatePipelineConfig(pipeline),
      /Stage "grounding" depends on unknown stage "MISSING"/,
    );
  });
});

describe("validatePipelineConfig — parallelWith", () => {
  it("rejects non-reciprocated parallelWith declarations", () => {
    const pipeline: Stage[] = [
      mockStage("blueprint"),
      mockStage("projections", {
        dependsOn: ["blueprint"],
        parallelWith: ["visuals"],
      }),
      mockStage("visuals", { dependsOn: ["blueprint"] }),
    ];

    assertConfigError(
      () => validatePipelineConfig(pipeline),
      /Stage "projections" parallelWith "visuals" is not reciprocated by "visuals"/,
    );
  });

  it("rejects transitive parallelWith chains that are not equivalence classes", () => {
    const pipeline: Stage[] = [
      mockStage("blueprint"),
      mockStage("projections", {
        dependsOn: ["blueprint"],
        parallelWith: ["visuals"],
      }),
      mockStage("visuals", {
        dependsOn: ["blueprint"],
        parallelWith: ["projections", "grounding"],
      }),
      mockStage("grounding", {
        dependsOn: ["blueprint"],
        parallelWith: ["visuals"],
      }),
    ];

    assertConfigError(
      () => validatePipelineConfig(pipeline),
      /Stage "projections" parallelWith must include "grounding" \(transitive partner via "visuals"\)/,
    );
  });

  it("rejects parallelWith references to unknown stages", () => {
    const pipeline: Stage[] = [
      mockStage("projections", { parallelWith: ["UNKNOWN" as StageId] }),
    ];

    assertConfigError(
      () => validatePipelineConfig(pipeline),
      /Stage "projections" parallelWith references unknown stage "UNKNOWN"/,
    );
  });

  it("accepts a valid mutual parallel pair (doc 19 F ∥ G)", () => {
    const pipeline: Stage[] = [
      mockStage("blueprint"),
      mockStage("projections", {
        dependsOn: ["blueprint"],
        parallelWith: ["visuals"],
      }),
      mockStage("visuals", {
        dependsOn: ["blueprint"],
        parallelWith: ["projections"],
      }),
    ];

    assert.doesNotThrow(() => validatePipelineConfig(pipeline));
  });
});

describe("validatePipelineConfig — production pipelines", () => {
  it("accepts CHAPTER_PIPELINE and BUILD_PIPELINE configurations", async () => {
    const { BUILD_PIPELINE, CHAPTER_PIPELINE, FULL_PIPELINE } = await import(
      "../src/pipeline/pipeline.js"
    );

    assert.doesNotThrow(() => validatePipelineConfig(FULL_PIPELINE));
    assert.doesNotThrow(() => validatePipelineConfig(CHAPTER_PIPELINE));
    assert.doesNotThrow(() => validatePipelineConfig(BUILD_PIPELINE));
  });
});

describe("validatePipelineConfig — duplicate stage ids", () => {
  it("rejects duplicate stage ids", () => {
    const pipeline: Stage[] = [mockStage("inventory"), mockStage("inventory")];

    assertConfigError(
      () => validatePipelineConfig(pipeline),
      /Duplicate stage id "inventory"/,
    );
  });
});
