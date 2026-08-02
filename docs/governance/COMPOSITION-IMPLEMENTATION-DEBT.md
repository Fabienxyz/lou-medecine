# Dette d'implémentation — Couche de composition

| | |
|---|---|
| **Type** | Inventaire technique — **informatif** |
| **Statut** | **Clôturé** — migration Reader Composition V1 (Lots A–F, 2026-07-31) ; audit indépendant ✅ Conforme |
| **Tag attendu** | `reader-composition-v1` — après commit de gouvernance |
| **Contrat cible** | [`COMPOSITION-COMPONENT-CONTRACT.md`](../contracts/components/COMPOSITION-COMPONENT-CONTRACT.md) |
| **Règle** | Ce document conserve l'inventaire baseline pré-implémentation ; les entrées résolues sont marquées ci-dessous |

---

## Clôture migration (Lot F)

**Chemin nominal actif :**

```
Composition Specification → Composition Engine → Reading View Model → Renderer → Learner Layer
```

| Zone | Résolution |
|---|---|
| §1 Labels produit en amont | **Lot E** — `label` retiré amont ; gate lou-build ; manifests régénérés |
| §2 Emojis | **Lot E/F** — spec = seule source ; `TABS` legacy isolé (manifest 404) |
| §3 Ordre d'affichage | **Lots B/C–D** — `displayOrder` spec ; `buildProjectionTabs` supprimé |
| §4 `known_absent` ids produit | **Lot E** — recentré familles production ; plus de pseudo-vues `actors`/`readiness` |
| §5 Fallbacks codés en dur | **Lot F** — `projectionTabLabel()` supprimé ; `TABS` conservé ADR-002 uniquement |
| §6 projection = onglet | **Lots C–F** — navigation depuis View Model ; nominal sans `buildProjectionTabs` |
| §9 Modules cibles | **Lots B/C** — `composition/` livré |
| §10 Tests | **Lots D–F** — tests View Model ; nominal path test ajouté |

**Hors scope clôturé (dette résiduelle documentée, non bloquante V1) :** §7 gate convention blocs pipeline · §8 Package Access refactor · catalogue corpus (D6).

---

## Inventaire baseline (pré-implémentation — 2026-07-28)

> **Archive historique uniquement.** Toutes les entrées ci-dessous ont été **résolues** par la migration Reader Composition V1 (Lots A–F, clôturée 2026-07-31). Ce corps de document **ne décrit pas** l'état actuel du code ni du produit. Pour le modèle produit : [`00-READER-V1-PRODUCT-MODEL.md`](../renderer/00-READER-V1-PRODUCT-MODEL.md). Pour la clôture : tableau « Clôture migration » ci-dessus.

Inventaire des éléments à migrer lors de la phase d'implémentation (baseline figée avant migration). Chaque entrée indique l'emplacement actuel **à la date baseline**, la violation contractuelle et l'action cible **désormais réalisée**.

---

## 1. Labels produit en amont

| Fichier | Élément | Violation | Action cible |
|---|---|---|---|
| `01-learning/chapters/cardio/234/projections.yaml` | `label: "📖 Histoire"` (l.9) | Vocabulaire produit dans configuration package | Retirer `label` ; porter dans Composition Specification |
| `01-learning/chapters/cardio/234/projections.yaml` | `label: "🗺️ Vue d'ensemble"` (l.18) | idem | idem |
| `01-learning/chapters/cardio/234/projections.yaml` | `label: "❓ Pourquoi ?"` (l.32) | idem | idem |
| `01-learning/chapters/cardio/234/projections.yaml` | `label: "🩺 Raisonnement clinique"` (l.53) | idem | idem |
| `tools/lou-build/lib/package.js` | `if (p.label) entry.label = p.label` (l.63) | Recopie vocabulaire produit dans manifest | Retirer recopie ; gate interdisant `label` en entrée |
| `01-learning/chapters/cardio/234/manifest.json` | `"label"` sur chaque projection (l.22, 35, 47, 72) | Manifest porte vocabulaire interface | Disparaît au prochain build après retrait amont |

---

## 2. Emojis

| Fichier | Élément | Action cible |
|---|---|---|
| `projections.yaml` | Emojis dans les quatre `label` | Composition Specification — champ `label` par vue |
| `manifest.json` | Emojis propagés via `label` | Disparaît avec retrait amont |
| `demo/renderer/config.js` | `TABS[].label` avec emojis (l.46–70) | Legacy fallback — conserver isolé ou migrer vers spec |
| `demo/renderer/config.js` | `projectionTabLabel()` fallbacks avec emojis (l.115–118) | Supprimer après spec ; spec = seule source |

---

## 3. Ordre d'affichage confondu avec ordre pédagogique

| Fichier | Élément | Violation | Action cible |
|---|---|---|---|
| `projections.yaml` | `order: 1..4` sur projections | Utilisé comme ordre d'onglets dans `buildProjectionTabs` | Conserver `order` comme ordre pédagogique package ; `displayOrder` dans spec pour vues |
| `manifest.json` | `"order": 1..4` | idem | idem |
| `demo/renderer/renderer.js` | `buildProjectionTabs` trie par `order` puis crée onglets (l.130–171) | 1 projection = 1 onglet, ordre = affichage | Remplacer par `compose()` → View Model trié par `displayOrder` |
| `demo/renderer/app.js` | `tabs` = sortie directe de `buildProjectionTabs` (l.180) | Navigation = registre projections | Navigation depuis View Model |

---

## 4. Identifiants d'onglets produit dans `known_absent`

