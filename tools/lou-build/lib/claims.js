import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { inventoryById, anchorForKp } from "./inventory.js";
import {
  loadProjectionsManifest,
  resolveProjectionAbsPath,
} from "./chapter-config.js";

const CLAIM_LOCATOR_RE = /\{#([a-zA-Z0-9_-]+)\}/g;
const CLAIM_TRACE_RE = /<!--\s*claim-trace\s*\n([\s\S]*?)\s*-->/;

export function splitLearnerBody(raw) {
  const traceMatch = raw.match(CLAIM_TRACE_RE);
  let body = raw.replace(CLAIM_TRACE_RE, "");
  body = body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  return { body: body.trim(), traceBlock: traceMatch ? traceMatch[1] : null };
}

export function parseClaimTrace(yamlText) {
  const doc = YAML.parse(yamlText);
  if (!doc || !Array.isArray(doc.claims)) {
    throw new Error("claim-trace block must contain claims array");
  }
  return doc.claims;
}

export function extractClaimLocators(markdownBody) {
  const ids = [];
  let m;
  const re = new RegExp(CLAIM_LOCATOR_RE.source, "g");
  while ((m = re.exec(markdownBody)) !== null) {
    if (m[1].startsWith("cb-")) {
      ids.push(m[1]);
    }
  }
  return ids;
}

export function validateProjectionClaims(filePath, raw, inventory) {
  const errors = [];
  const { body, traceBlock } = splitLearnerBody(raw);
  if (!traceBlock) {
    errors.push(`${filePath}: missing claim-trace block`);
    return { ok: false, errors, claims: [], locators: [], body: "" };
  }

  let claims;
  try {
    claims = parseClaimTrace(traceBlock);
  } catch (e) {
    return {
      ok: false,
      errors: [`${filePath}: ${e.message}`],
      claims: [],
      locators: [],
      body,
    };
  }

  const locators = extractClaimLocators(body);
  const claimIds = new Set(claims.map((c) => c.id));
  const locatorSet = new Set(locators);

  for (const loc of locators) {
    if (!claimIds.has(loc)) {
      errors.push(`${filePath}: locator {#${loc}} has no claim-trace entry`);
    }
  }
  for (const claim of claims) {
    if (!locatorSet.has(claim.id)) {
      errors.push(`${filePath}: claim-trace entry ${claim.id} has no locator`);
    }
    if (!claim.class) errors.push(`${filePath}: ${claim.id} missing class`);
    for (const kpId of claim.kp || []) {
      if (!inventoryById(inventory).has(kpId)) {
        errors.push(`${filePath}: ${claim.id} references unknown KP ${kpId}`);
      }
    }
  }

  return { ok: errors.length === 0, errors, claims, locators, body };
}

export function assembleTraceability(allClaims, inventory, sourceMeta) {
  const index = {};
  const kpMap = inventoryById(inventory);
  const edition = sourceMeta.edition;

  for (const claim of allClaims) {
    const entry = {
      class: claim.class,
      kp: claim.kp || [],
    };
    if (claim.element) entry.element = claim.element;

    const anchors = [];
    for (const kpId of claim.kp || []) {
      const kp = kpMap.get(kpId);
      if (!kp) continue;
      const anchor = anchorForKp(kp, edition);
      if (anchor) {
        anchors.push({
          kp: kpId,
          edition: anchor.edition || edition,
          section_path: anchor.section_path,
          quote: anchor.quote,
        });
      }
    }
    if (anchors.length === 1) {
      entry.anchor = {
        edition: anchors[0].edition,
        section_path: anchors[0].section_path,
        quote: anchors[0].quote,
      };
    } else if (anchors.length > 1) {
      entry.anchors = anchors;
    }

    index[claim.id] = entry;
  }

  return index;
}

export function discoverProjectionFiles(chapterDir, projectionsOverride = null) {
  const manifest = projectionsOverride || loadProjectionsManifest(chapterDir);
  if (!manifest.ok) {
    return manifest;
  }
  const files = manifest.projections.map((p) => ({
    id: p.id,
    type: p.type,
    order: p.order,
    path: resolveProjectionAbsPath(chapterDir, p.path),
    relPath: p.path,
    config: p,
  }));
  return { ok: true, errors: [], files, projections: manifest.projections };
}

export function loadAllProjectionClaimsSync(chapterDir, inventory, options = {}) {
  const discovered = discoverProjectionFiles(
    chapterDir,
    options.projectionsOverride
  );
  if (!discovered.ok) {
    return {
      ok: false,
      errors: discovered.errors,
      allClaims: [],
      projectionResults: [],
    };
  }

  const errors = [];
  const allClaims = [];
  const projectionResults = [];

  for (const f of discovered.files) {
    if (!fs.existsSync(f.path)) {
      errors.push(`missing projection: ${f.path}`);
      continue;
    }
    const raw = fs.readFileSync(f.path, "utf8");
    const result = validateProjectionClaims(f.relPath, raw, inventory);
    projectionResults.push({
      id: f.id,
      path: f.path,
      relPath: f.relPath,
      ...result,
    });
    if (!result.ok) errors.push(...result.errors);
    for (const claim of result.claims) {
      allClaims.push({ ...claim, projectionId: f.id, projectionPath: f.relPath });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    allClaims,
    projectionResults,
    projections: discovered.projections,
  };
}

export function indexProjectionBodies(projectionResults) {
  const byClaimId = new Map();
  for (const pr of projectionResults) {
    for (const claim of pr.claims || []) {
      byClaimId.set(claim.id, {
        body: pr.body,
        projectionId: pr.id,
        projectionPath: pr.relPath,
        claim,
      });
    }
  }
  return byClaimId;
}

export function figureRelPathForElement(elementId) {
  return path.join("figures", `${String(elementId).toLowerCase()}.svg`);
}
