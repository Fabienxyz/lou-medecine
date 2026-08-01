import { compose } from "./composition-engine.js";
import { buildNavigationFromViewModel } from "./navigation.js";
import corpusSpec from "./corpus-composition-v1.json" with { type: "json" };

export function loadCorpusSpec() {
  return Promise.resolve(corpusSpec);
}

export async function buildReadingViewModel(manifest) {
  const spec = await loadCorpusSpec();
  return compose(manifest, spec);
}

window.LouComposition = {
  compose,
  loadCorpusSpec,
  buildReadingViewModel,
  buildNavigationFromViewModel,
};
