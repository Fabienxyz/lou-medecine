/** Shared fixtures for Renderer V2.1 smoke tests (cardio/234). */

export const CHAPTER_ID = "cardio/234";
export const CHAPTER_SLUG = "cardio/234-insuffisance-cardiaque";
export const RENDERER_PATH = "/demo/renderer/index.html";

export const DB_NAME = "lou-learner";

/** Composition V1 view fixtures — tab order from Reading View Model. */
export const VIEWS = {
  mentalModel: {
    viewId: "mental-model",
    tabIndex: 1,
    projection: "story",
    id: "story",
    element: "MM-pump-decompensation",
    contentMarker: "Reprenons la même trajectoire",
    samplePhrase: "débit adapté aux besoins",
    punctuationPhrase: "et/ou",
    accentedPhrase: "activation neurohormonale",
    longPhrase:
      "incapacité à assurer un débit adapté aux besoins et/ou à ne le faire qu'au prix de pressions de remplissage anormalement élevées",
    shortPhrase: "et/ou",
    threeParagraphPhrases: [
      "débit adapté aux besoins",
      "activation neurohormonale",
      "congestion pulmonaire",
    ],
  },
  notions: {
    viewId: "notions",
    tabIndex: 2,
    projection: "mechanisms",
    id: "mechanisms",
    element: "MEC-output-basics",
    contentMarker: "Commence par la définition physiopathologique",
    threeParagraphPhrases: [
      "débit adapté aux besoins",
      "volume d'éjection systolique",
      "précharge, la postcharge et la contractilité",
    ],
    sameParagraphPhrases: [
      "Le débit cardiaque",
      "volume d'éjection systolique",
      "fréquence cardiaque",
    ],
    samplePhrase: "débit adapté aux besoins",
    oapElement: "MEC-oap",
    oapPhrase: "PPC > 25 mmHg",
    oapBoldPhrase: "OAP cardio",
    oapOfficialTextId: "mec-oap-ppc-body",
    congestionElement: "MEC-congestion",
    congestionPhrase: "congestion pulmonaire est donc",
  },
  clinicalCases: {
    viewId: "clinical-cases",
    tabIndex: 3,
    projection: "clinical-reasoning",
    id: "clinical-reasoning",
    element: "CR-recognize",
    contentMarker: "Avant tout examen, pose le cadre",
    samplePhrase: "dyspnée d'effort",
    alternatePhrase: "orthopnée et la dyspnée paroxystique nocturne",
  },
};

/** Backward-compatible aliases for highlight scope (projection id in learner store). */
export const PROJECTIONS = {
  story: VIEWS.mentalModel,
  overview: {
    tabIndex: 1,
    projection: "overview",
    id: "overview",
    element: "MM-pump-decompensation",
    contentMarker: "Le chapitre entier tient dans une chaîne",
    samplePhrase: "Sur le plan physiopathologique",
    alternatePhrase: "débit adapté aux besoins",
  },
  mechanisms: VIEWS.notions,
  clinicalReasoning: VIEWS.clinicalCases,
};

export function chapterUrl(slug = CHAPTER_SLUG) {
  return `${RENDERER_PATH}?chapter=${encodeURIComponent(slug)}`;
}

export function projectionByTabIndex(index) {
  return Object.values(PROJECTIONS).find((p) => p.tabIndex === index);
}

export function viewByTabIndex(index) {
  return Object.values(VIEWS).find((v) => v.tabIndex === index);
}
