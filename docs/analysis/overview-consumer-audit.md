# Audit — Consommateurs de `overview.md` (Reader V1)

| | |
|---|---|
| **Date** | 2026-08-03 |
| **Type** | Audit en lecture seule |
| **Question** | `overview.md` possède-t-il encore une responsabilité réelle dans l'architecture Reader V1 ? |
| **Contexte** | Post **Content Consumption Freeze** et **MM Cleanup** — le Renderer MM n'affiche plus `overview.md` |
| **Périmètre** | Dépôt `lou-medecine` — chapitre de référence `cardio/234` |
| **Nature** | Aucune modification de code, contrat, package ou PAS |

---

## 1. Synthèse exécutive

### Question posée

> Aujourd'hui, `overview.md` possède-t-il encore un consommateur légitime ?

### Réponse

**Non — pour l'architecture Reader V1 en tant que consommation produit.**

**Conclusion : C — Artefact historique devenu orphelin** *(au regard du Reader V1 post-MM Cleanup)*

`overview.md` n'a **plus de consommateur runtime légitime** dans l'expérience apprenant. Le Renderer Modèle mental consomme exclusivement `story.md` depuis le commit `e7c9b6a` (`normalizeMentalModelBlocks` + filtre SVG story).

Des **résidus structurels** subsistent (Composition spec, ReadingViewModel, Search, manifest, validation Fabrique) — ce sont des **bindings hérités**, pas des responsabilités produit actives.

Le fichier `overview.md` du 234 **documente lui-même** ce statut (ligne 12) :

> *« La vue Reader Modèle mental consomme `story` ; ce fichier reste la référence éditoriale du parcours figure-first. »*

---

## 2. Producteurs de `overview.md`

| # | Producteur | Fichier / étape | Rôle | Génération |
|---|---|---|---|---|
| P-01 | **Contenu éditorial humain** | `01-learning/chapters/<spec>/<item>/projections/understanding/overview.md` | Rédaction / maintenance manuelle du markdown | **Non généré** par pipeline LLM |
| P-02 | **Registre projections chapitre** | `projections.yaml` (`id: overview`, `type: understanding.overview`) | Déclare l'artefact publié, éléments, ordre | Déclaratif |
| P-03 | **Stage F — Projections** | `tools/lou-build/src/stages/projections.ts` → `loadAllProjectionClaimsSync` | **Valide** claim-trace et cohérence claims/inventory sur le fichier existant | Validation QC — ne crée pas le markdown |
| P-04 | **Stage J — Packaging** | `tools/lou-build/lib/package.js` | Assemble `manifest.json` depuis `projections.yaml` ; exige que le fichier existe | Copie métadonnées + digest |
| P-05 | **Identité release** | `tools/lou-build/lib/release-identity.js` | `content_digest` inclut les octets de `overview.md` s'il est dans le manifest | Hash matériel |
| P-06 | **Chemin canonique** | `tools/lou-build/lib/paths.js:29` | Constante `overview` → chemin standard | Référence outillage |
| P-07 | **Artefacts d'audit build** | ex. `build/projection-phase5-validation.json`, `build/projection-phase5-audit.md` | Traces historiques de couverture blueprint (234) | Généré lors d'audits passés — **non consommé runtime** |

### Pourquoi la Fabrique le « produit »

Historiquement, la projection `understanding.overview` était le **Chapter Overview** : carte compressée du chapitre (REFERENCE_IMPLEMENTATION_DESIGN.md §363, IMPLEMENTATION_CONTRACT.md). La Fabrique **ne génère pas** le prose de `overview.md` — elle **l'enregistre, valide et publie** s'il est déclaré dans `projections.yaml`.

---

## 3. Inventaire des consommateurs

Légende :

| Statut | Signification |
|---|---|
| **Actif** | Lit ou utilise le fichier aujourd'hui |
| **Passif** | Transporte le fichier sans interprétation sémantique |
| **Mort** | Référencé mais sans effet produit post-MM Cleanup |
| **Historique** | Usage pré-Composition ou pré-MM Cleanup |

### 3.1 Reader — Renderer

