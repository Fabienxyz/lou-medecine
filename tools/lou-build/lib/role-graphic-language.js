/**
 * Experimental role graphic language — review-only rendering overlay.
 * Activated by LOU_ROLE_GL_VARIANT=a|b|c ; default path is unchanged.
 */

const VARIANTS = Object.freeze({
  a: {
    entry: { fill: "#f5f7fa", stroke: "#2563eb", strokeWidth: 2, dash: null, groupOpacity: null },
    decision: { fill: "#ffffff", stroke: "#2563eb", strokeWidth: 2, dash: null, groupOpacity: null },
    test: { fill: "#f9fafb", stroke: "#6b7280", strokeWidth: 1.5, dash: "5 4", groupOpacity: null },
    dead_end: { fill: "#f3f4f6", stroke: "#9ca3af", strokeWidth: 1.5, dash: "4 3", groupOpacity: null },
    conclusion: { fill: "#f0f6ff", stroke: "#2563eb", strokeWidth: 2, dash: null, groupOpacity: null },
    action: { fill: "#ffffff", stroke: "#374151", strokeWidth: 2, dash: null, groupOpacity: null },
  },
  b: {
    entry: { fill: "#eef4ff", stroke: "#2563eb", strokeWidth: 2, dash: null, groupOpacity: null },
    decision: { fill: "#ffffff", stroke: "#2563eb", strokeWidth: 2.5, dash: null, groupOpacity: null },
    test: { fill: "#fafafa", stroke: "#6b7280", strokeWidth: 1.5, dash: "5 4", groupOpacity: null },
    dead_end: { fill: "#f4f4f5", stroke: "#a1a1aa", strokeWidth: 1.5, dash: "4 3", groupOpacity: 0.92 },
    conclusion: { fill: "#e8f0fe", stroke: "#2563eb", strokeWidth: 2.5, dash: null, groupOpacity: null },
    action: { fill: "#fffbeb", stroke: "#d97706", strokeWidth: 2, dash: null, groupOpacity: null },
  },
  c: {
    entry: { fill: "#e0ebff", stroke: "#1d4ed8", strokeWidth: 2.5, dash: null, groupOpacity: null },
    decision: { fill: "#eff6ff", stroke: "#1e40af", strokeWidth: 3, dash: null, groupOpacity: null },
    test: { fill: "#f3f4f6", stroke: "#4b5563", strokeWidth: 2, dash: "5 4", groupOpacity: null },
    dead_end: { fill: "#e5e7eb", stroke: "#6b7280", strokeWidth: 1.5, dash: "4 3", groupOpacity: 0.88 },
    conclusion: { fill: "#dbeafe", stroke: "#1d4ed8", strokeWidth: 3, dash: null, groupOpacity: null },
    action: { fill: "#fff7ed", stroke: "#ea580c", strokeWidth: 2.5, dash: null, groupOpacity: null },
  },
});

const TWO_POLE_VARIANTS = Object.freeze({
  a: {
    polePrimary: { fill: "#f0f6ff", stroke: "#2563eb", strokeWidth: 2 },
    poleSecondary: { fill: "#f5f7fa", stroke: "#2563eb", strokeWidth: 2 },
    cellPrimary: { fill: "#ffffff", stroke: "#e5e5ea", strokeWidth: 1 },
    cellSecondary: { fill: "#ffffff", stroke: "#e5e5ea", strokeWidth: 1 },
  },
  b: {
    polePrimary: { fill: "#eef4ff", stroke: "#2563eb", strokeWidth: 2.5 },
    poleSecondary: { fill: "#f5f7fa", stroke: "#64748b", strokeWidth: 2 },
    cellPrimary: { fill: "#fafcff", stroke: "#c7dbfb", strokeWidth: 1 },
    cellSecondary: { fill: "#ffffff", stroke: "#e5e7eb", strokeWidth: 1 },
  },
  c: {
    polePrimary: { fill: "#dbeafe", stroke: "#1d4ed8", strokeWidth: 3 },
    poleSecondary: { fill: "#f1f5f9", stroke: "#475569", strokeWidth: 2.5 },
    cellPrimary: { fill: "#f0f6ff", stroke: "#93c5fd", strokeWidth: 1.5 },
    cellSecondary: { fill: "#f8fafc", stroke: "#cbd5e1", strokeWidth: 1.5 },
  },
});

function normalizeKind(kind) {
  if (kind === "dead-end") return "dead_end";
  if (kind === "human-review") return "human_review";
  return kind;
}

export function activeRoleGraphicVariant() {
  const value = String(process.env.LOU_ROLE_GL_VARIANT || "").toLowerCase();
  return Object.hasOwn(VARIANTS, value) ? value : null;
}

export function resolveRoleNodeStyle(kind, baseStyle) {
  const variant = activeRoleGraphicVariant();
  if (!variant) return baseStyle;

  const role = normalizeKind(kind);
  const patch = VARIANTS[variant][role];
  if (!patch) return baseStyle;

  return {
    ...baseStyle,
    fill: patch.fill,
    stroke: patch.stroke,
    strokeWidth: patch.strokeWidth,
    dash: patch.dash,
    groupOpacity: patch.groupOpacity,
  };
}

export function resolveTwoPoleRoleStyle(poleId, role, baseStyle) {
  const variant = activeRoleGraphicVariant();
  if (!variant) return baseStyle;

  const table = TWO_POLE_VARIANTS[variant];
  let patch;
  if (role === "pole-header") {
    patch = poleId?.includes("crt") || poleId?.includes("primary") ? table.polePrimary : table.poleSecondary;
  } else if (role === "comparison-cell") {
    patch = poleId?.includes("crt") || poleId?.includes("primary") ? table.cellPrimary : table.cellSecondary;
  } else {
    return baseStyle;
  }

  return {
    ...baseStyle,
    fill: patch.fill,
    stroke: patch.stroke,
    strokeWidth: patch.strokeWidth,
  };
}

export function roleGraphicVariantLabel() {
  return activeRoleGraphicVariant();
}

export function listReviewCorpusKinds() {
  return ["entry", "decision", "test", "dead-end", "conclusion", "action"];
}