| Fichier | Élément | Violation | Action cible |
|---|---|---|---|
| `chapter.package.yaml` | `known_absent: [mastery, actors, readiness]` (l.8–11) | Mélange famille production (`mastery`) et ids vue produit (`actors`, `readiness`) | `mastery` : conserver comme absence famille ; `actors`/`readiness` : déclarer dans Composition Specification comme vues `known_absent` |
| `manifest.json` | `"known_absent": ["mastery", "actors", "readiness"]` | idem | idem |
| `demo/renderer/renderer.js` | `knownAbsent.has(p.id)` croise projections et absences (l.138) | Sémantique mixte | Séparer résolution package vs politique vue spec |
| `demo/renderer/test/smoke/fixtures.mjs` | `ABSENT_PROJECTIONS = ["actors", "readiness", "mastery"]` | Test encode la confusion | Scinder fixtures package / spec |
| `demo/renderer/test/compliance-nc.test.js` | `known_absent` inclut ids produit (l.24) | idem | idem |

---

## 5. Fallbacks codés en dur

| Fichier | Élément | Action cible |
|---|---|---|
| `demo/renderer/config.js` | `projectionTabLabel()` — mapping id → label (l.113–119) | Supprimer ; spec résout les libellés |
| `demo/renderer/config.js` | `TABS` registry legacy (l.43–73) | Conserver derrière pont legacy ADR-002 ; ne pas étendre |
| `demo/renderer/config.js` | `LEGACY_CHAPTER_ALIASES` (l.13–15) | Configuration technique — acceptable ; documenter comme Package Access |
| `demo/renderer/README.md` | « manifest carries tab label » (l.161) | Mettre à jour post-implémentation |

---

## 6. Relation implicite projection = onglet

| Fichier | Élément | Action cible |
|---|---|---|
| `demo/renderer/renderer.js` | `buildProjectionTabs()` — une entrée par projection (l.125–171) | Remplacer par Composition Engine |
| `demo/renderer/app.js` | `buildTabs()` itère `tabs` comme onglets (l.48–51) | Itérer `viewModel.views` |
| `demo/renderer/app.js` | `loadTab()` charge `tab.path` projection (l.77+) | Charger via View Model — projection(s) résolues |
| `demo/renderer/README.md` | « every projection becomes a tab » (l.110) | Corrigé post-implémentation |

---

## 7. Découpage implicite des blocs par Markdown

| Fichier | Élément | Violation | Action cible |
|---|---|---|---|
| `demo/renderer/blocks.js` | `isBoundary = H2 && id && known.has(id)` (l.72–74) | Heuristique non validée amont | Gate build ; composition résout blocs avant Renderer |
| `demo/renderer/blocks.js` | `assemble()` reconstruit structure depuis DOM Markdown (l.61–77) | Reconstruction côté client | `blocks[]` pré-résolus dans View Model |
| `demo/renderer/README.md` | « one ## question {#ELEMENT-ID} per projected element » (l.161) | Convention implicite | Formaliser comme contrat de publication + gate |
| Pipeline (futur) | Aucune gate « block structure » | Convention non vérifiée | Ajouter gate doc 19 — hors scope formalisation |

---

## 8. Chemins physiques connus directement du Reader

| Fichier | Élément | Nature | Action cible |
|---|---|---|---|
| `demo/renderer/config.js` | `CHAPTERS_ROOT: "../../01-learning/chapters"` (l.4) | Config technique Package Access | Acceptable — isoler module Package Access |
| `demo/renderer/config.js` | `LEGACY_ASSETS_ROOT` (l.9) | Pont legacy | ADR-002 — extinction planifiée |
| `demo/renderer/config.js` | `resolveAssetPath()` (l.104–107) | Résolution URL | Package Access — pas Composition |
| `demo/renderer/renderer.js` | `fetch` direct projection path depuis manifest (l. via `renderProjection`) | Accès artefact | Package Access résout ; Composition référence identités |
| `demo/renderer/app.js` | `traceIndexUrl` depuis `manifest.trace_index` (l.181–183) | Sidecar traçabilité | View Model `traceReferences` |

---

## 9. Absence de modules cibles

| Module à créer | Rôle | Source actuelle absorbée |
|---|---|---|
| `composition-engine.js` (nom indicatif) | `compose(manifest, spec)` | `renderer.buildProjectionTabs()` + logique onglets dans `app.js` |
| `composition-spec/` (répertoire indicatif) | Specs versionnées Reader | `projections.yaml` labels + mapping vues |
| `reading-view-model.js` (nom indicatif) | Type / validateur View Model | N/A — nouveau |
| Refactor `renderer.js` | Consomme View Model | Fetch manifest + parse markdown + tabs |
| Refactor `blocks.js` | Consomme blocs résolus | Heuristique H2 |

---

## 10. Tests à migrer ou ajouter

| Fichier / zone | Action |
|---|---|
| `demo/renderer/test/compliance-nc.test.js` | Retirer dépendance à `label` manifest ; tester via View Model |
| `demo/renderer/test/smoke/fixtures.mjs` | Séparer fixtures manifest / spec |
| Nouveaux tests unitaires | `compose()` déterminisme, agrégation multi-projection, diagnostics |
| Tests Renderer | Fixtures View Model synthétiques — sans fetch manifest |

---

## 11. Ordre de migration recommandé

1. **Composition Specification** pour `cardio/234` — mapper 7 vues cibles doc 14–15 (même si partiellement `known_absent`).
2. **Composition Engine** + tests unitaires — parallèle au code existant.
3. **Retrait `label`** amont + gate — rebuild `cardio/234`.
4. **Reading View Model** consommé par Renderer — remplacer `buildProjectionTabs`.
5. **Gate convention blocs** pipeline — durcir `blocks.js`.
6. **Nettoyage `known_absent`** — séparer familles production / vues produit.
7. **Catalogue corpus** — contrat séparé (D6).
