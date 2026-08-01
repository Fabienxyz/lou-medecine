# Matrice de conformité D7-F — Display Preferences (D7-A → D7-E)

| | |
|---|---|
| **Lot** | D7-F — Matrice de validation |
| **Date** | 2026-08-01 |
| **Verdict global** | **CONFORME — D7-F READY FOR D7-G** |

---

## Légende

| Symbole | Signification |
|---|---|
| ✅ | Validé par test D7-F |
| ◻ | Couvert par lot amont (D7-C/D/D7-E), non re-testé D7-F |
| ⚠ | Écart résiduel documenté, non bloquant |

---

## D7-A — DISPLAY-PREFERENCES-COMPONENT-CONTRACT

| Exigence | Statut | Preuve D7-F |
|---|---|---|
| Trois dimensions V1 (theme, fontSize, readingWidth) | ✅ | DP-F-02…04, DP-F-15/16 |
| Énumérations V1 inchangées | ✅ | Aucune modification Service |
| Singleton `display-preferences-v1` | ✅ | DP-F-05, DP-F-N02 |
| Cardinalité max = 1 | ✅ | DP-F-05, DP-F-N12 |
| Pas de scope Release/chapitre/vue | ✅ | DP-F-07/10, DP-F-N06 |
| Premier boot sans écriture | ✅ | DP-F-01, DP-F-N01 |
| Reset supprime enregistrement | ✅ | DP-F-06, DP-F-N04 |
| Domaine Snapshot `display_preferences` | ✅ | DP-F-01/07/08/09, DP-F-N05…08 |
| Import idempotent | ✅ | DP-F-08, DP-F-N07 |
| Application via attributs `data-dp-*` | ✅ | DP-F-02…05, DP-F-18 |
| Orthogonalité Session / Search / Composition | ✅ | DP-F-11…13, DP-F-N15…17 |
| Diagnostics invalid/stale | ✅ | DP-F-N10/11 |
| Erreurs I/O non silencieuses | ✅ | DP-F-N13/14 |

---

## D7-B — Conception technique

| Exigence | Statut | Preuve |
|---|---|---|
| Boot §8.2 — prefs avant reprise session | ✅ | DP-F-11, DP-F-N18 |
| Callback apply atomique sur `<html>` | ✅ | DP-F-02…05 |
| UI éphémère — Runtime seul I/O | ✅ | DP-F-05/06, ◻ D7-E |
| Reset logique sans recréer record | ✅ | DP-F-06 |
| `schema_version > 1` → stale + défauts | ✅ | DP-F-N11 |
| Import domaine absent / vide | ✅ | DP-F-09, DP-F-N08 |
| Doublons — résolution déterministe | ✅ | DP-F-N12 |
| Pas de préférence dans RestoreContext | ◻ | D7-E T-ORTHOG-01, DP-F-N15 |

---

## D7-C — Display Preferences Service

| Exigence | Statut | Preuve |
|---|---|---|
| Pureté (pas d'I/O) | ◻ | 41 tests D7-C |
| `buildDefaults` / `normalize` / `mergeAndNormalize` | ◻ | D7-C |
| `migrateToCurrent` | ✅ | DP-F-N10/11 |
| `RECORD_ID` / defaults V1 | ✅ | DP-F-01, DP-F-N01 |
| Service non modifié D7-F | ✅ | Aucun diff Service |

---

## D7-D — Runtime + Patrimony + Snapshot

| Exigence | Statut | Preuve |
|---|---|---|
| `loadAndApply` / `applyPatch` / `resetToDefaults` | ✅ | DP-F-02…06, Playwright + Node |
| Store `display_preferences` (IDB v8) | ✅ | DP-F-01/05/06 |
| Export domaine explicite vide ou 1 record | ✅ | DP-F-01/07, DP-F-N05/06 |
| Import upsert + apply | ✅ | DP-F-08, DP-F-N07 |
| `applyImportedRecord` | ◻ | D7-D tests |
| Runtime non modifié D7-F | ✅ | Aucun diff Runtime |

---

## D7-E — Intégration Reader

| Exigence | Statut | Preuve |
|---|---|---|
| Panel 3 selects + reset | ✅ | DP-F-02…06, DP-F-17 |
| Boot wiring `initDisplayPreferences` | ✅ | DP-F-11 |
| Effet visuel immédiat | ✅ | DP-F-15/16/18 |
| Labels explicites | ◻ | T-UI-A11Y-01 |
| Accessibilité clavier | ✅ | DP-F-17 (+ fix UI keydown) |
| `wasDisplayPreferencesLoaded()` | ✅ | DP-F-11 |
| Reader tests non-régression | ◻ | 15/15 D7-E PASS |

---

## Orthogonalité D4 — Session

| Exigence | Statut | Preuve |
|---|---|---|
| `loadAndApply` avant reprise | ✅ | DP-F-11, DP-F-N18 |
| ResumePlan inchangé | ✅ | DP-F-N15 |
| RestoreContext sans préférences | ◻ | D7-E T-ORTHOG-01 |
| Reprise session fonctionnelle après changement prefs | ✅ | DP-F-11 (navigation onglet) |

---

## Orthogonalité D6 — Local Search

| Exigence | Statut | Preuve |
|---|---|---|
| SearchHit[] ordre identique light/dark | ✅ | DP-F-12, DP-F-N16 |
| Snippets identiques | ✅ | DP-F-12 |
| Recherche fonctionnelle après prefs/reset | ✅ | DP-F-12 (post-modification implicite) |
| Index / cache Search non affectés | ◻ | D6 non modifié |

---

## Orthogonalité Composition / Offline

| Exigence | Statut | Preuve |
|---|---|---|
| Reading ViewModel identique | ✅ | DP-F-13, DP-F-N17 |
| Vues / ordre inchangés | ✅ | DP-F-13 |
| `offline_status` inchangé | ✅ | DP-F-14 |
| Prefs sans certification offline | ✅ | DP-F-01…18 en mode offline_ready |

---

## LEARNER-PATRIMONY / Snapshot E-D

| Exigence | Statut | Preuve |
|---|---|---|
| Domaine ACTIVE export/import | ✅ | DP-F-07/08/09 |
| Version incompatible rejetée | ✅ | DP-F-N09 |
| Import domaine absent — aucun effet | ◻ | D7-D snapshot tests |
| Patrimoine E-B/E-C/E-D non-régression | ✅ | Suite Renderer 589 PASS |

---

## Synthèse

| Lot | Conformité D7-F |
|---|---|
| D7-A | ✅ |
| D7-B | ✅ |
| D7-C | ✅ (non modifié) |
| D7-D | ✅ (non modifié) |
| D7-E | ✅ (+ fix a11y UI minimal) |
| D4 / D6 / Offline / Composition | ✅ orthogonalité démontrée |

**Verdict : D7-F READY FOR D7-G**
