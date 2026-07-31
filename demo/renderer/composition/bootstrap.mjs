import { compose } from "./composition-engine.js";
import { buildNavigationFromViewModel } from "./navigation.js";

let corpusSpecPromise = null;

export function loadCorpusSpec() {
  if (!corpusSpecPromise) {
    corpusSpecPromise = fetch(
      new URL("./corpus-composition-v1.json", import.meta.url)
    ).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load corpus composition spec");
      }
      return response.json();
    });
  }
  return corpusSpecPromise;
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
