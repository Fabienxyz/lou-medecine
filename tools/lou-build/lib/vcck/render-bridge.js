import crypto from "node:crypto";
import { validateVisualSpec, visualSpecClaimUnits } from "../visual-spec.js";
import { renderVisualSpec } from "../visual-render.js";
import { renderVisualSpecSvgV02 } from "../visual-render-svg-v02.js";
import { renderVisualSpecHtml } from "../visual-render-html.js";
import { validateSvgSerialized } from "../svg-dimension-validate.js";
import { validateSvgGeometryIndependent } from "./svg-geom-independent.js";
import { loadVcckInventory, vcckSourceMeta } from "./inventory.js";
import { gateBeforeRender } from "./signature-analyzer.js";
import { isW1Family, renderW1Spec } from "./w1-pipeline.js";

const SVG_PRIMITIVES = new Set(["causal-graph", "decision-algorithm", "threshold-scale"]);
const HTML_PRIMITIVES = new Set(["comparison-matrix", "enumeration-set", "quantity-model"]);

export function artifactKind(spec) {
  if (SVG_PRIMITIVES.has(spec.primitive)) return "svg";
  if (HTML_PRIMITIVES.has(spec.primitive)) return "html";
  return null;
}

export function renderVcckSpec(spec, options = {}) {
  const inventory = options.inventory || loadVcckInventory();
  const fullReview = buildScaffoldingReviewFromUnits(spec);

  const gate = gateBeforeRender(spec);
  if (!gate.allowed) {
    return {
      ok: false,
      stage: "signature",
      errors: [`${gate.code}: structural gate before render`],
      artifact: null,
      layout: null,
      gate,
    };
  }

  if (isW1Family(gate.analysis.family)) {
    return renderW1Spec(spec, gate.analysis, options);
  }

  if (spec.primitive === "causal-graph") {
    const result = renderVisualSpec({
      spec,
      inventory,
      sourceMeta: vcckSourceMeta(),
      review: fullReview,
    });
    if (!result.ok) return { ok: false, stage: result.stage, errors: result.errors, artifact: null, layout: null };
    return {
      ok: true,
      stage: "rendered",
      errors: [],
      artifact: result.svg,
      layout: result.layout,
      kind: "svg",
    };
  }

  if (SVG_PRIMITIVES.has(spec.primitive)) {
    const validation = validateVisualSpec(spec, { inventory });
    if (!validation.ok) {
      return { ok: false, stage: "validation", errors: validation.errors, artifact: null, layout: null };
    }
    const r = renderVisualSpecSvgV02(spec);
    if (!r.ok) return { ok: false, stage: "render", errors: r.errors, artifact: null, layout: null };
    return { ok: true, stage: "rendered", errors: [], artifact: r.svg, layout: r.layout, kind: "svg" };
  }

  if (HTML_PRIMITIVES.has(spec.primitive)) {
    const validation = validateVisualSpec(spec, { inventory });
    if (!validation.ok) {
      return { ok: false, stage: "validation", errors: validation.errors, artifact: null, layout: null };
    }
    const r = renderVisualSpecHtml(spec);
    return { ok: true, stage: "rendered", errors: [], artifact: r.html, layout: null, kind: "html", meta: r };
  }

  return { ok: false, stage: "renderer", errors: [`unsupported primitive ${spec.primitive}`], artifact: null, layout: null };
}

function buildScaffoldingReviewFromUnits(spec) {
  const verdicts = {};
  for (const unit of visualSpecClaimUnits(spec)) {
    verdicts[unit.id] = {
      status: "pass",
      unit_digest: unit.digest,
      rationale: "VCCK fixture unit",
    };
  }
  return { verdicts, meta: { method: "VCCK_FIXTURE" } };
}

export function validateRenderedArtifact(spec, rendered) {
  const errors = [];
  if (!rendered.ok || !rendered.artifact) {
    return { ok: false, errors: rendered.errors || ["render failed"] };
  }

  if (rendered.kind === "svg") {
    const ser = validateSvgSerialized(rendered.artifact);
    if (!ser.ok) errors.push(...ser.errors);

    const geom = validateSvgGeometryIndependent(rendered.artifact);
    if (!geom.ok) errors.push(...geom.errors);
    if (geom.stats?.nodeCount === 0) {
      errors.push("independent geom: zero node elements observed");
    }
  }

  if (rendered.kind === "html") {
    if (!rendered.artifact.includes("vg-question")) {
      errors.push("html: missing vg-question block");
    }
  }

  return { ok: errors.length === 0, errors };
}

export function determinismHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function checkDeterminism(spec, options = {}) {
  const a = renderVcckSpec(spec, options);
  const b = renderVcckSpec(spec, options);
  if (!a.ok || !b.ok) {
    return { ok: false, errors: ["render unstable — one pass failed"], hashA: null, hashB: null };
  }
  const hashA = determinismHash(a.artifact);
  const hashB = determinismHash(b.artifact);
  return {
    ok: hashA === hashB,
    hashA,
    hashB,
    errors: hashA === hashB ? [] : ["byte-identical render mismatch"],
  };
}

export { gateBeforeRender };
