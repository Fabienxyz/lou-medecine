/**
 * Generic semantic-HTML renderers for visualSpec v0.2 primitives.
 * Subject-matter ignorant — no branch on element id, no medical strings.
 */

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function claimAttrs(item) {
  const attrs = [`data-class="${escapeHtml(item.class || "scaffolding")}"`];
  if (item.kp?.length) attrs.push(`data-kp="${escapeHtml(item.kp.join(" "))}"`);
  return attrs.join(" ");
}

function renderQuestionBlock(text, tag) {
  const raw = String(text).trim();
  if (raw.endsWith("?")) {
    return (
      `<${tag} class="vg-question">` +
      `<span class="vg-question-text">${escapeHtml(raw.slice(0, -1).trim())}</span>` +
      `<span class="vg-question-mark">&nbsp;?</span>` +
      `</${tag}>`
    );
  }
  return `<${tag} class="vg-question">${escapeHtml(raw)}</${tag}>`;
}

function renderQuestionCaption(text) {
  return renderQuestionBlock(text, "figcaption");
}

export function renderQuestionHeading(text, level = 2) {
  return renderQuestionBlock(text, `h${level}`);
}

function cellItemSignature(cell) {
  return (cell?.items || []).map((item) => item.label).join("\0");
}

function findMatchingPriorDimension(dimensions, dimIndex, poleId) {
  const current = (dimensions[dimIndex].cells || []).find((c) => c.pole === poleId);
  const sig = cellItemSignature(current);
  if (!sig) return null;
  for (let i = 0; i < dimIndex; i++) {
    const priorCell = (dimensions[i].cells || []).find((c) => c.pole === poleId);
    if (cellItemSignature(priorCell) === sig) return dimensions[i];
  }
  return null;
}

function renderCellItems(cell, tag = "ul") {
  const parts = [`<${tag}>`];
  for (const item of cell?.items || []) {
    parts.push(`<li ${claimAttrs(item)}>${escapeHtml(item.label)}</li>`);
  }
  parts.push(`</${tag}>`);
  return parts.join("\n");
}

function renderInheritedCell(cell, priorDim, dim, pole) {
  const inheritId = `inherit-${escapeHtml(dim.id)}-${escapeHtml(pole.id)}`;
  const parts = [
    `<p class="vg-matrix-inherit" aria-describedby="${inheritId}">`,
    `Comme « ${escapeHtml(priorDim.label)} »`,
    `</p>`,
    `<ul class="vg-sr-only" id="${inheritId}">`,
  ];
  for (const item of cell?.items || []) {
    parts.push(`<li ${claimAttrs(item)}>${escapeHtml(item.label)}</li>`);
  }
  parts.push("</ul>");
  return parts.join("\n");
}

function renderMatrixCellContent(dim, dimIndex, dimensions, pole, cell) {
  if (!cell) return "";
  const prior = findMatchingPriorDimension(dimensions, dimIndex, pole.id);
  if (prior) return renderInheritedCell(cell, prior, dim, pole);
  const tag = cell.ordering === "ordered" ? "ol" : "ul";
  return renderCellItems(cell, tag);
}

function parseRatioIdentity(expression) {
  const parts = String(expression).split("=");
  if (parts.length !== 2) return null;
  const lhs = parts[0].trim();
  const rhs = parts[1].trim();
  const frac = rhs.split("/");
  if (frac.length !== 2) return null;
  return {
    lhs,
    numerator: frac[0].trim(),
    denominator: frac[1].trim(),
    alt: expression,
  };
}

function mathIdentifier(name) {
  return `<mi>${escapeHtml(name)}</mi>`;
}

export function renderIdentityMathml(identity) {
  const parsed = parseRatioIdentity(identity.expression);
  const alt = escapeHtml(identity.expression);

  let mathBody;
  if (parsed && identity.relation_type === "identity-ratio") {
    mathBody =
      "<mrow>" +
      `${mathIdentifier(parsed.lhs)}` +
      "<mo>=</mo>" +
      "<mfrac>" +
      `${mathIdentifier(parsed.numerator)}` +
      `${mathIdentifier(parsed.denominator)}` +
      "</mfrac></mrow>";
  } else {
    mathBody = `<mtext>${alt}</mtext>`;
  }

  const fallbackFrac = parsed
    ? `<span class="vg-frac-fallback" aria-hidden="true">` +
      `${escapeHtml(parsed.lhs)} = ` +
      `<span class="vg-frac"><span class="vg-frac-num">${escapeHtml(parsed.numerator)}</span>` +
      `<span class="vg-frac-bar" aria-hidden="true"></span>` +
      `<span class="vg-frac-den">${escapeHtml(parsed.denominator)}</span></span></span>`
    : `<span class="vg-identity-plain">${alt}</span>`;

  return (
    `<div class="vg-qty-identity" ${claimAttrs(identity)}>` +
    `<math xmlns="http://www.w3.org/1998/Math/MathML" aria-label="${alt}" role="math">` +
    `${mathBody}</math>` +
    `<span class="vg-qty-identity-fallback">${fallbackFrac}</span>` +
    `</div>`
  );
}