| Composant | Consommation | Statut | Preuve |
|---|---|---|---|
| `renderComposedBlocks` | Fetch + rendu markdown overview | **Mort** | `renderer.js:344-371` — `normalizeMentalModelBlocks` filtre overview ; `mental-model-consumption.test.js` assert zero fetch overview en product |
| `blocks.js` assemble | Parsing overview pour blocs MM | **Mort** | Overview block jamais assemblé post-normalisation |
| Legacy `renderProjection` | Chemin prototype 5 onglets | **Historique** | Mutuellement exclusif avec Composition V1 |

**Verdict Renderer : consommation display = aucune.**

### 3.2 Composition

| Composant | Consommation | Statut | Preuve |
|---|---|---|---|
| `corpus-composition-v1.json` | `{ kind: "projection", ref: "overview", mergeOrder: 2 }` pour `mental-model` | **Actif (déclaratif)** | Ligne 18 |
| `composition-engine.js` | Agrège blocs overview dans RVM | **Actif (structurel)** | `blocksFromProjection` → bloc `MM-pump-decompensation` source `overview` |
| Diagnostics | `published-projection-unconsumed` si overview absent du spec | **Actif** | `composition-engine.js:533-547` |

**Verdict Composition : binding encore actif, mais le Renderer l'ignore — ghost binding.**

### 3.3 ReadingViewModel

| Champ | Consommation | Statut |
|---|---|---|
| `mental-model.blocks[]` | Entrée `{ elementId: "MM-pump-decompensation", sourceProjectionId: "overview" }` | **Actif (RVM)** / **Mort (display)** |
| Navigation | Aucun onglet overview | N/A |

**Verdict RVM : overview présent dans le modèle logique, absent du DOM.**

### 3.4 Search (D6)

| Composant | Consommation | Statut | Preuve |
|---|---|---|---|
| `buildViewBindings` | `documentRefs: ["projections/understanding/overview.md"]` pour vue `mental-model` | **Actif** | `local-search-runtime-shared.js:104-119` via source Composition `overview` |
| Index local | Contenu overview indexé, hits routés vers MM | **Actif** | `collectIndexableDocumentRefs` inclut overview |

**Verdict Search : consommateur actif — mais contenu indexé **non affichable** dans MM post-cleanup (écart AAI-SEARCH-DISPLAY-01 documenté au Freeze). Consommation **non légitime** produit.**

### 3.5 Offline

| Composant | Consommation | Statut |
|---|---|---|
| `offline-runtime.js` / SW | Cache `/library/packages/<release_id>/projections/understanding/overview.md` | **Passif** — transport inclus dans digest |
| Certification | Fichier requis si déclaré manifest | **Passif** |

**Verdict Offline : stockage miroir du package, pas de sémantique overview.**

### 3.6 Session

| Composant | Consommation | Statut |
|---|---|---|
| `session-service.js` | Resume points `mental-model` via `element_block` | **Indirect** — scoping par elementId, pas par fichier overview |
| CE commits | Pas de commit spécifique overview | N/A |

**Verdict Session : pas de consommateur direct de `overview.md`.**

### 3.7 Patrimoine / Export

| Composant | Consommation | Statut |
|---|---|---|
| `learner-store.js` | Highlights/notes scopés `projection: "overview"` | **Historique** — annotations possibles en DB ; **DOM overview absent** post-MM Cleanup → restore impossible |
| Export snapshot | Inclut annotations overview si existantes | **Actif (données legacy)** |

**Verdict Patrimoine : résidus possibles ; pas de consommation contenu officiel.**

### 3.8 Lou Build / Validation / CI

| Composant | Consommation | Statut | Preuve |
|---|---|---|---|
| Stage F claims | Valide `overview.md` (claim-trace) | **Actif QC** | `claims.js:161-177` |
| Stage I validate | Échec si fichier manquant alors que déclaré | **Actif gate** | `loadAllProjectionClaimsSync` missing projection error |
| `lou-build validate` / CI | Package 234 doit contenir overview | **Actif gate** | Manifest + fichier requis |
| `content_digest` | Hash inclut overview | **Actif** | Identité release |

**Verdict Build : consommateur **pipeline** (validation/publication), pas Reader runtime.**

### 3.9 Tests

