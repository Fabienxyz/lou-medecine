/**
 * Map Reading View Model views to Renderer navigation entries.
 * Presentation-only — no composition rules.
 */

/**
 * @param {{ views: Array<Record<string, unknown>> }} readingViewModel
 * @returns {Array<{ viewId: string, label: string, displayOrder: number, availability: string, view: Record<string, unknown> }>}
 */
export function buildNavigationFromViewModel(readingViewModel) {
  return (readingViewModel.views || [])
    .slice()
    .sort(function (a, b) {
      return a.displayOrder - b.displayOrder;
    })
    .map(function (view) {
      return {
        viewId: view.viewId,
        label: view.label,
        displayOrder: view.displayOrder,
        availability: view.availability,
        view: view,
      };
    });
}

if (typeof window !== "undefined") {
  window.LouCompositionNavigation = { buildNavigationFromViewModel };
}
