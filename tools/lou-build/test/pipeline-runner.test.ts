import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createContext } from "../src/pipeline/context.js";
import { pickParallelBatch, runPipeline } from "../src/pipeline/runner.js";
import { PipelineConfigurationError, validatePipelineConfig } from "../src/pipeline/validate-config.js";
import type { Stage, StageId, StageResult } from "../src/pipeline/stage.js";

function ok(data?: unknown): StageResult {
  return { ok: true, errors: [], data };
}

function fail(errors: string[]): StageResult {
  return { ok: false, errors };
}

function mockStage(
  id: StageId,
  options: {
    dependsOn?: StageId[];
    parallelWith?: StageId[];
    blocking?: boolean;
    run?: (ctx: ReturnType<typeof createContext>) => Promise<StageResult> | StageResult;
  } = {},
): Stage {
  return {
    id,
    label: id,
    dependsOn: options.dependsOn ?? [],
    parallelWith: options.parallelWith,
    blocking: options.blocking,
    run: options.run ?? (() => ok()),
  };
}

/** Minimal doc-19-shaped graph for engine tests (B→C→D→E; E→F∥G; F→H). */
function doc19EnginePipeline(
  handlers: Partial<
    Record<
      StageId,
      (ctx: ReturnType<typeof createContext>) => Promise<StageResult> | StageResult
    >
  >,
): Stage[] {
  return [
    mockStage("package-input", { run: handlers["package-input"] }),
    mockStage("inventory", {
      dependsOn: ["package-input"],
      run: handlers.inventory,
    }),
    mockStage("reconciliation", {
      dependsOn: ["inventory"],
      run: handlers.reconciliation,
    }),
    mockStage("blueprint", {
      dependsOn: ["inventory", "reconciliation"],
      run: handlers.blueprint,
    }),
    mockStage("projections", {
      dependsOn: ["blueprint"],
      parallelWith: ["visuals"],
      run: handlers.projections,
    }),
    mockStage("visuals", {
      dependsOn: ["blueprint"],
      parallelWith: ["projections"],
      blocking: false,
      run: handlers.visuals,
    }),
    mockStage("grounding", {
      dependsOn: ["projections"],
      run: handlers.grounding,
    }),
    mockStage("validation", {
      dependsOn: ["reconciliation", "blueprint", "projections", "visuals", "grounding"],
      run: handlers.validation,
    }),
  ];
}

describe("pickParallelBatch", () => {
  it("returns a single stage when no parallelism is declared", () => {
    const ready = [
      mockStage("inventory"),
      mockStage("reconciliation", { dependsOn: ["inventory"] }),
    ];
    assert.deepEqual(
      pickParallelBatch(ready).map((s) => s.id),
      ["inventory"],
    );
  });

  it("groups mutually parallel stages regardless of queue order", () => {
    const ready = [
      mockStage("visuals", { parallelWith: ["projections"] }),
      mockStage("projections", { parallelWith: ["visuals"] }),
    ];
    assert.deepEqual(
      pickParallelBatch(ready).map((s) => s.id),
      ["visuals", "projections"],
    );
  });
});

describe("runPipeline — execution order", () => {
  it("runs a linear pipeline in dependency order", async () => {
    const order: StageId[] = [];
    const pipeline: Stage[] = [
      mockStage("package-input", {
        run: () => {
          order.push("package-input");
          return ok();
        },
      }),
      mockStage("inventory", {
        dependsOn: ["package-input"],
        run: () => {
          order.push("inventory");
          return ok();
        },
      }),
      mockStage("reconciliation", {
        dependsOn: ["inventory"],
        run: () => {
          order.push("reconciliation");
          return ok();
        },
      }),
    ];

    const ctx = createContext("/tmp/chapter", "validate");
    const report = await runPipeline(pipeline, ctx);

    assert.equal(report.ok, true);
    assert.deepEqual(order, ["package-input", "inventory", "reconciliation"]);
    assert.deepEqual(report.ran, order);
    assert.deepEqual(report.batches, [["package-input"], ["inventory"], ["reconciliation"]]);
  });
});

describe("runPipeline — dependency resolution", () => {
  it("does not run a stage until all active dependencies pass", async () => {
    const started = new Set<StageId>();
    const pipeline = doc19EnginePipeline({
      inventory: () => {
        started.add("inventory");
        return ok();
      },
      reconciliation: () => {
        started.add("reconciliation");
        return ok();
      },
      blueprint: () => {
        started.add("blueprint");
        assert.ok(started.has("inventory"));
        assert.ok(started.has("reconciliation"));
        return ok();
      },
    });

    const ctx = createContext("/tmp/chapter", "validate");
    const report = await runPipeline(pipeline, ctx);

    assert.equal(report.ok, true);
    assert.ok(
      report.ran.indexOf("inventory") < report.ran.indexOf("blueprint"),
    );
    assert.ok(
      report.ran.indexOf("reconciliation") < report.ran.indexOf("blueprint"),
    );
  });

  it("rejects dependencies on stages absent from the pipeline configuration", () => {
    const pipeline: Stage[] = [
      mockStage("inventory", {
        dependsOn: ["acquisition"],
        run: () => ok(),
      }),
    ];

    assert.throws(
      () => validatePipelineConfig(pipeline),
      (err: unknown) => {
        assert.ok(err instanceof PipelineConfigurationError);
        assert.match(
          (err as Error).message,
          /Stage "inventory" depends on unknown stage "acquisition"/,
        );
        return true;
      },
    );
  });
});

