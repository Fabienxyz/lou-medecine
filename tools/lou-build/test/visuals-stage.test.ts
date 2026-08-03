import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runVisuals } from "../src/stages/visuals.ts";
import { chapterPaths } from "../lib/paths.js";
import { parseBlueprint, validateBlueprint } from "../lib/blueprint.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("Stage G renders visual-spec when present and keeps external figures", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-visuals-stage-"));
  const paths = chapterPaths(dir);
  fs.mkdirSync(paths.figuresDir, { recursive: true });
  fs.mkdirSync(path.join(paths.buildDir, "visual-specs"), { recursive: true });

  const inventory = {
    chapter: "cardio/test",
    kps: [
      {
        id: "KP-001",
        label: "Fact",
        disposition: "understanding",
        anchors: [{ quote: "fact one", section_path: "I" }],
      },
    ],
  };
  fs.writeFileSync(
    paths.inventory,
    "chapter: cardio/test\nkps:\n  - id: KP-001\n    label: Fact\n    disposition: understanding\n    anchors:\n      - quote: fact one\n        section_path: I\n",
  );
  fs.writeFileSync(
    paths.sourceMeta,
    "edition: 2022\nsource_file: source/official-college.md\n",
  );
  fs.mkdirSync(path.join(dir, "source"), { recursive: true });
  fs.writeFileSync(path.join(dir, "source", "official-college.md"), "# Test\n");
  fs.writeFileSync(
    path.join(dir, "chapter.package.yaml"),
    "mode: slice\nrequired_visual_elements: []\n",
  );
  fs.writeFileSync(
    paths.blueprint,
    `---
chapter: cardio/test
sequence: [MM-sample, MEC-v1]
mental_model:
  id: MM-sample
  question: "Mental model question?"
  visual_intent: process-flow
  steps: [a, b]
  uses_kp: [KP-001]
mechanisms:
  - id: MEC-v1
    question: "Mechanism question?"
    visual_intent: process-flow
    steps: [step one, step two]
    uses_kp: [KP-001]
visual_plan: []
---
`,
  );

  const specYaml = `spec_version: 0.1
primitive: causal-graph
chapter: cardio/test
element: MM-sample
question: "Mental model question?"

nodes:
  - id: state-a
    kind: state
    label: "State A"
    class: sourced
    kp: [KP-001]
  - id: state-b
    kind: state
    label: "State B"
    class: sourced
    kp: [KP-001]

edges:
  - from: state-a
    to: state-b
    relation: causes
    class: sourced
    kp: [KP-001]
`;
  fs.writeFileSync(
    path.join(paths.buildDir, "visual-specs/mm-sample.yaml"),
    specYaml,
  );

  const externalPath = path.join(paths.figuresDir, "external-asset.svg");
  fs.writeFileSync(
    externalPath,
    '<svg xmlns="http://www.w3.org/2000/svg" role="img"><title>t</title><desc>d</desc></svg>',
  );

  const blueprint = parseBlueprint(
    paths.blueprint,
    fs.readFileSync(paths.blueprint, "utf8"),
  );
  const blueprintValidation = validateBlueprint(
    blueprint,
    new Set(["KP-001"]),
  );

  const ctx = {
    mutate: true,
    workspace: {
      paths,
      inventory,
      sourceMeta: { edition: 2022, _path: paths.sourceMeta },
      packageConfig: { required_visual_elements: [] },
      blueprint,
      blueprintValidation,
    },
  };

  const result = runVisuals(ctx);
  assert.equal(result.ok, true);
  const visualBuild = ctx.workspace.visualBuild;
  assert.equal(visualBuild.rendered.length, 2);
  assert.ok(fs.existsSync(path.join(paths.figuresDir, "mm-sample.svg")));
  assert.ok(fs.existsSync(path.join(paths.figuresDir, "mec-v1.svg")));
  assert.ok(fs.existsSync(externalPath));

  const mmSvg = fs.readFileSync(
    path.join(paths.figuresDir, "mm-sample.svg"),
    "utf8",
  );
  assert.match(mmSvg, /data-blueprint-element="MM-sample"/);
  assert.match(mmSvg, /data-primitive="causal-graph"/);
});