/** Shared stylesheet — layout tokens only, never instance geometry from specs. */
export const HTML_VISUAL_CSS = `
:root {
  --vg-text: #1d1d1f;
  --vg-muted: #6b7280;
  --vg-border: #e5e7eb;
  --vg-surface: #f9fafb;
  --vg-accent: #2563eb;
  --vg-font: Inter, system-ui, -apple-system, sans-serif;
  --vg-min-font: 12px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 1rem;
  font-family: var(--vg-font);
  font-size: 16px;
  line-height: 1.45;
  color: var(--vg-text);
  background: #fff;
  overflow-x: hidden;
}

.vg-visual {
  max-width: 100%;
  margin: 0 auto;
}

.vg-question {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem;
  line-height: 1.35;
  text-wrap: pretty;
  max-width: 100%;
  overflow-wrap: anywhere;
  hyphens: auto;
}
.vg-question-text { display: inline; }
.vg-question-mark { white-space: nowrap; display: inline; }

.vg-banner {
  font-size: 0.875rem;
  color: var(--vg-muted);
  border: 1px solid var(--vg-border);
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
  background: var(--vg-surface);
}

.vg-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* comparison-matrix */
.vg-matrix-desktop { display: none; width: 100%; border-collapse: collapse; table-layout: fixed; }
.vg-matrix-desktop th,
.vg-matrix-desktop td {
  border: 1px solid var(--vg-border);
  padding: 0.625rem 0.75rem;
  vertical-align: top;
  text-align: left;
  word-wrap: break-word;
}
.vg-matrix-desktop th { background: var(--vg-surface); font-weight: 600; }
.vg-matrix-desktop .vg-dim-label { font-weight: 600; background: #fff; }
.vg-matrix-inherit { margin: 0; color: var(--vg-muted); font-style: italic; }

.vg-matrix-mobile { display: block; }
.vg-matrix-pole {
  border: 1px solid var(--vg-border);
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #fff;
}
.vg-matrix-pole h3 { margin: 0 0 0.75rem; font-size: 1rem; }
.vg-matrix-row { margin-bottom: 0.75rem; }
.vg-matrix-row dt { font-weight: 600; margin-bottom: 0.25rem; }
.vg-matrix-row dd { margin: 0; }
.vg-matrix-row ul, .vg-matrix-row ol { margin: 0.25rem 0 0; padding-left: 1.25rem; }
.vg-matrix-row li { margin-bottom: 0.25rem; }

@media (min-width: 768px) {
  .vg-matrix-desktop { display: table; }
  .vg-matrix-mobile { display: none; }
}

/* enumeration-set */
.vg-enum-groups { display: flex; flex-direction: column; gap: 1.25rem; }
.vg-enum-group {
  border: 1px solid var(--vg-border);
  padding: 0.875rem 1rem;
  background: #fff;
}
.vg-enum-group h3 { margin: 0 0 0.5rem; font-size: 1rem; }
.vg-enum-coverage-hint {
  font-size: 0.875rem;
  color: var(--vg-muted);
  margin: 0 0 0.5rem;
}
.vg-enum-subsection { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--vg-border); }
.vg-enum-subsection h4 { margin: 0 0 0.5rem; font-size: 0.9375rem; font-weight: 600; }
.vg-enum-list { margin: 0; padding-left: 1.25rem; }
.vg-enum-list li { margin-bottom: 0.35rem; }
.vg-enum-concurrent .vg-enum-list { list-style: disc; }
.vg-enum-concurrent .vg-enum-list li::marker { color: var(--vg-text); }

/* quantity-model */
.vg-qty-identity {
  font-size: 1.125rem;
  padding: 0.75rem 1rem;
  background: var(--vg-surface);
  border: 1px solid var(--vg-border);
  margin-bottom: 1rem;
  text-align: center;
}
.vg-qty-identity math {
  font-family: var(--vg-font);
  font-size: 1.25rem;
}
.vg-qty-identity-fallback { display: none; font-size: 1.125rem; }
@supports not (display: math) {
  .vg-qty-identity math { display: none; }
  .vg-qty-identity-fallback { display: block; }
}
.vg-frac-fallback { display: inline-flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; justify-content: center; }
.vg-frac { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1.1; }
.vg-frac-num, .vg-frac-den { padding: 0 0.2rem; }
.vg-frac-bar { display: block; width: 100%; border-top: 1.5px solid var(--vg-text); margin: 0.1rem 0; }
.vg-qty-states { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
.vg-qty-states th,
.vg-qty-states td {
  border: 1px solid var(--vg-border);
  padding: 0.625rem 0.75rem;
  text-align: left;
}
.vg-qty-states th { background: var(--vg-surface); }
.vg-qty-states .vg-num { font-variant-numeric: tabular-nums; white-space: normal; word-break: break-word; }
.vg-qty-insights { margin: 0; padding-left: 0; list-style: none; }
.vg-qty-insights li {
  padding: 0.625rem 0.75rem;
  border-left: 3px solid var(--vg-accent);
  background: var(--vg-surface);
  margin-bottom: 0.5rem;
}

@media print {
  body { padding: 0.5rem; font-size: 11pt; }
  .vg-banner { display: none; }
}
`;

