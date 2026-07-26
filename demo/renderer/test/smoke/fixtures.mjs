/** Shared fixtures for Renderer V2.1 smoke tests (cardio/234). */

export const CHAPTER_ID = "cardio/234";
export const CHAPTER_SLUG = "cardio/234-insuffisance-cardiaque";
export const RENDERER_PATH = "/demo/renderer/index.html";

export const DB_NAME = "lou-learner";

/** Published projections in manifest order (cardio/234). */
export const PROJECTIONS = {
  story: {
    id: "story",
    tabIndex: 0,
    element: "MM-pump-decompensation",
    contentMarker: "Reprenons la même trajectoire",
    samplePhrase: "débit adapté aux besoins",
    punctuationPhrase: "et/ou",
    accentedPhrase: "activation neurohormonale",
    longPhrase:
      "incapacité à assurer un débit adapté aux besoins et/ou à ne le faire qu'au prix de pressions de remplissage anormalement élevées",
    shortPhrase: "et/ou",
  },
  overview: {
    id: "overview",
    tabIndex: 1,
    element: "MM-pump-decompensation",
    contentMarker: "Le chapitre entier tient dans une chaîne",
    samplePhrase: "Sur le plan physiopathologique",
    alternatePhrase: "débit adapté aux besoins",
  },
  mechanisms: {
    id: "mechanisms",
    tabIndex: 2,
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
    congestionElement: "MEC-congestion",
    congestionPhrase: "congestion pulmonaire est donc",
  },
  clinicalReasoning: {
    id: "clinical-reasoning",
    tabIndex: 3,
    element: "CR-recognize",
    contentMarker: "Avant tout examen, pose le cadre",
    samplePhrase: "dyspnée d'effort",
    alternatePhrase: "orthopnée et la dyspnée paroxystique nocturne",
  },
};

/** Projections listed in manifest.known_absent — not yet published for this chapter. */
export const ABSENT_PROJECTIONS = ["actors", "readiness", "mastery"];

export function chapterUrl(slug = CHAPTER_SLUG) {
  return `${RENDERER_PATH}?chapter=${encodeURIComponent(slug)}`;
}

export function projectionByTabIndex(index) {
  return Object.values(PROJECTIONS).find((p) => p.tabIndex === index);
}