| Fichier | Rôle overview | Statut post-MM Cleanup |
|---|---|---|
| `composition-engine.test.js` | Assert RVM contient bloc overview | **Actif (RVM)** — attendu |
| `composition-navigation.test.js` | Assert sources incluent overview | **Actif (RVM)** |
| `mental-model-consumption.test.js` | Assert overview **non** fetch/rendu | **Actif (garde)** |
| `10-composition-navigation.spec.mjs` CN-02 | Assert zero `[data-source-projection="overview"]` | **Actif (garde)** |
| `17-product-composition-navigation.spec.mjs` CN-P-02 | Idem | **Actif (garde)** |
| `03-projections.spec.mjs` PR-* | `goToProjection(PROJECTIONS.overview)` cherche walkthrough overview | **Mort / cassé potentiel** — marker « Lis le schéma… » absent du DOM |
| `composition-runtime-identity.test.js` | Tests scoping projection overview (DOM synthétique) | **Actif (unit)** — ne teste pas le chemin nominal |
| `fixtures.mjs` PROJECTIONS.overview | Fixture smoke legacy | **Historique** |

### 3.10 Documentation / Méthodologie

| Document | Mention | Statut |
|---|---|---|
| `READER-COMPOSITION-V1-FREEZE.md` | MM = story + overview | **Normatif figé** — **décalé** vs runtime post-MM Cleanup |
| `21-CONTENT-CONSUMPTION-FREEZE.md` | Idem + H-02 dualité CP/story | **Audit** — note l'écart |
| `docs/rpc/10-BOUCLE-1-COMPREHENSION.md` D3 | Recertification walkthrough via story **+** overview | **Éditorial futur** — pas consommation Reader |
| `overview.md` ligne 12 (234) | Auto-déclaration orphan éditorial | **Actif (méta)** |

### 3.11 SVG / Visuels

| Lien | Statut |
|---|---|
| Génération SVG MM (`figures/mm-pump-decompensation.svg`) | **Aucun lien** — Stage G + `story.visuals` / `visual_elements` |
| `overview` sans entrée `visuals` dans manifest 234 | Overview ne porte pas le SVG |

**Verdict : overview.md n'alimente aucune génération SVG.**

---

## 4. Usages indirects

| Usage indirect | Encore actif ? | Détail |
|---|---|---|
| **Contrôle qualité Fabrique** | Oui | Stage F valide claim-trace sur overview si déclaré |
| **Export package / bibliothèque** | Oui (passif) | Octets inclus dans release |
| **Walkthrough apprenant** | **Non** | MM Cleanup → story seul |
| **Génération SVG** | Non | — |
| **Chantier documenté futur** | Partiel | RPC D3 : fusion/compression story+overview **en production éditoriale**, pas re-consommation Reader dual-channel |
| **Audit blueprint coverage** | Historique | `projection-phase5-audit.md` — snapshot 2026-07, overview couvrait alors 22 éléments ; overview 234 actuel = 1 bloc MM seulement |

---

## 5. Rôle architectural — conclusion

### Catégorie retenue : **C — Artefact historique devenu orphelin**

#### Argumentation

1. **Consommation produit nulle.** Le Renderer V1 n'affiche plus `overview.md` depuis MM Cleanup. C'est le seul consommateur d'expérience utilisateur.

2. **Auto-reconnaissance éditoriale.** Le fichier 234 déclare explicitement que le Reader consomme `story`, pas `overview`.

3. **Bindings restants = dette structurelle, pas responsabilité :**
   - Composition spec + RVM : ghost binding (RVM contient, Renderer ignore)
   - Search : indexe un contenu non affichable (régression produit latente)
   - Build : valide un fichier que le Reader ne montre plus

4. **Pas de catégorie A** : aucun parcours apprenant ne dépend de overview.md.

5. **Pas de catégorie B robuste** : RPC D3 mentionne overview comme **artefact de production transitoire** pour recertification walkthrough, avec objectif explicite de **compression en walkthrough court unique** — pas un consommateur Reader futur documenté. Aucune PAS, AAI ou spec Renderer ne prévoit le réaffichage de overview.

6. **Redondance sémantique.** Overview et story portent le même élément `MM-pump-decompensation` avec contenu parallèle (table guide vs prose story) — la duplication était la cause du MM Cleanup.

---

