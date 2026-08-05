/**
 * SVG dimension validation — reject non-finite layout and serialized output.
 */

const FORBIDDEN_SERIAL = /(?:NaN|Infinity|undefined)/;

export function isFinitePositive(n) {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

export function isFiniteCoord(n, allowZero = true) {
  if (typeof n !== "number" || !Number.isFinite(n)) return false;
  if (allowZero) return n >= 0;
  return n > 0;
}

function checkNum(value, label, errors, { positive = false, allowZero = true } = {}) {
  if (positive && !isFinitePositive(value)) {
    errors.push(`${label} must be a finite positive number (got ${value})`);
    return;
  }
  if (!isFiniteCoord(value, allowZero)) {
    errors.push(`${label} must be a finite number (got ${value})`);
  }
}

export function validateLayoutDimensions(layout) {
  const errors = [];
  if (!layout) return { ok: false, errors: ["missing layout"] };

  checkNum(layout.width, "layout.width", errors, { positive: true });
  checkNum(layout.height, "layout.height", errors, { positive: true });

  for (const node of layout.nodes || []) {
    for (const key of ["x", "y", "width", "height"]) {
      checkNum(node[key], `node ${node.id}.${key}`, errors, {
        positive: key === "width" || key === "height",
        allowZero: key === "x" || key === "y",
      });
    }
  }

  for (const edge of layout.edges || []) {
    if (edge.labelX != null) checkNum(edge.labelX, `edge ${edge.from}->${edge.to}.labelX`, errors);
    if (edge.labelY != null) checkNum(edge.labelY, `edge ${edge.from}->${edge.to}.labelY`, errors);
    for (const box of edge.labelBoxes || []) {
      for (const key of ["x", "y", "width", "height"]) {
        checkNum(box[key], `edge label box ${key}`, errors, {
          positive: key === "width" || key === "height",
        });
      }
    }
    for (const frag of edge.fragments || []) {
      for (const key of ["x", "y", "width", "height"]) {
        checkNum(frag[key], `fragment ${key}`, errors, {
          positive: key === "width" || key === "height",
        });
      }
    }
  }

  for (const ann of layout.annotations || []) {
    if (ann.x != null) checkNum(ann.x, `annotation ${ann.id}.x`, errors);
    if (ann.y != null) checkNum(ann.y, `annotation ${ann.id}.y`, errors);
  }

  for (const ctx of layout.contexts || []) {
    for (const scale of ctx.scales || []) {
      checkNum(scale.x, `scale ${scale.id}.x`, errors);
      checkNum(scale.y, `scale ${scale.id}.y`, errors);
      checkNum(scale.barW, `scale ${scale.id}.barW`, errors, { positive: true });
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateSvgSerialized(svg) {
  const errors = [];
  if (!svg || typeof svg !== "string") {
    return { ok: false, errors: ["missing svg string"] };
  }

  if (FORBIDDEN_SERIAL.test(svg)) {
    errors.push("serialized SVG contains NaN, Infinity, or undefined");
  }

  const viewBox = svg.match(/viewBox="0 0 ([^"]+)"/);
  if (!viewBox) {
    errors.push("missing viewBox");
  } else {
    const parts = viewBox[1].split(/\s+/).map(Number);
    if (parts.length !== 2 || parts.some((n) => !isFinitePositive(n))) {
      errors.push(`invalid viewBox: ${viewBox[1]}`);
    }
  }

  const wh = svg.match(/width="([^"]+)" height="([^"]+)"/);
  if (wh) {
    const w = Number(wh[1]);
    const h = Number(wh[2]);
    if (!isFinitePositive(w) || !isFinitePositive(h)) {
      errors.push(`invalid width/height attributes: ${wh[1]} x ${wh[2]}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateSvgOutput(svg, layout) {
  const dim = validateLayoutDimensions(layout);
  const ser = validateSvgSerialized(svg);
  return {
    ok: dim.ok && ser.ok,
    errors: [...dim.errors, ...ser.errors],
  };
}