describe("runPipeline — fail-fast", () => {
  it("stops immediately on a blocking failure and skips downstream stages", async () => {
    const ran = new Set<StageId>();
    const pipeline = doc19EnginePipeline({
      inventory: () => {
        ran.add("inventory");
        return fail(["inventory invalid"]);
      },
      reconciliation: () => {
        ran.add("reconciliation");
        return ok();
      },
      blueprint: () => {
        ran.add("blueprint");
        return ok();
      },
    });

    const ctx = createContext("/tmp/chapter", "validate");
    const report = await runPipeline(pipeline, ctx);

    assert.equal(report.ok, false);
    assert.deepEqual(report.ran, ["package-input", "inventory"]);
    assert.ok(report.skipped.includes("reconciliation"));
    assert.ok(report.skipped.includes("blueprint"));
    assert.equal(ran.has("reconciliation"), false);
    assert.equal(ran.has("blueprint"), false);

    const recon = report.results.get("reconciliation");
    assert.match(recon?.errors[0] ?? "", /blocked by upstream failure/);
    assert.deepEqual(report.skipped, [
      "reconciliation",
      "blueprint",
      "projections",
      "visuals",
      "grounding",
      "validation",
    ]);
  });

  it("continues past a non-blocking failure", async () => {
    const ran = new Set<StageId>();
    const pipeline = doc19EnginePipeline({
      visuals: () => {
        ran.add("visuals");
        return fail(["visual withheld"]);
      },
      grounding: () => {
        ran.add("grounding");
        return ok();
      },
      validation: () => {
        ran.add("validation");
        return ok();
      },
    });

    const ctx = createContext("/tmp/chapter", "validate");
    const report = await runPipeline(pipeline, ctx);

    assert.equal(ran.has("grounding"), true);
    assert.equal(ran.has("validation"), true);
    assert.equal(report.results.get("visuals")?.ok, false);
    assert.equal(report.ok, true);
  });
});

describe("runPipeline — parallel execution", () => {
  it("runs F and G concurrently only after blueprint completes", async () => {
    let blueprintDone = false;
    let fStarted = false;
    let gStartedDuringF = false;

    let releaseF!: () => void;
    const fGate = new Promise<void>((resolve) => {
      releaseF = resolve;
    });

    const ctx = createContext("/tmp/chapter", "validate");

    const pipeline = doc19EnginePipeline({
      blueprint: () => {
        blueprintDone = true;
        return ok();
      },
      projections: async () => {
        assert.equal(blueprintDone, true, "F must not start before E");
        fStarted = true;
        await fGate;
        return ok();
      },
      visuals: () => {
        assert.equal(blueprintDone, true, "G must not start before E");
        gStartedDuringF = fStarted && !ctx.results.has("projections");
        return ok();
      },
    });

    const reportPromise = runPipeline(pipeline, ctx);

    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(fStarted, true);
    assert.equal(gStartedDuringF, true, "G should start while F is still in flight");

    releaseF();
    const report = await reportPromise;

    assert.equal(report.ok, true);
    const fgBatch = report.batches.find(
      (batch) => batch.includes("projections") && batch.includes("visuals"),
    );
    assert.ok(fgBatch, "F and G should share one batch");
    assert.ok(report.ran.indexOf("grounding") > report.ran.indexOf("projections"));
    assert.ok(report.ran.indexOf("grounding") > report.ran.indexOf("visuals"));
  });
});

describe("runPipeline — BuildContext diagnostics", () => {
  it("propagates diagnostics through workspace and results", async () => {
    const pipeline: Stage[] = [
      mockStage("package-input", {
        run: (ctx) => {
          ctx.workspace.source = "fil-b";
          return ok({ edition: "2022" });
        },
      }),
      mockStage("inventory", {
        dependsOn: ["package-input"],
        run: (ctx) => {
          assert.equal(ctx.workspace.source, "fil-b");
          const upstream = ctx.results.get("package-input");
          assert.deepEqual(upstream?.data, { edition: "2022" });
          ctx.workspace.kpCount = 42;
          return ok({ ids: ["KP-1"] });
        },
      }),
      mockStage("reconciliation", {
        dependsOn: ["inventory"],
        run: (ctx) => {
          assert.equal(ctx.workspace.kpCount, 42);
          return ok();
        },
      }),
    ];

    const ctx = createContext("/tmp/chapter", "validate");
    const report = await runPipeline(pipeline, ctx);

    assert.equal(report.ok, true);
    assert.equal(ctx.workspace.source, "fil-b");
    assert.equal(ctx.workspace.kpCount, 42);
    const invData = report.results.get("inventory")?.data as
      | { ids: string[] }
      | undefined;
    assert.equal(invData?.ids[0], "KP-1");
  });
});

describe("runPipeline — slice options", () => {
  it("honours from/to boundaries without changing relative order", async () => {
    const order: StageId[] = [];
    const pipeline = doc19EnginePipeline({
      reconciliation: () => {
        order.push("reconciliation");
        return ok();
      },
      blueprint: () => {
        order.push("blueprint");
        return ok();
      },
      projections: () => {
        order.push("projections");
        return ok();
      },
    });

    const ctx = createContext("/tmp/chapter", "validate");
    const report = await runPipeline(pipeline, ctx, {
      from: "reconciliation",
      to: "projections",
    });

    assert.deepEqual(order, ["reconciliation", "blueprint", "projections"]);
    assert.deepEqual(report.ran, order);
  });
});