export function renderComparisonMatrix(spec) {
  const poles = spec.poles || [];
  const dimensions = spec.dimensions || [];

  const desktop = [];
  desktop.push('<table class="vg-matrix-desktop">');
  desktop.push('<thead><tr><th scope="col">Dimension</th>');
  for (const pole of poles) {
    desktop.push(
      `<th scope="col" ${claimAttrs(pole)}>${escapeHtml(pole.label)}</th>`,
    );
  }
  desktop.push("</tr></thead><tbody>");

  dimensions.forEach((dim, dimIndex) => {
    desktop.push("<tr>");
    desktop.push(
      `<th scope="row" class="vg-dim-label" ${claimAttrs(dim)}>${escapeHtml(dim.label)}</th>`,
    );
    for (const pole of poles) {
      const cell = (dim.cells || []).find((c) => c.pole === pole.id);
      desktop.push("<td>");
      desktop.push(renderMatrixCellContent(dim, dimIndex, dimensions, pole, cell));
      desktop.push("</td>");
    }
    desktop.push("</tr>");
  });
  desktop.push("</tbody></table>");

  const mobile = ['<div class="vg-matrix-mobile">'];
  for (const pole of poles) {
    mobile.push(
      `<section class="vg-matrix-pole" aria-labelledby="pole-${escapeHtml(pole.id)}">`,
    );
    mobile.push(
      `<h3 id="pole-${escapeHtml(pole.id)}" ${claimAttrs(pole)}>${escapeHtml(pole.label)}</h3>`,
    );
    dimensions.forEach((dim, dimIndex) => {
      const cell = (dim.cells || []).find((c) => c.pole === pole.id);
      mobile.push('<dl class="vg-matrix-row">');
      mobile.push(`<dt ${claimAttrs(dim)}>${escapeHtml(dim.label)}</dt>`);
      mobile.push("<dd>");
      mobile.push(renderMatrixCellContent(dim, dimIndex, dimensions, pole, cell));
      mobile.push("</dd></dl>");
    });
    mobile.push("</section>");
  }
  mobile.push("</div>");

  return [
    `<figure class="vg-visual vg-comparison-matrix" data-primitive="comparison-matrix">`,
    renderQuestionCaption(spec.question),
    desktop.join("\n"),
    mobile.join("\n"),
    "</figure>",
  ].join("\n");
}

function renderEnumerationGroupBody(group) {
  const concurrent = group.membership_logic === "concurrent-set";
  const tag =
    group.ordering_semantics === "none" || !group.ordering_semantics ? "ul" : "ol";
  const cls = concurrent ? "vg-enum-list vg-enum-concurrent-list" : "vg-enum-list";
  const parts = [`<${tag} class="${cls}">`];
  for (const item of group.items || []) {
    parts.push(`<li ${claimAttrs(item)}>${escapeHtml(item.label)}</li>`);
  }
  parts.push(`</${tag}>`);
  return parts.join("\n");
}

function renderEnumerationSubsection(sub, parentId) {
  return [
    `<div class="vg-enum-subsection" aria-labelledby="sub-${escapeHtml(sub.id)}" data-parent-group="${escapeHtml(parentId)}">`,
    `<h4 id="sub-${escapeHtml(sub.id)}">${escapeHtml(sub.subsection_label || sub.label)}</h4>`,
    renderEnumerationGroupBody(sub),
    "</div>",
  ].join("\n");
}

