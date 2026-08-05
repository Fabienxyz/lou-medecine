/**
 * Structured W1 responsive proof — confronts executed inventory to contract.
 */

import { W1_FAMILIES, W1_VIEWPORT_WIDTHS } from "./w1-constants.js";
import { W1_APPROVED_POSITIVES } from "./w1-snapshots.js";
import { W1_STRESS_FIXTURES, W1_STRESS_PROOF_COUNT } from "./w1-stress-surfaces.js";

export const W1_PERCEPTUAL_PROOF_COUNT = W1_APPROVED_POSITIVES.length * W1_VIEWPORT_WIDTHS.length;
export const W1_RESPONSIVE_PROOF_COUNT = W1_PERCEPTUAL_PROOF_COUNT + W1_STRESS_PROOF_COUNT;

const APPROVED_FIXTURES = W1_APPROVED_POSITIVES.map((e) => e.file.replace(".yaml", ""));

function collectPerceptualRows(familyResults) {
  const rows = [];
  for (const familyId of W1_FAMILIES) {
    for (const p of familyResults?.[familyId]?.positive || []) {
      const stem = String(p.fixture || "").replace(/\.yaml$/, "");
      if (!APPROVED_FIXTURES.includes(stem)) continue;
      rows.push({
        familyId,
        fixture: stem,
        category: "perceptual",
        viewports: p.viewports,
        surfaces: p.surfaces,
        determinism: p.determinism,
        widthsExecuted: (p.surfaceMetrics || []).map((m) => Number(m.width)),
        surfaceMetrics: p.surfaceMetrics || [],
        reflowMetrics: p.reflowMetrics || [],
      });
    }
  }
  return rows;
}

function collectStressRows(stressProof) {
  if (!stressProof?.results) return [];
  return stressProof.results.map((r) => ({
    familyId: r.familyId,
    fixture: r.fixture.replace(".yaml", ""),
    category: "stress",
    render: r.render,
    artifact: r.artifact,
    determinism: r.determinism,
    viewports: r.ok ? "PASS" : "FAIL",
    surfaces: r.ok ? "PASS" : "FAIL",
    widthsExecuted: (r.widths || []).map((w) => w.width),
    widthResults: r.widths || [],
  }));
}

/** Build structured responsive proof from pipeline run. */
export function buildW1ResponsiveProof(familyResults, options = {}) {
  const skipPlaywright = options.skipPlaywright === true;
  const stressProof = options.stressProof ?? null;
  const playwrightLaunched = !skipPlaywright && options.playwrightLaunched !== false;

  const perceptualRows = collectPerceptualRows(familyResults);
  const stressRows = collectStressRows(stressProof);

  const errors = [];
  const expectedPerceptualFixtures = APPROVED_FIXTURES.length;
  const expectedStressFixtures = W1_STRESS_FIXTURES.length;

  if (skipPlaywright || !playwrightLaunched) {
    return {
      ok: false,
      executed: false,
      playwrightLaunched: false,
      perceptualRows,
      stressRows,
      inventory: { perceptual: perceptualRows, stress: stressRows },
      expected: {
        perceptualFixtures: expectedPerceptualFixtures,
        perceptualWidthsPerFixture: W1_VIEWPORT_WIDTHS.length,
        perceptualProofCount: W1_PERCEPTUAL_PROOF_COUNT,
        stressFixtures: expectedStressFixtures,
        stressWidthsPerFixture: W1_VIEWPORT_WIDTHS.length,
        stressProofCount: W1_STRESS_PROOF_COUNT,
        totalProofCount: W1_RESPONSIVE_PROOF_COUNT,
      },
      errors: ["playwright not executed"],
    };
  }

  if (perceptualRows.length !== expectedPerceptualFixtures) {
    errors.push(
      `perceptual fixtures ${perceptualRows.length}/${expectedPerceptualFixtures} executed`,
    );
  }

  for (const row of perceptualRows) {
    if (row.viewports !== "PASS" || row.surfaces !== "PASS") {
      errors.push(`${row.fixture}: viewports=${row.viewports} surfaces=${row.surfaces}`);
    }
    const widths = new Set(row.widthsExecuted);
    for (const w of W1_VIEWPORT_WIDTHS) {
      if (!widths.has(w)) errors.push(`${row.fixture}: missing width ${w}px`);
    }
  }

  if (!stressProof?.executed) {
    errors.push("stress surfaces not executed");
  } else if (stressRows.length !== expectedStressFixtures) {
    errors.push(`stress fixtures ${stressRows.length}/${expectedStressFixtures}`);
  } else if (stressProof.totalProofs !== W1_STRESS_PROOF_COUNT) {
    errors.push(`stress proofs ${stressProof.totalProofs}/${W1_STRESS_PROOF_COUNT}`);
  }

  for (const row of stressRows) {
    if (row.surfaces !== "PASS" || row.viewports !== "PASS") {
      errors.push(`stress ${row.fixture}: incomplete surfaces`);
    }
    if ((row.widthsExecuted || []).length !== W1_VIEWPORT_WIDTHS.length) {
      errors.push(`stress ${row.fixture}: missing widths`);
    }
  }

  const perceptualProofCount = perceptualRows.reduce(
    (n, r) => n + (r.widthsExecuted?.length === W1_VIEWPORT_WIDTHS.length ? W1_VIEWPORT_WIDTHS.length : 0),
    0,
  );
  const stressProofCount = stressProof?.totalProofs ?? 0;

  if (perceptualProofCount !== W1_PERCEPTUAL_PROOF_COUNT) {
    errors.push(`perceptual proof count ${perceptualProofCount}/${W1_PERCEPTUAL_PROOF_COUNT}`);
  }

  const ok =
    errors.length === 0 &&
    perceptualProofCount === W1_PERCEPTUAL_PROOF_COUNT &&
    stressProofCount === W1_STRESS_PROOF_COUNT;

  return {
    ok,
    executed: true,
    playwrightLaunched: true,
    perceptualRows,
    stressRows,
    inventory: { perceptual: perceptualRows, stress: stressRows },
    counts: {
      perceptualProofCount,
      stressProofCount,
      totalProofCount: perceptualProofCount + stressProofCount,
    },
    expected: {
      perceptualFixtures: expectedPerceptualFixtures,
      perceptualWidthsPerFixture: W1_VIEWPORT_WIDTHS.length,
      perceptualProofCount: W1_PERCEPTUAL_PROOF_COUNT,
      stressFixtures: expectedStressFixtures,
      stressWidthsPerFixture: W1_VIEWPORT_WIDTHS.length,
      stressProofCount: W1_STRESS_PROOF_COUNT,
      totalProofCount: W1_RESPONSIVE_PROOF_COUNT,
    },
    errors,
  };
}

export function responsiveProofToGate(proof) {
  if (!proof?.executed) {
    return { executed: false, pass: false, status: "BLOCKED" };
  }
  return {
    executed: true,
    pass: proof.ok === true,
    status: proof.ok ? "PASS" : "FAIL",
    proof,
  };
}