## 6. Impacts d'une suppression (si C confirmée)

**Niveau global : structurante** — pas triviale, pas faible.

| Domaine | Impact | Détail |
|---|---|---|
| **Fabrique** | Structurant | Retirer entrée `overview` de `projections.yaml` ; Stage F/I ne valideront plus le fichier ; regénérer packages ; claims `cb-overview-oap` dans chapter.package.yaml à migrer vers story/mechanisms |
| **Composition** | Structurant | Modifier `corpus-composition-v1.json` — retirer source `overview` de `mental-model` ; **gel Composition V1 actuellement figé** → décision produit requise |
| **Packages publiés** | Structurant | Nouveau `content_digest` ; republication chapitres |
| **Reader Renderer** | **Faible** | Déjà ignoré — suppression alignerait code et spec |
| **Search** | Faible | Binding overview disparaît avec Composition |
| **Tests** | Moyen | Mettre à jour composition-engine tests, smoke 03-projections (fixtures overview obsolètes), garder mental-model-consumption |
| **Documentation normative** | Structurant | READER-COMPOSITION-V1-FREEZE, TEST_ARCHITECTURE PAS-MM, 21-FREEZE à réviser |
| **Patrimoine apprenant** | Faible | Annotations `projection=overview` orphelines — déjà non restaurables post-MM Cleanup |

### Ordre de suppression recommandé (future mission — ne pas exécuter ici)

1. Décision produit + révision gel Composition (retirer `overview` de mental-model sources)
2. Fusionner contenu éditorial utile (table figure-first) dans `story.md` si encore pertinent
3. Retirer `overview` de `projections.yaml` par chapitre
4. Supprimer fichiers `overview.md`
5. Rebuild / validate / sync fixtures
6. Mettre à jour tests et docs normatifs
7. Vérifier Search + PAS-MM

---

## 7. Recommandation pour décision définitive

### Décision proposée

**Supprimer `overview.md` de la chaîne Reader V1** après mise à jour du gel Composition — l'artefact n'a plus de consommateur légitime.

### Actions immédiates (sans suppression)

| Priorité | Action |
|---|---|
| **P0** | Ouvrir décision produit : réviser `corpus-composition-v1.json` pour retirer `overview` de `mental-model` |
| **P1** | Retirer binding Search overview (suivra Composition) |
| **P1** | Réparer ou retirer tests smoke `03-projections.spec.mjs` utilisant `PROJECTIONS.overview` (incompatibles MM Cleanup) |
| **P2** | Mettre à jour docs normatifs figés (Composition Freeze, PAS-MM critères « story + overview agrégé ») |
| **P2** | RPC D3 : clarifier que le walkthrough MM cible **un seul** artefact (`story`) post-cleanup |

### Ce qu'il ne faut pas faire

- Supprimer `overview.md` **avant** de retirer la source Composition — sinon diagnostic `view-without-resolved-source` ou projection non consommée
- Considérer Search comme consommateur légitime — c'est un résidu à corriger, pas une justification de maintien

---

## 8. Réponse directe à la question

| Question | Réponse |
|---|---|
| `overview.md` a-t-il un consommateur **légitime** Reader V1 aujourd'hui ? | **Non** |
| Conclusion | **C — orphelin** (résidus structurels à nettoyer) |
| Peut-on supprimer sans mission structurante ? | **Non** — impact Composition + Fabrique + docs normatifs |
| Le contenu overview est-il inutile éditorialement ? | **Partiellement** — table figure-first peut migrer vers `story` ; le fichier lui-même n'a plus de rôle Reader |

---

## Historique

| Version | Date | Changement |
|---|---|---|
| **1.1** | 2026-08-03 | Suppression `overview` — règle un artefact éditorial principal par vue |
| **1.0** | 2026-08-03 | Audit initial post-MM Cleanup |

### Implémentation (2026-08-03)

La décision **C — orphelin** a été appliquée :

- `overview` retiré de `corpus-composition-v1.json`, `projections.yaml`, manifests 234/330
- Fichiers `overview.md` supprimés
- **Pas de fusion éditoriale** : le walkthrough MM de `story.md` couvre déjà le parcours figure-first ; la table `overview.md` était redondante et non affichée depuis MM Cleanup
