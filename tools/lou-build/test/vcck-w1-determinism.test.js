import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_POSITIVE } from "../lib/vcck/paths.js";
import { renderVcckSpec, checkDeterminism, determinismHash } from "../lib/vcck/render-bridge.js";
import { W1_FAMILIES } from "../lib/vcck/w1-constants.js";

describe("vcck-w1-determinism", () => {
  for (const family of W1_FAMILIES) {
    it(`${family} short is byte-identical across two passes`, () => {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${family}-short.yaml`));
      const d = checkDeterminism(spec);
      assert.equal(d.ok, true, d.errors.join("; "));
      assert.equal(d.hashA, d.hashB);
    });

    it(`${family} short hash stable after input permutation`, () => {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${family}-short.yaml`));
      const base = renderVcckSpec(spec);
      assert.equal(base.ok, true);
      const hashBase = determinismHash(base.artifact);

      const perm = structuredClone(spec);
      if (family === "chain" || family === "dependent-sequence") {
        perm.nodes = [...spec.nodes].reverse();
        if (family === "dependent-sequence" && perm.branches?.length) {
          perm.branches = [...perm.branches].reverse();
        }
      } else if (family === "flat-concurrent") {
        perm.groups[0].items = [...perm.groups[0].items].reverse();
      } else if (family === "two-pole") {
        perm.poles = [...spec.poles].reverse();
      }
      const permRender = renderVcckSpec(perm);
      assert.equal(permRender.ok, true, permRender.errors?.join("; "));
      assert.equal(determinismHash(permRender.artifact), hashBase);
    });
  }
});