export function renderEnumerationSet(spec) {
  const set = spec.set || {};
  const allGroups = spec.groups || [];
  const topLevel = allGroups.filter((g) => !g.subsection_of);
  const subsections = allGroups.filter((g) => g.subsection_of);

  const parts = [
    `<section class="vg-visual vg-enumeration-set" data-primitive="enumeration-set">`,
    renderQuestionHeading(spec.question, 2),
    `<p class="vg-enum-frame" ${claimAttrs(set)}>${escapeHtml(set.label)}</p>`,
    `<div class="vg-enum-groups">`,
  ];

  for (const group of topLevel) {
    const concurrent = group.membership_logic === "concurrent-set";
    const cls = concurrent ? "vg-enum-group vg-enum-concurrent" : "vg-enum-group";
    const purposeAttr = group.purpose
      ? ` data-purpose="${escapeHtml(group.purpose)}"`
      : "";
    const coverageAttr =
      group.coverage === "examples" ? ` data-coverage="examples"` : "";

    parts.push(
      `<section class="${cls}" aria-labelledby="grp-${escapeHtml(group.id)}"${purposeAttr}${coverageAttr} ${claimAttrs(group)}>`,
    );
    parts.push(
      `<h3 id="grp-${escapeHtml(group.id)}">${escapeHtml(group.label)}</h3>`,
    );

    if (group.coverage === "examples" && group.coverage_hint) {
      parts.push(
        `<p class="vg-enum-coverage-hint">${escapeHtml(group.coverage_hint)}</p>`,
      );
    }

    parts.push(renderEnumerationGroupBody(group));

    for (const sub of subsections.filter((s) => s.subsection_of === group.id)) {
      parts.push(renderEnumerationSubsection(sub, group.id));
    }

    parts.push("</section>");
  }

  parts.push("</div></section>");
  return parts.join("\n");
}

export function renderQuantityModel(spec) {
  const parts = [
    `<section class="vg-visual vg-quantity-model" data-primitive="quantity-model">`,
    renderQuestionHeading(spec.question, 2),
  ];

  for (const idn of spec.identities || []) {
    parts.push(renderIdentityMathml(idn));
  }

  const states = spec.states || [];
  const quantities = states[0]?.values?.map((v) => v.quantity) || [];

  parts.push('<table class="vg-qty-states"><thead><tr><th scope="col">État</th>');
  for (const q of quantities) {
    parts.push(`<th scope="col">${escapeHtml(q)}</th>`);
  }
  parts.push("</tr></thead><tbody>");

  for (const state of states) {
    parts.push(`<tr><th scope="row">${escapeHtml(state.label)}</th>`);
    for (const q of quantities) {
      const val = (state.values || []).find((v) => v.quantity === q);
      if (val) {
        parts.push(
          `<td class="vg-num" ${claimAttrs(val)}>${escapeHtml(String(val.value))} ${escapeHtml(val.unit)}</td>`,
        );
      } else {
        parts.push("<td>—</td>");
      }
    }
    parts.push("</tr>");
  }
  parts.push("</tbody></table>");

  if (spec.insights?.length) {
    parts.push('<ul class="vg-qty-insights">');
    for (const ins of spec.insights) {
      parts.push(`<li ${claimAttrs(ins)}>${escapeHtml(ins.label)}</li>`);
    }
    parts.push("</ul>");
  }

  parts.push("</section>");
  return parts.join("\n");
}

const RENDERERS = {
  "comparison-matrix": renderComparisonMatrix,
  "enumeration-set": renderEnumerationSet,
  "quantity-model": renderQuantityModel,
};

export function renderVisualSpecHtml(spec, options = {}) {
  const fn = RENDERERS[spec.primitive];
  if (!fn) {
    return { ok: false, errors: [`no HTML renderer for primitive "${spec.primitive}"`], html: null };
  }
  const body = fn(spec);
  const banner = options.banner
    ? `<p class="vg-banner">${escapeHtml(options.banner)}</p>`
    : "";
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(spec.element)}</title>
<style>${HTML_VISUAL_CSS}</style>
</head>
<body>
${banner}
${body}
</body>
</html>`;
  return { ok: true, errors: [], html, body };
}

export function renderVisualSpecHtmlBody(spec) {
  return renderVisualSpecHtml(spec).body;
}
